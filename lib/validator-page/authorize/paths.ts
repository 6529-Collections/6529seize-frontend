/** The phone page: public, and without the site's sign-in prompt. */
export const VALIDATOR_AUTHORIZE_PATH = "/validator/authorize";

export function isValidatorAuthorizePath(pathname: string | null): boolean {
  return (
    pathname === VALIDATOR_AUTHORIZE_PATH ||
    pathname?.startsWith(`${VALIDATOR_AUTHORIZE_PATH}/`) === true
  );
}
