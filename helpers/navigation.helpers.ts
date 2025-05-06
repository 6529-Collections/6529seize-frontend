export const mainSegment = (url: string): string => {
  const pathname = url.split(/[?#]/)[0];
  const [, first] = pathname.split("/");
  return first ? `/${first.toLowerCase()}` : "/";
};

export const sameMainPath = (a: string, b: string): boolean => mainSegment(a) === mainSegment(b); 