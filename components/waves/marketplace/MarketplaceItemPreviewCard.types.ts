export interface MarketplaceItemPreviewCardProps {
  readonly href: string;
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly price?: string | undefined;
  readonly title?: string | undefined;
  readonly compact?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
}

export interface MarketplaceBrand {
  readonly displayName: string;
  readonly logoSrc: string;
}

export interface ResolvedPreviewHref {
  readonly href: string;
  readonly target?: string | undefined;
  readonly rel?: string | undefined;
}
