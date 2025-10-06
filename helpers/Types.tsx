import { SortDirection } from "@/entities/ISort";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";

export interface FullPageRequest<SORT_BY_OPTIONS> {
  readonly sort_direction: SortDirection;
  readonly sort: SORT_BY_OPTIONS;
  readonly page: number;
  readonly page_size: number;
}

export interface Page<T> {
  count: number;
  page: number;
  next: boolean;
  data: T[];
}

export type CountlessPage<T> = Omit<Page<T>, "count">;

export type NonNullableNotRequired<T> = {
  [P in keyof T]?: NonNullable<T[P]>;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export enum STATEMENT_GROUP {
  CONTACT = "CONTACT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  NFT_ACCOUNTS = "NFT_ACCOUNTS",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
  GENERAL = "GENERAL",
}

export enum STATEMENT_TYPE {
  X = "X",
  FACEBOOK = "FACEBOOK",
  LINKED_IN = "LINKED_IN",
  INSTAGRAM = "INSTAGRAM",
  TIK_TOK = "TIK_TOK",
  GITHUB = "GITHUB",
  REDDIT = "REDDIT",
  WEIBO = "WEIBO",
  SUBSTACK = "SUBSTACK",
  MEDIUM = "MEDIUM",
  MIRROR_XYZ = "MIRROR_XYZ",
  YOUTUBE = "YOUTUBE",
  DISCORD = "DISCORD",
  TELEGRAM = "TELEGRAM",
  WECHAT = "WECHAT",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  WEBSITE = "WEBSITE",
  LINK = "LINK",
  BIO = "BIO",
  SUPER_RARE = "SUPER_RARE",
  FOUNDATION = "FOUNDATION",
  MAKERS_PLACE = "MAKERS_PLACE",
  KNOWN_ORIGIN = "KNOWN_ORIGIN",
  PEPE_WTF = "PEPE_WTF",
  OPENSEA = "OPENSEA",
  ART_BLOCKS = "ART_BLOCKS",
  DECA_ART = "DECA_ART",
  ON_CYBER = "ON_CYBER",
  THE_LINE = "THE_LINE",
}

export const STATEMENT_META: Record<
  STATEMENT_TYPE,
  {
    readonly title: string;
    readonly inputPlaceholder: string;
    readonly inputInitialValue: string;
    readonly canOpenStatement: boolean;
  }
> = {
  [STATEMENT_TYPE.X]: {
    title: "X",
    inputPlaceholder: "https://www.x.com/username",
    inputInitialValue: "https://www.x.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.FACEBOOK]: {
    title: "Facebook",
    inputPlaceholder: "https://www.facebook.com/username",
    inputInitialValue: "https://www.facebook.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.LINKED_IN]: {
    title: "LinkedIn",
    inputPlaceholder: "https://www.linkedin.com/username",
    inputInitialValue: "https://www.linkedin.com/in/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.INSTAGRAM]: {
    title: "Instagram",
    inputPlaceholder: "https://www.instagram.com/username",
    inputInitialValue: "https://www.instagram.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.TIK_TOK]: {
    title: "TikTok",
    inputPlaceholder: "https://www.tiktok.com/@username",
    inputInitialValue: "https://www.tiktok.com/@",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.GITHUB]: {
    title: "GitHub",
    inputPlaceholder: "https://www.github.com/username",
    inputInitialValue: "https://www.github.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.REDDIT]: {
    title: "Reddit",
    inputPlaceholder: "https://www.reddit.com/u/username",
    inputInitialValue: "https://www.reddit.com/u/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.WEIBO]: {
    title: "Weibo",
    inputPlaceholder: "https://www.weibo.com/username",
    inputInitialValue: "https://www.weibo.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.SUBSTACK]: {
    title: "Substack",
    inputPlaceholder: "https://username.substack.com/",
    inputInitialValue: "https://",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.MEDIUM]: {
    title: "Medium",
    inputPlaceholder: "https://www.medium.com/@username",
    inputInitialValue: "https://www.medium.com/@",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.MIRROR_XYZ]: {
    title: "Mirror.xyz",
    inputPlaceholder: "https://www.mirror.xyz/username",
    inputInitialValue: "https://www.mirror.xyz/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.YOUTUBE]: {
    title: "YouTube",
    inputPlaceholder: "https://www.youtube.com/username",
    inputInitialValue: "https://www.youtube.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.DISCORD]: {
    title: "Discord",
    inputPlaceholder: "Discord username",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.TELEGRAM]: {
    title: "Telegram",
    inputPlaceholder: "Telegram username",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.WECHAT]: {
    title: "WeChat",
    inputPlaceholder: "WeChat username",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.PHONE]: {
    title: "Phone",
    inputPlaceholder: "Phone",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.EMAIL]: {
    title: "Email",
    inputPlaceholder: "Email",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.WEBSITE]: {
    title: "Website",
    inputPlaceholder: "Website (starting with http or https)",
    inputInitialValue: "https://",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.LINK]: {
    title: "Link",
    inputPlaceholder: "Website (starting with http or https)",
    inputInitialValue: "https://",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.BIO]: {
    title: "About",
    inputPlaceholder: "About",
    inputInitialValue: "",
    canOpenStatement: false,
  },
  [STATEMENT_TYPE.SUPER_RARE]: {
    title: "SuperRare",
    inputPlaceholder: "https://superrare.com/",
    inputInitialValue: "https://superrare.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.FOUNDATION]: {
    title: "Foundation",
    inputPlaceholder: "https://foundation.app/",
    inputInitialValue: "https://foundation.app/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.MAKERS_PLACE]: {
    title: "MakersPlace",
    inputPlaceholder: "https://makersplace.com/",
    inputInitialValue: "https://makersplace.com/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.KNOWN_ORIGIN]: {
    title: "KnownOrigin",
    inputPlaceholder: "https://knownorigin.io/",
    inputInitialValue: "https://knownorigin.io/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.PEPE_WTF]: {
    title: "Pepe.wtf",
    inputPlaceholder: "https://pepe.wtf/",
    inputInitialValue: "https://pepe.wtf/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.OPENSEA]: {
    title: "OpenSea",
    inputPlaceholder: "https://opensea.io/",
    inputInitialValue: "https://opensea.io/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.ART_BLOCKS]: {
    title: "Art Blocks",
    inputPlaceholder: "https://www.artblocks.io/",
    inputInitialValue: "https://www.artblocks.io/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.DECA_ART]: {
    title: "Deca Art",
    inputPlaceholder: "https://deca.art/",
    inputInitialValue: "https://deca.art/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.ON_CYBER]: {
    title: "OnCyber",
    inputPlaceholder: "https://oncyber.io/",
    inputInitialValue: "https://oncyber.io/",
    canOpenStatement: true,
  },
  [STATEMENT_TYPE.THE_LINE]: {
    title: "The Line",
    inputPlaceholder: "https://oncyber.io/line",
    inputInitialValue: "https://oncyber.io/line",
    canOpenStatement: true,
  },
};

export const SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES = [
  STATEMENT_TYPE.X,
  STATEMENT_TYPE.FACEBOOK,
  STATEMENT_TYPE.LINKED_IN,
  STATEMENT_TYPE.INSTAGRAM,
  STATEMENT_TYPE.TIK_TOK,
  STATEMENT_TYPE.GITHUB,
  STATEMENT_TYPE.REDDIT,
  STATEMENT_TYPE.WEIBO,
  STATEMENT_TYPE.SUBSTACK,
  STATEMENT_TYPE.MEDIUM,
  STATEMENT_TYPE.MIRROR_XYZ,
  STATEMENT_TYPE.YOUTUBE,
] as const;

export type SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE =
  (typeof SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES)[number];

export const NFT_ACCOUNTS_STATEMENT_TYPES = [
  STATEMENT_TYPE.SUPER_RARE,
  STATEMENT_TYPE.FOUNDATION,
  STATEMENT_TYPE.MAKERS_PLACE,
  STATEMENT_TYPE.KNOWN_ORIGIN,
  STATEMENT_TYPE.PEPE_WTF,
  STATEMENT_TYPE.OPENSEA,
  STATEMENT_TYPE.ART_BLOCKS,
  STATEMENT_TYPE.DECA_ART,
  STATEMENT_TYPE.ON_CYBER,
  STATEMENT_TYPE.THE_LINE,
] as const;

export type NFT_ACCOUNTS_STATEMENT_TYPE =
  (typeof NFT_ACCOUNTS_STATEMENT_TYPES)[number];

export const CONTACT_STATEMENT_TYPES = [
  STATEMENT_TYPE.DISCORD,
  STATEMENT_TYPE.TELEGRAM,
  STATEMENT_TYPE.WECHAT,
  STATEMENT_TYPE.PHONE,
  STATEMENT_TYPE.EMAIL,
  STATEMENT_TYPE.WEBSITE,
] as const;

export type CONTACT_STATEMENT_TYPE = (typeof CONTACT_STATEMENT_TYPES)[number];

const SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPES = [
  STATEMENT_TYPE.LINK,
] as const;

type SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPE =
  (typeof SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPES)[number];

export enum Period {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
}

export enum WsMessageType {
  DROP_UPDATE = "DROP_UPDATE",
  DROP_DELETE = "DROP_DELETE",
  DROP_RATING_UPDATE = "DROP_RATING_UPDATE",
  DROP_REACTION_UPDATE = "DROP_REACTION_UPDATE",
  USER_IS_TYPING = "USER_IS_TYPING",
  SUBSCRIBE_TO_WAVE = "SUBSCRIBE_TO_WAVE",
}

export interface WsTypingMessage {
  readonly type: WsMessageType.USER_IS_TYPING;
  readonly data: {
    wave_id: string;
    profile: ApiProfileMin;
    timestamp: number;
  };
}

export interface WsDropUpdateMessage {
  type: WsMessageType.DROP_UPDATE;
  data: ApiDrop;
}

export interface PageSSRMetadata {
  title: string;
  description?: string;
  ogImage: string;
  twitterCard: "summary" | "summary_large_image";
}

export interface UserPageProps {
  profile: ApiIdentity;
  metadata: PageSSRMetadata;
}
