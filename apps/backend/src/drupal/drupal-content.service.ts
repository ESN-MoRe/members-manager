import { HttpService } from '@nestjs/axios';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager/dist/cache.constants';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';
import { DrupalAuthService } from './drupal-auth.service';

@Injectable()
export class DrupalContentService {
  private readonly logger = new Logger(DrupalContentService.name);
  private readonly CACHE_KEY = 'drupal_about_us_content';
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private fetchPromise: Promise<string> | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: DrupalAuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAboutUsContent(
    onLog?: (msg: string) => void,
    retry = true,
  ): Promise<string> {
    // 0. Check Cache First
    const cachedContent = await this.cacheManager.get<string>(this.CACHE_KEY);
    if (cachedContent) {
      onLog?.('Content retrieved from cache.');
      return cachedContent;
    }

    // Prevent thundering herd: if a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      onLog?.(
        'Content fetch already in progress, waiting for ongoing request...',
      );
      return this.fetchPromise;
    }

    // Start the fetch and store the promise to prevent concurrent requests
    onLog?.('Content not in cache, starting fetch...');
    this.fetchPromise = this.performFetch(onLog, retry).finally(() => {
      this.fetchPromise = null;
    });

    return this.fetchPromise;
  }

  private async performFetch(
    onLog?: (msg: string) => void,
    retry = true,
  ): Promise<string> {
    // 1. Get the cookie (either from cache or fresh login)
    const cookie = await this.authService.getSessionCookie(onLog);

    try {
      onLog?.('Fetching content via Axios...');

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

      // Store in cache
      await this.cacheManager.set(this.CACHE_KEY, content, this.CACHE_TTL);
      onLog?.('Content retrieved successfully and cached.');
      return content;
    } catch (error) {
      // 4. Retry Logic: If Axios gets a 403/401, the cookie might be stale.
      if (retry) {
        this.logger.warn('Request failed. Invalidating cache and retrying...');
        // Clear the cache to force a fresh fetch on retry
        await this.cacheManager.del(this.CACHE_KEY);
        // For now, we'll just let the recursive call handle it if you implement cache clearing.
        // Ideally: await this.authService.invalidateCache();
        return this.performFetch(onLog, false);
      }
      throw error;
    }
  }
}
