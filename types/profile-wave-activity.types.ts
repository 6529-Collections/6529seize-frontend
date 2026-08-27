export interface ProfileWaveActivitySidebarItem {
  readonly id: string;
  readonly name: string;
  readonly picture: string | null;
  readonly isPrivate: boolean;
  readonly totalDropsCount: number;
  readonly latestPostTimestamp: number | null;
}

export interface ProfileWaveActivitySidebarPage {
  readonly waves: ProfileWaveActivitySidebarItem[];
  readonly nextCursor: string | null;
}
