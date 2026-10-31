import { createSignedMessagesGrantRequest } from "@/components/auth/authSignedMessagesGrant";

const ADDRESS = "0x1111111111111111111111111111111111111111";

const createSubject = (
  overrides: Partial<
    Parameters<typeof createSignedMessagesGrantRequest>[0]
  > = {}
) => {
  const guard = { isCurrent: () => true, acceptCurrentState: () => true };
  const deps = {
    address: ADDRESS,
    canAuthenticate: true,
    canSignActiveWallet: true,
    createSigningAuthRequestGuard: jest.fn(() => guard),
    isActiveChainSupported: jest.fn(() => true),
    requestSignIn: jest.fn(async () => ({ success: true })),
    setAuthLoadingState: jest.fn(),
    setToast: jest.fn(),
    ...overrides,
  };
  return { deps, guard, request: createSignedMessagesGrantRequest(deps) };
};

describe("turn on signed messages", () => {
  it("signs in the active wallet once, requiring a device grant", async () => {
    const { deps, guard, request } = createSubject();

    await expect(request()).resolves.toEqual({ success: true });
    expect(deps.requestSignIn).toHaveBeenCalledWith({
      signerAddress: ADDRESS,
      role: null,
      authRequestGuard: guard,
      deviceGrantMode: "required",
    });
    expect(jest.mocked(deps.setAuthLoadingState).mock.calls).toEqual([
      ["signing"],
      ["idle"],
    ]);
  });

  it.each([
    ["without an address", { address: undefined }],
    ["for proxies or disabled wallet auth", { canAuthenticate: false }],
    ["on an unsupported chain", { isActiveChainSupported: () => false }],
  ])("does nothing %s", async (_case, overrides) => {
    const { deps, request } = createSubject(overrides);
    await expect(request()).resolves.toEqual({ success: false });
    expect(deps.requestSignIn).not.toHaveBeenCalled();
    expect(deps.setToast).not.toHaveBeenCalled();
  });

  it("asks to reconnect a wallet that cannot sign", async () => {
    const { deps, request } = createSubject({ canSignActiveWallet: false });
    await expect(request()).resolves.toEqual({ success: false });
    expect(deps.setToast).toHaveBeenCalledWith({
      message: "Reconnect the wallet for this profile and try again.",
      type: "error",
    });
    expect(deps.requestSignIn).not.toHaveBeenCalled();
  });

  it("resets the loading state when sign-in throws", async () => {
    const { deps, request } = createSubject({
      requestSignIn: jest.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(request()).rejects.toThrow("boom");
    expect(deps.setAuthLoadingState).toHaveBeenLastCalledWith("idle");
  });
});
