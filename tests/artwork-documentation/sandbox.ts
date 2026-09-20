import { createHash } from "node:crypto";
import type { Page, Route } from "@playwright/test";
import type { ApiArtworkDocumentationContext } from "../../generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationAsset } from "../../generated/models/ApiArtworkDocumentationAsset";
import type { ApiArtworkDocumentationOperation } from "../../generated/models/ApiArtworkDocumentationOperation";
import type { ApiArtworkDocumentationAssetLinkRequest } from "../../generated/models/ApiArtworkDocumentationAssetLinkRequest";
import { documentationFixture } from "../../__tests__/fixtures/artwork-documentation";
import museumProfile from "../../__tests__/fixtures/artwork-documentation-profile-v3.json";
import legacyProfile from "./profile-v2.json";
import {
  assertLocalSandboxBaseURL,
  getSandboxApiOrigin,
} from "../support/localSandbox";

// Public, fictional records only. The real editor runs unchanged; storage,
// multipart signing, scanning and attachment are controlled HTTP boundaries.
export const FIXTURE_FILE = {
  name: "local-browser-study.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ZkAAAAASUVORK5CYII=",
    "base64"
  ),
};
export const FIXTURE_ASSET_ID = "33333333-3333-4333-8333-333333333333";
const UPLOAD_ID = "44444444-4444-4444-8444-444444444444";

