import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { ElementHandle, Page } from 'puppeteer';
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

      // 1. Get the Session Cookie String
      const cookieString = await this.authService.getSessionCookie(onLog);

      // 2. Launch Browser
      browser = await puppeteer.launch({
        headless: true, // Set to false to debug visually
        executablePath: this.configService.get('PUPPETEER_EXECUTABLE_PATH'),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // 3. Set Cookies (Parse string back to objects)
      const cookies = this.parseCookieString(cookieString, 'more.esn.it');
      await page.setCookie(...cookies);

      // 4. Navigate to IMCE
      onLog?.('Navigating to IMCE File Manager...');
      await page.goto('https://more.esn.it/?q=user/1/imce', {
        waitUntil: 'networkidle2',
      });

      // 5. Select "members" folder
      onLog?.('Selecting "members" folder...');
      // Wait for the tree to load
      await page.waitForSelector('ul#navigation-tree');

      // Click the specific anchor for "members"
      // The selector looks for an <a> with title="members" inside the tree
      const membersFolderSelector = 'ul#navigation-tree a[title="members"]';
      await page.waitForSelector(membersFolderSelector);
      await page.click(membersFolderSelector);

      // 6. Wait for file list to populate (> 50 items sanity check)
      onLog?.('Waiting for file list to load...');
      await page.waitForFunction(
        () => {
          const rows = document.querySelectorAll(
            '#file-list > tbody:nth-child(1) tr',
          );
          return rows.length > 50;
        },
        { timeout: 10000 },
      );

      // 7. Open Upload Tab (Click "Upload" in toolbar)
      // We do this once, as the panel stays open
      const uploadTabSelector = '#op-item-upload a[name=upload]';
      if (await page.$(uploadTabSelector)) {
        await page.click(uploadTabSelector);
        // Wait for the form to be visible
        await page.waitForSelector('#op-content-upload', { visible: true });
      }

      // 8. Process Files Loop
      for (const file of files) {
        try {
          onLog?.(`Uploading ${file.originalname}...`);
          await this.uploadSingleFile(page, file.path, file.originalname);
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
    page: Page,
    filePath: string,
    originalName: string,
  ) {
    // 1. Attach file to input
    const fileInputSelector = '#edit-imce';
    const fileInput = (await page.waitForSelector(
      fileInputSelector,
    )) as ElementHandle<HTMLInputElement>;
    if (!fileInput) throw new Error('File input not found');

    // Clear previous input if needed (usually strictly not needed if we submit, but good practice)
    await fileInput.uploadFile(filePath);

    // 2. Click Upload/Submit
    const submitBtnSelector = '#edit-upload';
    await page.click(submitBtnSelector);

    // 3. Wait for success signal
    // The user noticed that <div id="file-preview">...<img src="...name...">...</div> appears
    // We wait for the file preview to appear AND contain our filename
    await page.waitForFunction(
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
