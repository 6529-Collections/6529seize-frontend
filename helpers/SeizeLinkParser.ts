export interface SeizeLinkInfo {
  waveId: string;
  serialNo?: string;
  dropId?: string;
}

export function parseSeizeLink(href: string): SeizeLinkInfo | null {
  const regex =
    /\/waves\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:\?drop=(\d+)$|\?drop=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}))/;

  const match = href.match(regex);
  if (!match) return null;

  const [, waveId, serialNo, dropId] = match;
  return { waveId, serialNo, dropId };
}