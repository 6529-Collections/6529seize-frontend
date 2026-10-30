import { isAddress } from "viem";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { getSessionNonce } from "@/services/auth/session-v2.utils";
import {
  AuthenticationNonceError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
} from "./authErrors";

// The declared response type is non-null, but an empty body still arrives.
const assertNonceResponse = (
  response: ApiSessionNonceResponse | null | undefined
): ApiSessionNonceResponse => {
  if (!response) {
    throw new NonceResponseValidationError(
      "Nonce API returned null or undefined response"
    );
  }

  if (
    !response.signable_message ||
    typeof response.signable_message !== "string" ||
    response.signable_message.length === 0
  ) {
    throw new NonceResponseValidationError(
      "Invalid signable_message in API response",
      response
    );
  }

  if (
    !response.server_signature ||
    typeof response.server_signature !== "string" ||
    response.server_signature.trim().length === 0
  ) {
    throw new NonceResponseValidationError(
      "Invalid server_signature in API response",
      response
    );
  }

  return response;
};

/** Fetches and validates the server's sign-in challenge for a wallet. */
export const getAuthNonce = async ({
  signerAddress,
  deviceGrant,
}: Parameters<typeof getSessionNonce>[0]): Promise<ApiSessionNonceResponse> => {
  if (!signerAddress || typeof signerAddress !== "string") {
    throw new InvalidSignerAddressError(signerAddress);
  }

  if (!isAddress(signerAddress)) {
    throw new InvalidSignerAddressError(signerAddress);
  }

  try {
    return assertNonceResponse(
      await getSessionNonce({ signerAddress, deviceGrant })
    );
  } catch (error) {
    if (
      error instanceof NonceResponseValidationError ||
      error instanceof InvalidSignerAddressError
    ) {
      throw error;
    }

    throw new AuthenticationNonceError(
      "Failed to obtain authentication nonce from server",
      error
    );
  }
};
