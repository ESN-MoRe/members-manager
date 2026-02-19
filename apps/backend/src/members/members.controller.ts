import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { DrupalContentService } from '../drupal/drupal-content.service';
import type { MemberData } from './esn-page-manager';
import type { MembersService } from './members.service';

// Multer config for images
const storage = diskStorage({
  destination: './public/members-img', // Save to public folder
  filename: (_req, file, cb) => {
    // You might need to handle the filename from body if passed, or just use original
    const name = file.originalname;
    cb(null, name);
  },
});

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly drupalService: DrupalContentService,
  ) {}

  // 1. Scrape Drupal -> Parse -> Return JSON
  @Get()
  async getCurrentMembers() {
    // Fetch HTML from Drupal (using your existing Puppeteer logic)
    const html = await this.drupalService.getAboutUsContent();

    // Parse to JSON
    return this.membersService.parseHtmlToJson(html);
  }

  // 2. Receive JSON -> Generate HTML -> Return HTML String
  @Post()
  async previewHtml(@Body() newState: Record<string, MemberData[]>) {
    // We need the original HTML structure to inject into.
    // Ideally, cache this or fetch again. For now, let's fetch.
    const html = await this.drupalService.getAboutUsContent();

    const newHtml = this.membersService.generateHtmlFromJson(html, newState);

    // Here you would usually save to Drupal.
    // For now, return success or the HTML for preview
    return { success: true, htmlPreview: newHtml };
  }

  // 3. Image Upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('photo', { storage }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { filename: file.filename };
  }
}
