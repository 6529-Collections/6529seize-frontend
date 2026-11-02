import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { cache } from "react";

/**
 * Request-scoped (per render pass) memoized API headers for NextGen routes.
 * `generateMetadata` and the page both call this, so they share one headers
 * object and the request-scoped loaders keyed on it can dedupe. Nothing is
 * shared across requests.
 */
export const getNextgenRequestHeaders = cache(getAppCommonHeaders);
