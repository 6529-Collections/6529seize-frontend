import {
  getDeviceKeyFingerprint,
  isExpectedDeviceGrantMessage,
  parseDeviceGrantMessage,
  renderDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";
import { buildVectorGrantMessage, VECTORS } from "./device-signing-test-utils";

const SIGNER = "0x1111111111111111111111111111111111111111";
const SCOPES = ["post", "edit", "delete", "react"];
// One day before the vector grant expires.
const NOW_MS = (VECTORS.grantExpiresAtSeconds - 24 * 60 * 60) * 1000;

const check = (
  message: string,
  overrides: Partial<Parameters<typeof isExpectedDeviceGrantMessage>[0]> = {}
) =>
  isExpectedDeviceGrantMessage({
    message,
    signerAddress: SIGNER,
    deviceKeyHex: VECTORS.deviceKey,
    scopes: SCOPES,
    nowMs: NOW_MS,
    ...overrides,
  });

describe("device grant sign-in message check", () => {
  it("accepts the challenge that grants exactly this key to this wallet", () => {
    expect(check(buildVectorGrantMessage())).toBe(true);
    expect(
      check(buildVectorGrantMessage(), {
        signerAddress: SIGNER.toUpperCase().replace("0X", "0x"),
      })
    ).toBe(true);
  });

  it("rejects a challenge for another key, wallet or scope set", () => {
    const message = buildVectorGrantMessage();
    expect(check(message, { deviceKeyHex: `0x${"ab".repeat(32)}` })).toBe(
      false
    );
    expect(
      check(message, {
        signerAddress: "0x2222222222222222222222222222222222222222",
      })
    ).toBe(false);
    expect(check(message, { scopes: ["post"] })).toBe(false);
  });

  it("rejects an expired or implausibly long grant", () => {
    const message = buildVectorGrantMessage();
    expect(
      check(message, { nowMs: VECTORS.grantExpiresAtSeconds * 1000 })
    ).toBe(false);
    expect(
      check(message, {
        nowMs: VECTORS.grantExpiresAtSeconds * 1000 - 200 * 86_400_000,
      })
    ).toBe(false);
  });

  it("rejects ordinary challenges, extra resources and edited statements", () => {
    expect(check(buildVectorGrantMessage({ resources: [] }))).toBe(false);
    expect(
      check(
        buildVectorGrantMessage({
          resources: [VECTORS.grantResource, "https://example.com"],
        })
      )
    ).toBe(false);
    expect(
      check(
        buildVectorGrantMessage({
          statement: VECTORS.grantStatement.replace("post, edit", "post"),
        })
      )
    ).toBe(false);
    expect(
      parseDeviceGrantMessage(
        buildVectorGrantMessage({
          resources: [VECTORS.grantResource.replace("post.edit", "edit.post")],
        })
      )
    ).toBeNull();
  });

  it("joins scopes as an English list and fingerprints the key", () => {
    const render = (scopes: string[]) =>
      renderDeviceGrantStatement({
        deviceKeyHex: VECTORS.deviceKey,
        scopes,
        expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
      });
    expect(render(["post"])).toContain("It may post. ");
    expect(render(["post", "edit"])).toContain("It may post and edit. ");
    expect(render(["post", "edit", "delete", "react", "vote"])).toContain(
      "It may post, edit, delete, react and vote. "
    );
    expect(getDeviceKeyFingerprint(VECTORS.deviceKey)).toBe(
      "d75a9801...f707511a"
    );
  });
});
