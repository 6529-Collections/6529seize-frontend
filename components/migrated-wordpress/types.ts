import type { ReactNode } from "react";

declare const migratedWordPressTrustedHtmlBrand: unique symbol;

/**
 * Raw HTML that is allowed to reach the migrated-wordpress renderer's
 * dangerouslySetInnerHTML sink. Values can only be produced by
 * migratedWordPressTrustedHtml(), whose signature rejects runtime-typed
 * strings — the content must be an in-repo compile-time literal.
 */
export type MigratedWordPressTrustedHtml = string & {
  readonly [migratedWordPressTrustedHtmlBrand]: true;
};

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
    }
  | {
      readonly type: "html";
      readonly html: MigratedWordPressTrustedHtml;
    }
  | {
      readonly type: "divider";
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

export type MigratedWordPressStaticPageContent = {
  readonly source: "migrated-wordpress";
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly section: string;
  readonly heroImage?: MigratedWordPressArticleMedia;
  readonly blocks: readonly MigratedWordPressArticleBlock[];
};
