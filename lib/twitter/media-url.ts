import { matchesDomainOrSubdomain } from "@/lib/url/domains";

export const isImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return (
      matchesDomainOrSubdomain(url.hostname, "twimg.com") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp")
    );
  } catch {
    return false;
  }
};

export const isTwitterMediaUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return matchesDomainOrSubdomain(url.hostname, "twimg.com");
  } catch {
    return false;
  }
};

export const isSafeTwitterImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      matchesDomainOrSubdomain(url.hostname, "twimg.com")
    );
  } catch {
    return false;
  }
};
