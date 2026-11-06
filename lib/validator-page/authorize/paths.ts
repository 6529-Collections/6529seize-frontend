/** The phone page: public, and without the site's sign-in prompt. */
export const VALIDATOR_AUTHORIZE_PATH = "/validator/authorize";

/** This one path exactly: no prefix, no subpath, no other page. */
export function isValidatorAuthorizePath(pathname: string | null): boolean {
  return pathname === VALIDATOR_AUTHORIZE_PATH;
}
