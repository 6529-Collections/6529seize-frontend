import { Crumb } from "../components/breadcrumb/Breadcrumb";

export const formatCrumbDisplay = (segment: string): string => {
  if (!segment) return "";
  return segment
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

export const getDynamicParam = (
  segments: readonly string[],
  baseSegment: string,
  offset: number = 1,
  queryParam?: string | string[]
): string | undefined => {
  const baseIndex = segments.indexOf(baseSegment);
  if (baseIndex === -1) return undefined;

  const paramIndex = baseIndex + offset;
  if (paramIndex >= segments.length) return undefined;

  if (queryParam) {
    if (Array.isArray(queryParam)) {
      return queryParam[0];
    }
    return queryParam;
  }
  return segments[paramIndex];
};

export const buildStaticCrumbs = (pathSegments: string[]): Crumb[] => {
  const crumbs: Crumb[] = [];
  let currentPath = "";
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    const display = formatCrumbDisplay(segment);
    if (i === pathSegments.length - 1) {
      crumbs.push({ display });
    } else {
      crumbs.push({ display, href: currentPath });
    }
  }
  return crumbs;
}; 
