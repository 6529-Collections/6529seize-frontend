const base64Url = (value: string): string =>
  btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

/** An unsigned JWT carrying `claims`, for code that only decodes tokens. */
export const fakeJwt = (claims: Record<string, unknown>): string =>
  `${base64Url(JSON.stringify({ alg: "none" }))}.${base64Url(
    JSON.stringify(claims)
  )}.signature`;
