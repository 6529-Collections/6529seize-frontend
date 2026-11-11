import before from "../fixtures/security-headers-before-content-domain.json";
import { createSecurityHeaders } from "@/config/securityHeaders";

type Header = { readonly key: string; readonly value: string };

const PREVIOUS_ENDPOINT = "https://media.6529.io";
const CONTENT_DOMAIN_ENDPOINT = "https://media.6529usercontent.com";
const CONTENT_DOMAIN_SOURCES = [
  "https://media.6529usercontent.com",
  "https://*.ipfs.6529usercontent.com",
];
const ALL_OPTIONS = {
  allowUnsafeEval: true,
  allowInsecureLocalhostConnectSrc: true,
  allowWasmUnsafeEval: true,
  webSocketEndpoint: "wss://ws.6529.io",
  sentryDsn:
    "https://0123456789abcdef0123456789abcdef@o123.ingest.us.sentry.io/456",
};

const VARIANTS = [
  ["default", before.default as Header[], undefined],
  ["all options", before.allOptions as Header[], ALL_OPTIONS],
] as const;

function headersFor(
  mediaResolverEndpoint: string,
  options?: Parameters<typeof createSecurityHeaders>[3]
): Header[] {
  return createSecurityHeaders(
    "https://api.6529.io",
    "https://ipfs.6529.io",
    mediaResolverEndpoint,
    options
  );
}

function directives(headers: readonly Header[]): Map<string, string[]> {
  const csp = headers.find(
    (header) => header.key === "Content-Security-Policy"
  )?.value;
  if (!csp) {
    throw new Error("Content-Security-Policy header was not created.");
  }
  return new Map(
    csp
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name = "", ...sources] = directive.split(/\s+/);
        return [name, sources] as const;
      })
  );
}

const withoutContentDomain = (sources: readonly string[]): string[] =>
  sources.filter((source) => !CONTENT_DOMAIN_SOURCES.includes(source));

describe.each(VARIANTS)("security headers (%s)", (_name, previous, options) => {
  const previousDirectives = directives(previous);
  const directivesWithPreviousHost = [...previousDirectives]
    .filter(([, sources]) => sources.includes(PREVIOUS_ENDPOINT))
    .map(([name]) => name);

  it("lists the previous media host in connect, media and frame sources", () => {
    expect(directivesWithPreviousHost.sort()).toEqual([
      "connect-src",
      "frame-src",
      "media-src",
    ]);
  });

  describe("with the previous resolver endpoint", () => {
    const headers = headersFor(PREVIOUS_ENDPOINT, options);
    const current = directives(headers);

    it("keeps every header other than the policy byte-for-byte", () => {
      expect(
        headers.filter((header) => header.key !== "Content-Security-Policy")
      ).toEqual(
        previous.filter((header) => header.key !== "Content-Security-Policy")
      );
    });

    it("only adds the content-domain sources, keeping every directive and order", () => {
      expect([...current.keys()]).toEqual([...previousDirectives.keys()]);
      for (const [name, sources] of current) {
        expect(withoutContentDomain(sources)).toEqual(
          previousDirectives.get(name)
        );
      }
    });

    it("adds the content-domain sources exactly where the previous host appears", () => {
      for (const [name, sources] of current) {
        const expected = directivesWithPreviousHost.includes(name)
          ? CONTENT_DOMAIN_SOURCES
          : [];
        expect(
          sources.filter((source) => CONTENT_DOMAIN_SOURCES.includes(source))
        ).toEqual(expected);
      }
    });
  });

  describe("with the content-domain resolver endpoint", () => {
    const current = directives(headersFor(CONTENT_DOMAIN_ENDPOINT, options));

    it("removes no source the previous policy allowed", () => {
      expect([...current.keys()]).toEqual([...previousDirectives.keys()]);
      for (const [name, sources] of previousDirectives) {
        expect(current.get(name)).toEqual(expect.arrayContaining(sources));
      }
    });

    it("allows both content-domain hosts once in each media directive", () => {
      for (const name of directivesWithPreviousHost) {
        const sources = current.get(name) ?? [];
        for (const source of CONTENT_DOMAIN_SOURCES) {
          expect(sources.filter((value) => value === source)).toHaveLength(1);
        }
      }
    });
  });
});
