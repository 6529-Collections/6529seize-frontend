export const PRODUCTION_ASSET_HOSTNAME = "dnclu2fna0b2b.cloudfront.net";

export function getProductionAssetPrefix(version: string): string {
  return `https://${PRODUCTION_ASSET_HOSTNAME}/web_build/${version}`;
}
