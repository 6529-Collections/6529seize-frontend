export interface Page<T> {
  count: number;
  page: number;
  next: boolean;
  data: T[];
}

export enum STATEMENT_GROUP {
  CONTACT = "CONTACT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
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
}

export const CAN_OPEN_STATEMENT: Record<STATEMENT_TYPE, boolean> = {
  [STATEMENT_TYPE.X]: true,
  [STATEMENT_TYPE.FACEBOOK]: true,
  [STATEMENT_TYPE.LINKED_IN]: true,
  [STATEMENT_TYPE.INSTAGRAM]: true,
  [STATEMENT_TYPE.TIK_TOK]: true,
  [STATEMENT_TYPE.GITHUB]: true,
  [STATEMENT_TYPE.REDDIT]: true,
  [STATEMENT_TYPE.WEIBO]: true,
  [STATEMENT_TYPE.SUBSTACK]: true,
  [STATEMENT_TYPE.MEDIUM]: true,
  [STATEMENT_TYPE.MIRROR_XYZ]: true,
  [STATEMENT_TYPE.YOUTUBE]: true,
  [STATEMENT_TYPE.DISCORD]: false,
  [STATEMENT_TYPE.TELEGRAM]: false,
  [STATEMENT_TYPE.WECHAT]: false,
  [STATEMENT_TYPE.PHONE]: false,
  [STATEMENT_TYPE.EMAIL]: false,
  [STATEMENT_TYPE.WEBSITE]: true,
  [STATEMENT_TYPE.LINK]: true,
};

export const STATEMENT_TITLE: Record<STATEMENT_TYPE, string> = {
  [STATEMENT_TYPE.X]: "X",
  [STATEMENT_TYPE.FACEBOOK]: "Facebook",
  [STATEMENT_TYPE.LINKED_IN]: "LinkedIn",
  [STATEMENT_TYPE.INSTAGRAM]: "Instagram",
  [STATEMENT_TYPE.TIK_TOK]: "TikTok",
  [STATEMENT_TYPE.GITHUB]: "GitHub",
  [STATEMENT_TYPE.REDDIT]: "Reddit",
  [STATEMENT_TYPE.WEIBO]: "Weibo",
  [STATEMENT_TYPE.SUBSTACK]: "Substack",
  [STATEMENT_TYPE.MEDIUM]: "Medium",
  [STATEMENT_TYPE.MIRROR_XYZ]: "Mirror.xyz",
  [STATEMENT_TYPE.YOUTUBE]: "YouTube",
  [STATEMENT_TYPE.DISCORD]: "Discord",
  [STATEMENT_TYPE.TELEGRAM]: "Telegram",
  [STATEMENT_TYPE.WECHAT]: "WeChat",
  [STATEMENT_TYPE.PHONE]: "Phone",
  [STATEMENT_TYPE.EMAIL]: "Email",
  [STATEMENT_TYPE.WEBSITE]: "Website",
  [STATEMENT_TYPE.LINK]: "Link",
};

export const STATEMENT_INPUT_PLACEHOLDER: Record<STATEMENT_TYPE, string> = {
  [STATEMENT_TYPE.X]: "https://www.x.com/username",
  [STATEMENT_TYPE.FACEBOOK]: "https://www.facebook.com/username",
  [STATEMENT_TYPE.LINKED_IN]: "https://www.linkedin.com/username",
  [STATEMENT_TYPE.INSTAGRAM]: "https://www.instagram.com/username",
  [STATEMENT_TYPE.TIK_TOK]: "https://www.tiktok.com/@username",
  [STATEMENT_TYPE.GITHUB]: "https://www.github.com/username",
  [STATEMENT_TYPE.REDDIT]: "https://www.reddit.com/u/username",
  [STATEMENT_TYPE.WEIBO]: "https://www.weibo.com/username",
  [STATEMENT_TYPE.SUBSTACK]: "https://username.substack.com/",
  [STATEMENT_TYPE.MEDIUM]: "https://www.medium.com/@username",
  [STATEMENT_TYPE.MIRROR_XYZ]: "https://www.mirror.xyz/username",
  [STATEMENT_TYPE.YOUTUBE]: "https://www.youtube.com/username",
  [STATEMENT_TYPE.DISCORD]: "Discord username",
  [STATEMENT_TYPE.TELEGRAM]: "Telegram username",
  [STATEMENT_TYPE.WECHAT]: "WeChat username",
  [STATEMENT_TYPE.PHONE]: "Phone",
  [STATEMENT_TYPE.EMAIL]: "Email",
  [STATEMENT_TYPE.WEBSITE]: "Website (starting with http or https)",
  [STATEMENT_TYPE.LINK]: "Website (starting with http or https)",
};

export const STATEMENT_INPUT_INITIAL_VALUE: Record<STATEMENT_TYPE, string> = {
  [STATEMENT_TYPE.X]: "https://x.com/",
  [STATEMENT_TYPE.FACEBOOK]: "https://www.facebook.com/",
  [STATEMENT_TYPE.LINKED_IN]: "https://www.linkedin.com/in/",
  [STATEMENT_TYPE.INSTAGRAM]: "https://www.instagram.com/",
  [STATEMENT_TYPE.TIK_TOK]: "https://www.tiktok.com/@",
  [STATEMENT_TYPE.GITHUB]: "https://github.com/",
  [STATEMENT_TYPE.REDDIT]: "https://www.reddit.com/u/",
  [STATEMENT_TYPE.WEIBO]: "https://www.weibo.com/",
  [STATEMENT_TYPE.SUBSTACK]: "https://",
  [STATEMENT_TYPE.MEDIUM]: "https://www.medium.com/@",
  [STATEMENT_TYPE.MIRROR_XYZ]: "https://www.mirror.xyz/",
  [STATEMENT_TYPE.YOUTUBE]: "https://www.youtube.com/",
  [STATEMENT_TYPE.DISCORD]: "",
  [STATEMENT_TYPE.TELEGRAM]: "",
  [STATEMENT_TYPE.WECHAT]: "",
  [STATEMENT_TYPE.PHONE]: "",
  [STATEMENT_TYPE.EMAIL]: "",
  [STATEMENT_TYPE.WEBSITE]: "https://",
  [STATEMENT_TYPE.LINK]: "https://",
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

export const CONTACT_STATEMENT_TYPES = [
  STATEMENT_TYPE.DISCORD,
  STATEMENT_TYPE.TELEGRAM,
  STATEMENT_TYPE.WECHAT,
  STATEMENT_TYPE.PHONE,
  STATEMENT_TYPE.EMAIL,
  STATEMENT_TYPE.WEBSITE,
] as const;

export type CONTACT_STATEMENT_TYPE = (typeof CONTACT_STATEMENT_TYPES)[number];

export const SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPES = [
  STATEMENT_TYPE.LINK,
] as const;

export type SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPE =
  (typeof SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPES)[number];
