export const getAuthTokenFingerprint = (
  jwt: string | null | undefined
): string => {
  if (!jwt) {
    return "none";
  }

  let hash = 0;
  for (let index = 0; index < jwt.length; index += 1) {
    hash = (hash * 31 + jwt.charCodeAt(index)) >>> 0;
  }
  return `${jwt.length}:${hash.toString(36)}`;
};

export const getAuthStateFingerprint = ({
  walletAddress,
  jwt,
}: {
  readonly walletAddress: string | null | undefined;
  readonly jwt: string | null | undefined;
}): string =>
  getAuthTokenFingerprint(
    [
      walletAddress?.toLowerCase() ?? "none",
      getAuthTokenFingerprint(jwt),
    ].join(":")
  );
