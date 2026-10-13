import fixture from "@/__tests__/fixtures/app-wallet-encrypted-payloads.json";
import {
  decryptData,
  encryptData,
} from "@/components/app-wallets/app-wallet-helpers";

// Browser bundles resolve `crypto` to Next's crypto-browserify polyfill rather
// than node:crypto. Run the same fixtures through that polyfill so the client
// path is proven against the stored payloads too.
jest.mock("crypto", () =>
  jest.requireActual("next/dist/compiled/crypto-browserify")
);

jest.setTimeout(120000);

const { passphrase } = fixture;
const walletAddress = fixture.v1.address.salt;

describe("app-wallet payload compatibility through crypto-browserify", () => {
  // The mocked `crypto` module is the polyfill instance the code under test
  // receives; spying on it proves the polyfill really derived the keys.
  const polyfill = jest.requireMock<{
    pbkdf2: (...args: unknown[]) => void;
  }>("crypto");
  const pbkdf2Spy = jest.spyOn(polyfill, "pbkdf2");

  afterEach(() => {
    expect(pbkdf2Spy).toHaveBeenCalled();
    pbkdf2Spy.mockClear();
  });

  it("decrypts stored v2 and v1 fixtures", async () => {
    await expect(
      decryptData(walletAddress, fixture.v2.utf8_multibyte.envelope, passphrase)
    ).resolves.toBe(fixture.v2.utf8_multibyte.plaintext);
    await expect(
      decryptData(
        fixture.v1.utf8_multibyte.salt,
        fixture.v1.utf8_multibyte.payload,
        passphrase
      )
    ).resolves.toBe(fixture.v1.utf8_multibyte.plaintext);
  });

  it("round-trips new envelopes", async () => {
    const { plaintext } = fixture.v2.address;
    const envelope = await encryptData(walletAddress, plaintext, passphrase);

    await expect(
      decryptData(walletAddress, envelope, passphrase)
    ).resolves.toBe(plaintext);
  });
});
