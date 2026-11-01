import {
  isUserRejectedSigningError,
  isWalletConnectSessionError,
} from "@/helpers/wallet-error.helpers";

describe("isWalletConnectSessionError", () => {
  it.each([
    "No matching key. session topic doesn't exist: 4f2c",
    "Missing or invalid. request() session topic doesn't exist: 4f2c",
    "Expired. session topic: 4f2c",
    "Request expired. Please try again.",
    "Proposal expired",
    "Failed to publish payload, please try again.",
    "WebSocket connection closed abnormally with code: 3000",
    "Relayer connection failed",
    "Socket stalled when trying to connect to wss://relay.walletconnect.org",
  ])("recognizes %s", (message) => {
    expect(isWalletConnectSessionError(new Error(message))).toBe(true);
  });

  it("looks through wrapped causes", () => {
    const error = Object.assign(
      new Error("Couldn't sign in with this wallet"),
      {
        cause: Object.assign(new Error("An unknown RPC error occurred."), {
          cause: { message: "No matching key. pairing topic doesn't exist" },
        }),
      }
    );
    expect(isWalletConnectSessionError(error)).toBe(true);
  });

  it.each([
    undefined,
    null,
    "No matching key",
    new Error("User rejected the request."),
    new Error("Wallet provider error"),
    { name: "UserRejectedRequestError", code: 4001 },
  ])("ignores %p", (error) => {
    expect(isWalletConnectSessionError(error)).toBe(false);
  });

  it("keeps user rejection separate", () => {
    expect(isUserRejectedSigningError({ code: 4001 })).toBe(true);
    expect(isUserRejectedSigningError(new Error("Expired."))).toBe(false);
  });
});
