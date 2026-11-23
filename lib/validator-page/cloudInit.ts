// The startup script that sets up a 6529 validator on a new cloud server,
// and the user data a holder pastes into the cloud provider's page to run
// it. 6529.io serves the script as a plain file, public/validator/
// cloud-init-v1.sh. The user data downloads it, checks its SHA-256 and only
// then runs it as root on the server's first start.
//
// A published script never changes: servers set up months later still
// check against the hash a holder copied. A changed script is a new file
// with a new name (cloud-init-v2.sh) and its own hash, and the old one stays.
//
// The limit of the check: the hash and the script come from the same site.
// It catches a file that was changed or damaged on the way. It doesn't
// protect against 6529.io itself being taken over.
//
// The script reads /validator/releases.json and downloads the release from
// /validator/download/, which the password gate covers. Turning the password
// gate back on stops cloud-init-v1 on every new server: the download gets the
// password page, and the script ends with "6529.io asks for a password
// before it hands out ... Nothing was installed."

/** Where 6529.io serves the startup script. Public, with no password. */
export const VALIDATOR_CLOUD_INIT_PATH = "/validator/cloud-init-v1.sh";

/**
 * The script's full address, as the user data downloads it.
 * @api
 */
export const VALIDATOR_CLOUD_INIT_URL = `https://6529.io${VALIDATOR_CLOUD_INIT_PATH}`;

/**
 * SHA-256 of public/validator/cloud-init-v1.sh, in hex.
 * @api
 */
export const VALIDATOR_CLOUD_INIT_SHA256 =
  "187ae6ac6461ecb6d89c261c037985b52a4d7756bf2eefd773d5f474fb37690b";

/**
 * Where the user data saves the script on the server before checking it.
 * Running it again from there, after deleting its marker, sets the server up
 * again.
 */
const SCRIPT_ON_SERVER = "/root/6529-setup.sh";

/**
 * What a holder pastes into the provider's startup script or user data box.
 * It downloads over HTTPS only, tries again for about a minute if 6529.io
 * doesn't answer, and runs the script only when the SHA-256 matches.
 * @api
 */
export const VALIDATOR_CLOUD_INIT_USER_DATA = [
  "#!/bin/bash",
  `curl -fsSL --proto '=https' --proto-redir '=https' --retry 5 --retry-delay 10 --retry-connrefused -o ${SCRIPT_ON_SERVER} ${VALIDATOR_CLOUD_INIT_URL}`,
  `echo "${VALIDATOR_CLOUD_INIT_SHA256}  ${SCRIPT_ON_SERVER}" | sha256sum -c - && bash ${SCRIPT_ON_SERVER}`,
  "",
].join("\n");
