import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { ElementHandle, Frame } from 'puppeteer';
import { DrupalAuthService } from './drupal-auth.service';

// Define a simpler interface that matches both Multer and local files
export interface UploadableFile {
  path: string;
  originalname: string;
}

@Injectable()
export class DrupalImageService {
  private readonly logger = new Logger(DrupalImageService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: DrupalAuthService,
  ) {}

  async uploadImages(
    files: Array<UploadableFile>,
    onLog?: (msg: string) => void,
  ): Promise<{ filename: string; status: 'success' | 'error' }[]> {
    const results: { filename: string; status: 'success' | 'error' }[] = [];
    let browser = null;

    try {
      onLog?.('Initializing browser for upload...');

      // Get the Session Cookie String
      const cookieString = await this.authService.getSessionCookie(onLog);

      // Launch Browser
      browser = await puppeteer.launch({
        headless: this.configService.get('NODE_ENV') !== 'development',
        executablePath: this.configService.get('PUPPETEER_EXECUTABLE_PATH'),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Set Cookies (Parse string back to objects)
      const cookies = this.parseCookieString(cookieString, 'more.esn.it');
      await page.setCookie(...cookies);

      // Navigate to IMCE
      onLog?.('Navigating to IMCE File Manager...');
      await page.goto('https://more.esn.it/?q=user/1/imce', {
        waitUntil: 'networkidle2',
      });

      // Wait for the IMCE iframe to load
      const imceFrame = await page.waitForSelector('iframe[src*="imce"]', {
        timeout: 10000,
      });
      if (!imceFrame) {
        throw new Error('IMCE iframe not found');
      }
      const frame = await imceFrame.contentFrame();

      // Trigger Antibot
      onLog?.('I am really not a bot...');
      await page.mouse.move(100, 100);
      await page.keyboard.press('Tab');

      // Select "members" folder
      onLog?.('Selecting "members" folder...');

      // Handle any alert dialogs that might appear when selecting the folder
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      // Click the specific anchor for "members"
      // The selector looks for an <a> with title="members" inside the tree
      const membersFolderSelector = 'a.folder[title="members"]';
      await frame.waitForSelector(membersFolderSelector, {
        timeout: 50000, // 5s timeout to find the folder
      });
      await frame.click(membersFolderSelector);

      // Wait for file list to populate (> 50 items sanity check)
      onLog?.('Waiting for file list to load...');
      await frame.waitForFunction(
        () => {
          const rows = document.querySelectorAll(
            '#file-list > tbody:nth-child(1) tr',
          );
          return rows.length > 50;
        },
        { timeout: 10000 },
      );

      // Open Upload Tab (Click "Upload" in toolbar)
      // We do this once, as the panel stays open
      const uploadTabSelector = '#op-item-upload a[name=upload]';
      if (await frame.$(uploadTabSelector)) {
        await frame.click(uploadTabSelector);
        // Wait for the form to be visible
        await frame.waitForSelector('#op-content-upload', { visible: true });
      }

      // Process Files Loop
      for (const file of files) {
        try {
          onLog?.(`Uploading ${file.originalname}...`);
          await this.uploadSingleFile(frame, file.path, file.originalname);
          results.push({ filename: file.originalname, status: 'success' });
          onLog?.(`✅ Uploaded: ${file.originalname}`);
        } catch (err) {
          this.logger.error(`Failed to upload ${file.originalname}`, err);
          results.push({ filename: file.originalname, status: 'error' });
          onLog?.(`❌ Failed: ${file.originalname}`);
        }
      }
    } catch (error) {
      this.logger.error('Critical upload error', error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }

  private async uploadSingleFile(
    frame: Frame,
    filePath: string,
    originalName: string,
  ) {
    // Attach file to input
    const fileInputSelector = '#edit-imce';
    const fileInput = (await frame.waitForSelector(
      fileInputSelector,
    )) as ElementHandle<HTMLInputElement>;
    if (!fileInput) throw new Error('File input not found');

    // Clear previous input if needed (usually strictly not needed if we submit, but good practice)
    await fileInput.uploadFile(filePath);

    // Click Upload/Submit
    const submitBtnSelector = '#edit-upload';
    await frame.click(submitBtnSelector);

    // Wait for success signal
    // The user noticed that <div id="file-preview">...<img src="...name...">...</div> appears
    // We wait for the file preview to appear AND contain our filename
    await frame.waitForFunction(
      (name) => {
        const preview = document.querySelector('#file-preview');
        const img = preview?.querySelector('img');
        return img?.src.includes(name);
      },
      { timeout: 15000 }, // 15s timeout for upload
      originalName,
    );
  }

  /**
   * Helper to convert "key=value; key2=value2" string into Puppeteer cookie objects
   */
  private parseCookieString(cookieString: string, domain: string) {
    return cookieString.split('; ').map((part) => {
      const [name, ...rest] = part.split('=');
      return {
        name,
        value: rest.join('='),
        domain,
        path: '/',
      };
    });
  }
}
