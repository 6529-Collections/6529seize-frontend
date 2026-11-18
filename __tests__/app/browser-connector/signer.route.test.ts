/**
 * @jest-environment node
 */
jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { GET, dynamic } from "@/app/browser-connector/signer/route";
import { getDesktopWalletRequestSigner } from "@/config/desktopWalletEnv";

const SIGNER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

describe("GET /browser-connector/signer", () => {
  const original = process.env["DESKTOP_WALLET_REQUEST_SIGNER"];

  afterEach(() => {
    if (original === undefined) {
      delete process.env["DESKTOP_WALLET_REQUEST_SIGNER"];
    } else {
      process.env["DESKTOP_WALLET_REQUEST_SIGNER"] = original;
    }
  });

  it("is read at request time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("is not found on the web, where no desktop shell sets a signer", async () => {
    delete process.env["DESKTOP_WALLET_REQUEST_SIGNER"];
    const response = GET();
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the checksummed signer the desktop shell set", async () => {
    process.env["DESKTOP_WALLET_REQUEST_SIGNER"] = ` ${SIGNER} `;
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      signer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });
  });

  it("ignores a value that is not an address", () => {
    expect(
      getDesktopWalletRequestSigner({
        DESKTOP_WALLET_REQUEST_SIGNER: "nope",
      } as unknown as NodeJS.ProcessEnv)
    ).toBeNull();
    expect(getDesktopWalletRequestSigner({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
