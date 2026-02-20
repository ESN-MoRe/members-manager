import { Injectable, Logger } from '@nestjs/common';
import { ESNPageManager, MemberData, SectionType } from './esn-page-manager';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  parseHtmlToJson(html: string): Record<string, MemberData[]> {
    const manager = new ESNPageManager(html, this.logger);
    return manager.getJsonState();
  }

  generateHtmlFromJson(
    originalHtml: string,
    newState: Record<string, MemberData[]>,
  ): string {
    const manager = new ESNPageManager(originalHtml, this.logger);
    const sectionKeys = Object.keys(newState); // cast to SectionType

    for (const key of sectionKeys) {
      manager.updateSectionFromList(key as SectionType, newState[key]);
    }
    return manager.getOutput();
  }
}
