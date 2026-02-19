import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

@Injectable()
export class DrupalAuthService implements OnModuleInit {
  private readonly logger = new Logger(DrupalAuthService.name);
  private readonly CACHE_TTL = 1000 * 60 * 60 * 2;
  private cachedCookie: string | null = null;
  private lastLoginTime: number = 0;
  private drupalUsername: string;
  private drupalPassword: string;
  private puppeteerExecutablePath: string | undefined;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Check required environment variables at startup
    const drupalUsername = this.configService.get('DRUPAL_USERNAME');
    const drupalPassword = this.configService.get('DRUPAL_PASSWORD');
    this.puppeteerExecutablePath = this.configService.get(
      'PUPPETEER_EXECUTABLE_PATH',
    );

    if (!drupalUsername || !drupalPassword) {
      throw new Error(
        'DRUPAL_USERNAME and DRUPAL_PASSWORD environment variables must be set',
      );
    }

    this.drupalUsername = drupalUsername;
    this.drupalPassword = drupalPassword;

    this.logger.log('Drupal credentials configured');
  }

  /**
   * Returns a valid cookie string for HTTP headers.
   * If cached and fresh, returns immediately.
   * If missing or expired, launches Puppeteer to login first.
   */
  async getSessionCookie(onLog?: (msg: string) => void): Promise<string> {
    const now = Date.now();

    if (this.cachedCookie && now - this.lastLoginTime < this.CACHE_TTL) {
      onLog?.('Using cached session cookie.');
      return this.cachedCookie;
    }

    onLog?.('Cookie missing or expired. Starting Puppeteer login...');
    this.cachedCookie = await this.performPuppeteerLogin(onLog);
    this.lastLoginTime = Date.now();
    return this.cachedCookie;
  }

  private async performPuppeteerLogin(
    onLog?: (msg: string) => void,
  ): Promise<string> {
    onLog?.('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true, // Use headless for production
      executablePath: this.puppeteerExecutablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // --- YOUR LOGIN LOGIC HERE ---
      onLog?.('Navigating to login page...');
      await page.goto('https://more.esn.it/?q=user/login', {
        waitUntil: 'networkidle2',
      });

      // Trigger Antibot
      onLog?.('Bypassing antibot...');
      await page.mouse.move(100, 100);
      await page.keyboard.press('Tab');

      // Wait for and click the custom login link
      onLog?.('Filling credentials...');
      await page.waitForSelector('.uncas-link');
      await page.click('.uncas-link');

      // Fill form
      await page.waitForSelector('#edit-name');
      await page.type('#edit-name', this.drupalUsername);
      await page.type('#edit-pass', this.drupalPassword);

      // Submit
      onLog?.('Submitting form...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('#edit-submit'),
      ]);

      onLog?.('Login successful! Extracting cookies...');

      // --- EXTRACT COOKIES ---
      const cookies = await page.cookies();

      // Convert Puppeteer cookie objects to a standard "key=value; " header string
      const cookieString = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');

      return cookieString;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      onLog?.(`Error: ${errorMessage}`);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
