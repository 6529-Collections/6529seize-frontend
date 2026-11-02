export class AuthenticationNonceError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "AuthenticationNonceError";
  }
}

export class InvalidSignerAddressError extends Error {
  constructor(signerAddress: string) {
    super(`Invalid signer address: ${signerAddress}`);
    this.name = "InvalidSignerAddressError";
  }
}

export class NonceResponseValidationError extends Error {
  constructor(
    message: string,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "NonceResponseValidationError";
  }
}

/** "Turn on signed messages" could not obtain a device-grant challenge. */
export class DeviceGrantUnavailableError extends Error {
  constructor() {
    super("The sign-in challenge did not grant this device");
    this.name = "DeviceGrantUnavailableError";
  }
}
