export interface VideoConversions {
  readonly MP4_720P: string;
  readonly MP4_360P: string;
  readonly HLS: string;
}

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'https://d3lqz0a4bldqgf.cloudfront.net';

export function getVideoConversions(originalUrl: string): VideoConversions | null {
  if (!originalUrl.startsWith(`${CLOUDFRONT_DOMAIN}/drops/`)) {
    return null;
  }

  const split = originalUrl.split('/drops/');
  if (split.length !== 2) {
    return null;
  }

  const lastPart = split[1];
  const lastDotIndex = lastPart.lastIndexOf('.');
  
  // Handle files without extensions
  if (lastDotIndex === -1) {
    console.warn('Video URL has no file extension:', originalUrl);
    return null;
  }
  
  const pathWithoutExtension = lastPart.slice(0, lastDotIndex);
  const fileName = pathWithoutExtension.substring(
    pathWithoutExtension.lastIndexOf('/') + 1
  );
  const beforeFileName = pathWithoutExtension.substring(
    0,
    pathWithoutExtension.lastIndexOf('/') + 1
  );

  return {
    MP4_720P: `${CLOUDFRONT_DOMAIN}/renditions/drops/${beforeFileName}${fileName}/mp4/${fileName}_720p.mp4`,
    MP4_360P: `${CLOUDFRONT_DOMAIN}/renditions/drops/${beforeFileName}${fileName}/mp4/${fileName}_360p.mp4`,
    HLS: `${CLOUDFRONT_DOMAIN}/renditions/drops/${beforeFileName}${fileName}/hls/${fileName}.m3u8`
  };
}

export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowercaseUrl.endsWith(ext));
}

export async function checkVideoAvailability(url: string): Promise<boolean> {
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

export async function findPlayableAsset(originalUrl: string): Promise<string> {
  const conversions = getVideoConversions(originalUrl);
  
  if (!conversions) {
    return originalUrl;
  }

  const isHlsAvailable = await checkVideoAvailability(conversions.HLS);
  
  if (isHlsAvailable) {
    return conversions.HLS;
  }

  return originalUrl;
} 