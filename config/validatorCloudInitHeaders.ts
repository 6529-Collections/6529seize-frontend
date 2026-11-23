import { VALIDATOR_CLOUD_INIT_PATH } from "../lib/validator-page/cloudInit";

// The validator's cloud startup script is read by people before they paste
// its user data, and by `curl` on a new server. Next would serve a `.sh`
// file as application/x-sh, which browsers download; as plain text it opens
// in the tab. Next's static file server keeps a Content-Type set here.
export const validatorCloudInitHeaders = {
  source: VALIDATOR_CLOUD_INIT_PATH,
  headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
};
