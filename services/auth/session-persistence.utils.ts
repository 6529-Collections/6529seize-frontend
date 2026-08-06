import { TokenRefreshCancelledError } from "@/errors/authentication";
import {
  isNativeSecureStorageAvailable,
  setNativeRefreshToken,
} from "./native-refresh-token-storage";

export interface PersistSessionResponseOptions {
  readonly shouldPersist?: (() => boolean) | undefined;
}

type PersistableSessionResponse =
  | { readonly client_type: "web"; readonly address: string }
  | {
      readonly client_type: "native" | "desktop";
      readonly address: string;
      readonly native_refresh_token: string;
    };

export const assertSessionPersistenceIsCurrent = (
  options: PersistSessionResponseOptions
): void => {
  if (options.shouldPersist?.() === false) {
    throw new TokenRefreshCancelledError(
      "Auth state changed before session persistence completed"
    );
  }
};

export const persistNativeRefreshTokenIfNeeded = async (
  response: PersistableSessionResponse,
  options: PersistSessionResponseOptions
): Promise<"not-required" | "persisted" | "unavailable"> => {
  if (response.client_type === "web") {
    return "not-required";
  }
  if (!isNativeSecureStorageAvailable()) {
    return "unavailable";
  }

  assertSessionPersistenceIsCurrent(options);
  await setNativeRefreshToken({
    address: response.address,
    refreshToken: response.native_refresh_token,
  });
  return "persisted";
};
