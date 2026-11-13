/** @jest-environment node */
import {
  openConnectionSetup,
  sealConnectionSetup,
  type ConnectionSetupBundle,
} from "@/lib/device-signing/connection-setup-envelope";

const wallet = `0x${"1".repeat(40)}`;
const bundle: ConnectionSetupBundle = {
  version: 1,
  profileId: "11111111-1111-4111-8111-111111111111",
  privateKey: "PRIVATE-KEY-MATERIAL",
  mlsState: "FRESH-MLS-STATE",
  request: {
    grant: {
      wallet,
      device_key: `0x${"2".repeat(64)}`,
      mls_device_key: `0x${"3".repeat(64)}`,
      ciphersuite: 79,
      scopes: ["post", "edit", "delete", "react"],
      issued_at: 1000,
      expires_at: 2000,
      origin: "6529 Desktop",
    },
    wallet_signature: "0x1234",
    device_label: "6529 Desktop",
  },
};

it("round trips a v2 grant's suite set (D172)", async () => {
  const v2: ConnectionSetupBundle = {
    ...bundle,
    request: {
      ...bundle.request,
      grant: {
        ...bundle.request.grant,
        version: 2,
        ciphersuite: 78,
        ciphersuites: [78],
      },
    },
  };
  const sealed = await sealConnectionSetup(v2, "desktop");
  expect(
    await openConnectionSetup(sealed.envelope, sealed.secret, wallet, "desktop")
  ).toEqual(v2);
});

it.each(["native", "desktop"] as const)(
  "round trips encrypted setup for %s without exposing keys to the API",
  async (target) => {
    const sealed = await sealConnectionSetup(bundle, target);
    expect(sealed.envelope).toMatch(/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);
    expect(sealed.secret).toHaveLength(43);
    expect(sealed.envelope).not.toContain(bundle.privateKey);
    expect(sealed.envelope).not.toContain(bundle.mlsState);
    expect(
      await openConnectionSetup(sealed.envelope, sealed.secret, wallet, target)
    ).toEqual(bundle);
  }
);

it("rejects another wallet, target, unlock key, or tampered ciphertext", async () => {
  const sealed = await sealConnectionSetup(bundle, "native");
  const other = await sealConnectionSetup(bundle, "native");
  await expect(
    openConnectionSetup(
      sealed.envelope,
      sealed.secret,
      `0x${"4".repeat(40)}`,
      "native"
    )
  ).rejects.toThrow();
  await expect(
    openConnectionSetup(sealed.envelope, sealed.secret, wallet, "desktop")
  ).rejects.toThrow();
  await expect(
    openConnectionSetup(sealed.envelope, other.secret, wallet, "native")
  ).rejects.toThrow();
  const changed = `${sealed.envelope.slice(0, 24)}AAAA${sealed.envelope.slice(28)}`;
  await expect(
    openConnectionSetup(changed, sealed.secret, wallet, "native")
  ).rejects.toThrow();
});

it("uses independent fresh wrapping keys and rejects unbounded input", async () => {
  const one = await sealConnectionSetup(bundle, "native");
  const two = await sealConnectionSetup(bundle, "native");
  expect(one.secret).not.toBe(two.secret);
  expect(one.envelope).not.toBe(two.envelope);
  await expect(
    openConnectionSetup("v1." + "A".repeat(32768), one.secret, wallet, "native")
  ).rejects.toThrow();
});
