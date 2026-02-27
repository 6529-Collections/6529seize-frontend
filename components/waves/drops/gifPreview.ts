export const CHAT_GIF_PREVIEW_HEIGHT_PX = 180;

const TENOR_HOST = "media.tenor.com";

export const isTenorGifUrl = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== TENOR_HOST) {
      return false;
    }

    const pathname = url.pathname.toLowerCase();
    return pathname.endsWith(".gif");
  } catch {
    return false;
  }
};
