import type { ReactNode } from "react";

export type MigratedWordPressArticleLink = {
  readonly href: string;
  readonly label: string;
};

export type MigratedWordPressArticleMedia = {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly caption?: ReactNode;
  readonly href?: string;
};

export type MigratedWordPressArticleVideo = {
  readonly src: string;
  readonly title: string;
  readonly caption?: ReactNode;
};

export type MigratedWordPressArticleBlock =
  | {
      readonly type: "heading";
      readonly content: ReactNode;
    }
  | {
      readonly type: "paragraph";
      readonly content: ReactNode;
    }
  | {
      readonly type: "image";
      readonly media: MigratedWordPressArticleMedia;
    }
  | {
      readonly type: "video";
      readonly video: MigratedWordPressArticleVideo;
    }
  | {
      readonly type: "quote";
      readonly content: ReactNode;
      readonly cite?: ReactNode;
    };

export type MigratedWordPressArticleContent = {
  readonly source: "migrated-wordpress";
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly section: string;
  readonly author: MigratedWordPressArticleLink;
  readonly publishedAt: string;
  readonly modifiedAt: string;
  readonly readingTime?: string;
  readonly heroImage?: MigratedWordPressArticleMedia;
  readonly blocks: readonly MigratedWordPressArticleBlock[];
};
