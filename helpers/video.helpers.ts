export interface VideoConversions {
  readonly MP4_720P: string;
  readonly MP4_360P: string;
  readonly HLS: string;
}

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN
  || 'https://d3lqz0a4bldqgf.cloudfront.net';

// A small helper if you want it more readable
function buildRenditionUrl(path: string): string {
  return `${CLOUDFRONT_DOMAIN}/renditions/drops/${path}`;
}

/**
 * Given an original video URL in /drops/, generate the likely HLS / MP4 URLs.
 */
export function getVideoConversions(originalUrl: string): VideoConversions | null {
  // 1. Check if it starts with the known domain/prefix
  if (!originalUrl.startsWith(`${CLOUDFRONT_DOMAIN}/drops/`)) {
    return null;
  }

  // 2. Split to isolate everything after '/drops/'
  const [_, afterDrops] = originalUrl.split('/drops/');
  if (!afterDrops) {
    return null;
  }

  // 3. Find the last dot to strip extension
  const lastDotIndex = afterDrops.lastIndexOf('.');
  if (lastDotIndex === -1) {
    console.warn('Video URL has no file extension:', originalUrl);
    return null;
  }

  // e.g. "author_<id>/<uuid>" without .mov, .mp4, etc.
  const pathWithoutExtension = afterDrops.slice(0, lastDotIndex);

  // Separate the <uuid> and any preceding folders (author_<id>/)
  const lastSlashIndex = pathWithoutExtension.lastIndexOf('/');
  const fileName = pathWithoutExtension.substring(lastSlashIndex + 1);
  const beforeFileName = pathWithoutExtension.substring(0, lastSlashIndex + 1);

  return {
    // For MP4 & HLS, just build the subpaths
    MP4_720P: `${buildRenditionUrl(`${beforeFileName}${fileName}`)}/mp4/${fileName}_720p.mp4`,
    MP4_360P: `${buildRenditionUrl(`${beforeFileName}${fileName}`)}/mp4/${fileName}_360p.mp4`,
    HLS: `${buildRenditionUrl(`${beforeFileName}${fileName}`)}/hls/${fileName}.m3u8`
  };
}

/**
 * Quick check if a URL likely refers to a video file (by extension).
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    '.wmv', '.flv', '.mkv'
  ];
  const lower = url.toLowerCase();
  return videoExtensions.some(ext => lower.endsWith(ext));
}

/**
 * HEAD request to see if a URL returns 200 OK (exists) or 404 (not yet).
 */
export async function checkVideoAvailability(url: string): Promise<boolean> {
  // Special handling for localhost HLS files
  // Safari can play these natively, but CORS blocks our HEAD requests
  if (typeof window !== 'undefined' && 
      window.location.hostname === 'localhost' && 
      url.includes('/hls/') && 
      url.endsWith('.m3u8')) {
    console.debug('Assuming HLS file exists on localhost for Safari:', url);
    return true;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Single-shot: tries HLS first, else returns original.
 * Useful if you do NOT need repeated polling.
 */
export async function findPlayableAsset(originalUrl: string): Promise<string> {
  const conversions = getVideoConversions(originalUrl);
  if (!conversions) {
    return originalUrl;
  }

  const hlsOk = await checkVideoAvailability(conversions.HLS);
  if (hlsOk) {
    return conversions.HLS;
  }

  return originalUrl;
} 