export async function installDocumentationSandbox(
  page: Page,
  baseURL: string | undefined,
  version: 2 | 3,
  options: { failFirstAttachment?: boolean } = {}
) {
  assertLocalSandboxBaseURL(baseURL);
  const origin = getSandboxApiOrigin(baseURL);
  const address = "0x0000000000000000000000000000000000000529";
  const profileId = "00000000-0000-4000-8000-000000000531";
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  // An unsigned local-only identity, never a credential for a deployed API.
  const jwt = [
    encode({ alg: "none", typ: "JWT" }),
    encode({
      id: "local-artwork-documentation-sandbox",
      sub: address,
      iat: 1760000000,
      exp: 2000000000,
      role: profileId,
    }),
    "",
  ].join(".");
  await page.addInitScript(
    ({ localOrigin, address, jwt, profileId }) => {
      if (location.origin !== localOrigin) return;
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role: null,
            refreshToken: null,
            profileId,
            profileHandle: "playwright",
            authSessionVersion: "v2",
          },
        ])
      );
      localStorage.setItem("6529-wallet-active-address", address);
    },
    { localOrigin: new URL(baseURL!).origin, address, jwt, profileId }
  );
  const context = documentationFixture();
  context.owner_profile_id = profileId;
  context.profile = structuredClone(
    version === 2 ? legacyProfile : museumProfile
  ) as unknown as ApiArtworkDocumentationContext["profile"];
  context.modules["artwork"]!.answers = {
    title: {
      status: "provided",
      value: "Local browser study",
      intended_visibility: "public_record",
    },
    capture_date: {
      status: "provided",
      value: { precision: "year", start: "2026", approximate: false },
      intended_visibility: "public_record",
    },
    ...(version === 3
      ? {
          media_profiles: {
            status: "provided",
            value: ["photography"],
            intended_visibility: "public_record",
          },
        }
      : {}),
  } as ApiArtworkDocumentationContext["modules"][string]["answers"];
  const root = `/api/artwork-documentation/contexts/${context.id}`;
  const upload = `${root}/assets/uploads/${UPLOAD_ID}`;
  const counts = {
    starts: 0,
    transfers: 0,
    completes: 0,
    links: 0,
    cancels: 0,
    polls: 0,
  };
  const patches: Array<{
    module: string;
    operations: ApiArtworkDocumentationOperation[];
  }> = [];
  const unexpected: string[] = [];
  let releaseTransfer: () => void = () => {};
  const transferGate = new Promise<void>((resolve) => {
    releaseTransfer = resolve;
  });
  let ready = false;
  const asset = {
    id: FIXTURE_ASSET_ID,
    filename: FIXTURE_FILE.name,
    size_bytes: FIXTURE_FILE.buffer.length,
    declared_mime: FIXTURE_FILE.mimeType,
    detected_mime: FIXTURE_FILE.mimeType,
    sha256: createHash("sha256").update(FIXTURE_FILE.buffer).digest("hex"),
    width: 1,
    height: 1,
    role: "artwork_final",
    intended_visibility: "public_record",
    state: "uploading",
    has_preview: false,
    has_media_preview: false,
    technical_metadata: {
      version: 1,
      characterization: "partial",
      method: "local browser fixture",
      detected_format: "PNG",
      format_registry: { status: "unidentified" },
      original_sha256: createHash("sha256")
        .update(FIXTURE_FILE.buffer)
        .digest("hex"),
      measured_at: "2026-09-01T00:00:00.000Z",
      properties: { width: 1, height: 1 },
      warnings: [],
      c2pa: { status: "no_manifest", trust: "not_assessed" },
    },
  } as unknown as ApiArtworkDocumentationAsset;
  const session = () => ({
    asset: { ...asset, state: ready ? "ready" : asset.state },
    upload_id: UPLOAD_ID,
    can_mutate: true,
    policy: { part_size_bytes: 16777216, parallel_parts: 3 },
    received_parts: [],
    expires_at: Date.now() + 600000,
  });
  const headers = {
    "access-control-allow-origin": new URL(baseURL!).origin,
    "access-control-allow-headers":
      "authorization,content-type,idempotency-key,if-match,x-api-key",
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "access-control-expose-headers": "etag",
  };
  // The shared shell opens a socket even on documentation routes. Keep the
  // exact local fixture socket open without connecting to a deployed service.
  const socketUrl = new URL(origin);
  socketUrl.protocol = "ws:";
  await page.routeWebSocket(socketUrl.href, (socket) => {
    socket.onMessage(() => {});
  });
  await page.route(`${origin}/api/auth/session-refresh`, async (route) => {
    const credentialsHeaders = {
      ...headers,
      "access-control-allow-credentials": "true",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: credentialsHeaders });
      return;
    }
    // The loopback server still validates the request. Keep this fixture's
    // synthetic identity consistent if the normal auth code refreshes it.
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({
      response,
      headers: { ...response.headers(), ...credentialsHeaders },
      json: response.ok() ? { ...body, access_token: jwt } : body,
    });
  });
  const respond = (route: Route, body: unknown, status = 200) =>
    route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  const versionMatches = (route: Route) =>
    route.request().headers()["if-match"] ===
    `"draft-${context.draft_version}"`;
  await page.route(
    `${origin}/__artwork-documentation-upload`,
    async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({ status: 204, headers });
        return;
      }
      counts.transfers += 1;
      await transferGate;
      await route.fulfill({
        status: 200,
        headers: { ...headers, etag: '"local-part-1"' },
        body: "",
      });
    }
  );
  await page.route(`${origin}/api/artwork-documentation/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (method === "GET" && path === "/api/artwork-documentation/profiles") {
      await respond(route, {
        enabled: true,
        self_service_enabled: true,
        profiles: [context.profile],
      });
      return;
    }
    if (method === "GET" && path === root) {
      await respond(route, context);
      return;
    }
    if (
      method === "GET" &&
      [`${root}/threads`, `${root}/revisions`].includes(path)
    ) {
      await respond(route, { data: [], next: false, count: 0, page: 1 });
      return;
    }
    if (method === "PATCH" && path.startsWith(`${root}/modules/`)) {
      const module = path.slice(`${root}/modules/`.length);
      const body = request.postDataJSON() as {
        operations: ApiArtworkDocumentationOperation[];
      };
      patches.push({ module, operations: body.operations });
      if (!versionMatches(route)) {
        await respond(
          route,
          { code: "DRAFT_VERSION_MISMATCH", error: "Draft changed" },
          409
        );
        return;
      }
      // Independent server rule: incomplete years must never be persisted.
      const malformed = body.operations.some((operation) => {
        if (
          operation.field !== "capture_date" ||
          operation.answer?.status !== "provided"
        )
          return false;
        const value = operation.answer.value as {
          precision?: string;
          start?: string;
        };
        return value.precision === "year" && !/^\d{4}$/.test(value.start ?? "");
      });
      if (malformed) {
        await respond(
          route,
          { code: "INVALID_DATE_VALUE", error: "Year must have four digits" },
          422
        );
        return;
      }
      for (const operation of body.operations) {
        if (operation.op === "unset")
          delete context.modules[module]!.answers[operation.field];
        else if (operation.answer)
          context.modules[module]!.answers[operation.field] = operation.answer;
      }
      context.draft_version += 1;
      await respond(route, context);
      return;
    }
    if (method === "POST" && path === `${root}/assets/uploads`) {
      counts.starts += 1;
      await respond(route, session());
      return;
    }
    if (method === "POST" && path === `${upload}/parts`) {
      await respond(route, {
        parts: [
          {
            part_number: 1,
            url: `${origin}/__artwork-documentation-upload`,
            headers: {},
          },
        ],
      });
      return;
    }
    if (method === "POST" && path === `${upload}/complete`) {
      counts.completes += 1;
      asset.state = "processing";
      await respond(route, { asset });
      return;
    }
    if (method === "GET" && path === upload) {
      counts.polls += 1;
      await respond(route, session());
      return;
    }
    if (method === "DELETE" && path === upload) {
      counts.cancels += 1;
      await respond(route, {});
      return;
    }
    if (method === "POST" && path === `${root}/asset-links`) {
      counts.links += 1;
      if (options.failFirstAttachment && counts.links === 1) {
        await respond(
          route,
          { code: "SERVICE_UNAVAILABLE", error: "Please retry" },
          503
        );
        return;
      }
      if (!versionMatches(route)) {
        await respond(
          route,
          { code: "DRAFT_VERSION_MISMATCH", error: "Draft changed" },
          409
        );
        return;
      }
      const body =
        request.postDataJSON() as ApiArtworkDocumentationAssetLinkRequest;
      asset.state = "ready";
      context.assets = [asset];
      context.asset_links = [
        {
          label: "",
          description: "",
          source_of_asset: "artist",
          source_credit: "",
          derived_from_asset_ids: [],
          deposit_note: "",
          ...body,
          id: "55555555-5555-4555-8555-555555555555",
          manifest: asset,
        },
      ];
      context.draft_version += 1;
      await respond(route, context);
      return;
    }
    unexpected.push(`${method} ${path}`);
    await respond(route, { error: "No fixture exists for this request" }, 404);
  });
  return {
    context,
    counts,
    patches,
    unexpected,
    releaseTransfer,
    finishProcessing: () => {
      ready = true;
    },
    path: `/artwork-documentation/works/${context.work_id}/contexts/${context.id}?section=artwork`,
  };
}
