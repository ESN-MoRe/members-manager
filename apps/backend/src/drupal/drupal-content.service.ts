import type { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';
import type { DrupalAuthService } from './drupal-auth.service';

@Injectable()
export class DrupalContentService {
  private readonly logger = new Logger(DrupalContentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: DrupalAuthService,
  ) {}

  async getAboutUsContent(
    onLog?: (msg: string) => void,
    retry = true,
  ): Promise<string> {
    // 1. Get the cookie (either from cache or fresh login)
    const cookie = await this.authService.getSessionCookie(onLog);

    try {
      onLog?.('Fetching protected content via Axios...');

      // 2. Make the HTTP Request
      const response = await firstValueFrom(
        this.httpService.get('https://more.esn.it/?q=node/104/edit', {
          headers: {
            Cookie: cookie,
            // Mimic a browser just in case
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }),
      );

      // 3. Parse HTML with Cheerio
      onLog?.('Parsing content with Cheerio...');
      const $ = cheerio.load(response.data as string);

      // Select the textarea and get its value
      const content = $('#edit-body-und-0-value').val(); // .val() for inputs/textareas

      if (typeof content !== 'string') {
        this.logger.warn('Textarea not found. Cookie might be invalid.');
        throw new UnauthorizedException('Content not found');
      }

      onLog?.('Content retrieved successfully.');
      return content;
    } catch (error) {
      // 4. Retry Logic: If Axios gets a 403/401, the cookie might be stale.
      if (retry) {
        this.logger.warn('Request failed. Invalidating cache and retrying...');
        // Force a fresh login by clearing/ignoring cache (you might need a method in AuthService to force clear)
        // For now, we'll just let the recursive call handle it if you implement cache clearing.
        // Ideally: await this.authService.invalidateCache();
        return this.getAboutUsContent(onLog, false);
      }
      throw error;
    }
  }
}
