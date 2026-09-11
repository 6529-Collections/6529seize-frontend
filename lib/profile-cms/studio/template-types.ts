import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import type { CmsStudioPresentation } from "./presentation";

export type CmsStudioTemplateFamily =
  | "personal"
  | "collector"
  | "artist"
  | "organization"
  | "fund";

export interface CmsStudioTemplatePage {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly blocks: CmsBlockV1[];
}

export interface CmsStudioTemplate {
  readonly id: string;
  readonly name: string;
  readonly siteTitle?: string;
  readonly family: CmsStudioTemplateFamily;
  readonly description: string;
  readonly presentation: CmsStudioPresentation;
  readonly accent?: string;
  readonly inspiration?: {
    readonly kind: "meme";
    readonly cardId: number;
    readonly title: string;
    readonly artist: string;
    readonly url: string;
  };
  readonly pages: readonly CmsStudioTemplatePage[];
}
