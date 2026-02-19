import { Injectable } from '@nestjs/common';
import { ESNPageManager, MemberData, SectionType } from './esn-page-manager';

@Injectable()
export class MembersService {
  parseHtmlToJson(html: string): Record<string, MemberData[]> {
    const manager = new ESNPageManager(html);
    return manager.getJsonState();
  }

  generateHtmlFromJson(
    originalHtml: string,
    newState: Record<string, MemberData[]>,
  ): string {
    const manager = new ESNPageManager(originalHtml);
    const sectionKeys = Object.keys(newState); // cast to SectionType

    for (const key of sectionKeys) {
      manager.updateSectionFromList(key as SectionType, newState[key]);
    }
    return manager.getOutput();
  }
}
