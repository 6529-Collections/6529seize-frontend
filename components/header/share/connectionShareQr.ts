import { getAddress, isAddress } from "viem";

const CONNECTION_SHARE_SCOPE = "share-connection";
const CONNECTION_SHARE_CODE_PARAM = "connection_share_code";
const CONNECTION_SHARE_ADDRESS_PARAM = "address";
const CONNECTION_SHARE_ALLOWED_PARAMS = new Set([
  CONNECTION_SHARE_CODE_PARAM,
  CONNECTION_SHARE_ADDRESS_PARAM,
]);

export function getConnectionShareRoute({
  content,
  appScheme,
  timestamp = Math.floor(Date.now() / 1000),
}: {
  readonly content: string;
  readonly appScheme: string;
  readonly timestamp?: number | undefined;
}): string | null {
  try {
    const url = new URL(content);
    const normalizedAppScheme = appScheme.trim().replace(/:\/\/$|:$/, "");
    const expectedProtocol = `${normalizedAppScheme}:`;

    if (
      url.protocol.toLowerCase() !== expectedProtocol.toLowerCase() ||
      url.hostname !== CONNECTION_SHARE_SCOPE ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    ) {
      return null;
    }

    const parameterNames = [...url.searchParams.keys()];
    if (
      parameterNames.some((name) => !CONNECTION_SHARE_ALLOWED_PARAMS.has(name))
    ) {
      return null;
    }

    const shareCodes = url.searchParams.getAll(CONNECTION_SHARE_CODE_PARAM);
    const addresses = url.searchParams.getAll(CONNECTION_SHARE_ADDRESS_PARAM);
    const shareCode = shareCodes[0]?.trim();
    const address = addresses[0]?.trim();

    if (
      shareCodes.length !== 1 ||
      addresses.length !== 1 ||
      !shareCode ||
      !address ||
      !isAddress(address, { strict: false })
    ) {
      return null;
    }

    const destinationParams = new URLSearchParams({
      [CONNECTION_SHARE_CODE_PARAM]: shareCode,
      [CONNECTION_SHARE_ADDRESS_PARAM]: getAddress(address),
      _t: String(timestamp),
    });

    return `/accept-connection-sharing?${destinationParams.toString()}`;
  } catch {
    return null;
  }
}
