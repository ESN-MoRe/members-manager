export interface MemberData {
  name: string;
  role: string;
  imageFilename?: string;
}

export type SectionType =
  | 'BOARD'
  | 'SUPPORTERS'
  | 'ACTIVE'
  | 'MASCOTS'
  | 'ALUMNI';

export type SectionsState = Record<SectionType, MemberData[]>;
