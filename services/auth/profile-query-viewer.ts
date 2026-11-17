import { sha256 } from "js-sha256";
import { getAuthJwt } from "./auth.utils";

// The token identifies the exact session and acting role. Only its digest
// goes into the query key and the streamed React payload.
export const profileQueryViewer = (token: string | null): string | null =>
  token ? sha256(token) : null;

export const getCurrentProfileQueryViewer = (): string | null =>
  profileQueryViewer(getAuthJwt());
