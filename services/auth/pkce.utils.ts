export interface PkcePair {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: string;
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generatePkcePairBrowser(): Promise<PkcePair> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64urlEncode(array);
  const challengeBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64urlEncode(new Uint8Array(challengeBuffer));
  return { verifier, challenge, method: "S256" };
}