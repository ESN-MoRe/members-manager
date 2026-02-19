export interface MemberData {
  name: string;
  role: string;
  imageFilename?: string;
  localImage?: string; // Add this line! (stores base64 data url)
}

export type SectionType =
  | 'BOARD'
  | 'SUPPORTERS'
  | 'ACTIVE'
  | 'MASCOTS'
  | 'ALUMNI';

export type SectionsState = Record<SectionType, MemberData[]>;
