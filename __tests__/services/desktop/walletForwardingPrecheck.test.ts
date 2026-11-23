/**
 * @jest-environment-options {"url": "http://localhost:6529/"}
 */
import { toHex } from "viem";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { isDesktopShell } from "@/helpers/desktop-shell";
import { parseWalletRequest } from "@/lib/desktop/wallet-forwarding";
import {
  buildDropSignatureContext,
  readWalletPayloadHash,
  shortWalletPayloadHash,
} from "@/lib/desktop/walletRequestContext";
import {
  desktopWalletAcceptsContext,
  desktopWalletSignsSafeTx,
  showDesktopWalletRefusal,
  showDesktopWalletSafeTxRefusal,
} from "@/services/desktop/desktopBrowserWallet";
import {
  buildSafeTxVectors,
  SAFE_TX_SIGNER,
} from "@/__tests__/fixtures/desktop-wallet-safe-tx/vectors";
import { walletForwardingPrecheck } from "@/services/desktop/walletForwardingPrecheck";
import {
  __resetWalletRequestContextsForTests,
  rememberWalletRequestContext,
} from "@/services/desktop/walletRequestContexts";
import { buildDropSignatureMessage } from "@/services/wallet-signatures/structured-wallet-signatures";

jest.mock("@/helpers/desktop-shell", () => ({ isDesktopShell: jest.fn() }));
jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  desktopWalletAcceptsContext: jest.fn(),
  desktopWalletSignsSafeTx: jest.fn(() => false),
  showDesktopWalletRefusal: jest.fn(),
  showDesktopWalletSafeTxRefusal: jest.fn(),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const DROP = {
  wave_id: "wave-1",
  drop_type: ApiDropType.Chat,
  title: null,
  parts: [{ content: "gm", media: [] }],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  signature: null,
  signer_address: ADDRESS,
};
const MESSAGE = buildDropSignatureMessage({
  address: ADDRESS,
  drop: DROP,
  termsOfService: null,
}).message;
const FINGERPRINT = shortWalletPayloadHash(
  readWalletPayloadHash(MESSAGE, "drop")!
);

const requestFor = (text: string) => {
  const parsed = parseWalletRequest(
    {
      method: "personal_sign",
      params: [toHex(text), ADDRESS],
      address: ADDRESS,
      chainId: 1,
    },
    [1]
  );
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.value;
};

describe("walletForwardingPrecheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetWalletRequestContextsForTests();
    jest.mocked(isDesktopShell).mockReturnValue(true);
    jest.mocked(desktopWalletAcceptsContext).mockReturnValue(true);
  });

  it("adds the remembered content and the fingerprint to a drop signature", () => {
    const context = buildDropSignatureContext({
      drop: DROP,
      termsOfService: null,
    });
    rememberWalletRequestContext(MESSAGE, () => context);
    expect(walletForwardingPrecheck(requestFor(MESSAGE))).toEqual({
      fingerprint: FINGERPRINT,
      context,
    });
    // Taken once.
    expect(walletForwardingPrecheck(requestFor(MESSAGE))).toEqual({
      fingerprint: FINGERPRINT,
    });
  });

  it("sends no content the page would not show, or to a shell that does not accept it", () => {
    rememberWalletRequestContext(MESSAGE, () =>
      buildDropSignatureContext({ drop: DROP, termsOfService: "other" })
    );
    expect(walletForwardingPrecheck(requestFor(MESSAGE))).toEqual({
      fingerprint: FINGERPRINT,
    });

    jest.mocked(desktopWalletAcceptsContext).mockReturnValue(false);
    rememberWalletRequestContext(MESSAGE, () =>
      buildDropSignatureContext({ drop: DROP, termsOfService: null })
    );
    expect(walletForwardingPrecheck(requestFor(MESSAGE))).toEqual({
      fingerprint: FINGERPRINT,
    });
  });

  it("keeps nothing on the web", () => {
    jest.mocked(isDesktopShell).mockReturnValue(false);
    const build = jest.fn(() => "{}");
    rememberWalletRequestContext(MESSAGE, build);
    expect(build).not.toHaveBeenCalled();
    expect(walletForwardingPrecheck(requestFor(MESSAGE))).toEqual({
      fingerprint: FINGERPRINT,
    });
  });

  it("refuses what the page would refuse", () => {
    expect(walletForwardingPrecheck(requestFor("free text"))).toBeNull();
    expect(showDesktopWalletRefusal).toHaveBeenCalledTimes(1);
  });

  it("sends a Safe transaction only to a 6529 Desktop with the same table", () => {
    const vector = buildSafeTxVectors().find(
      (item) => item.name === "a batch of registrations on both registries"
    )!;
    const parsed = parseWalletRequest(
      {
        method: "eth_signTypedData_v4",
        params: [SAFE_TX_SIGNER, vector.payload],
        address: SAFE_TX_SIGNER,
        chainId: vector.chainId,
      },
      [vector.chainId]
    );
    if (!parsed.ok) throw new Error(parsed.problem);
    jest.mocked(desktopWalletSignsSafeTx).mockReturnValue(false);
    expect(walletForwardingPrecheck(parsed.value)).toBeNull();
    expect(showDesktopWalletSafeTxRefusal).toHaveBeenCalled();
    jest.mocked(desktopWalletSignsSafeTx).mockReturnValue(true);
    expect(walletForwardingPrecheck(parsed.value)).toEqual({
      fingerprint: null,
    });
  });
});
