import type { BeforeSendHookPayload } from "mixpanel-browser";

// These SDK properties can contain arbitrary navigation, search or campaign data.
// Keep identity/transport properties and the existing explicit product contracts.
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "utm_source_platform",
  "utm_campaign_id",
  "utm_creative_format",
  "utm_marketing_tactic",
  "dclid",
  "fbclid",
  "gclid",
  "ko_click_id",
  "li_fat_id",
  "msclkid",
  "sccid",
  "ttclid",
  "twclid",
  "wbraid",
  "gbraid",
];

export const MIXPANEL_PRIVATE_PROPERTIES = [
  "$current_url",
  "$referrer",
  "$referring_domain",
  "$initial_referrer",
  "$initial_referring_domain",
  "mp_keyword",
  "$search_engine",
  "current_page_title",
  "current_domain",
  "current_url_path",
  "current_url_protocol",
  "current_url_search",
  ...ATTRIBUTION_KEYS,
  ...ATTRIBUTION_KEYS.map((key) => `initial_${key}`),
  ...ATTRIBUTION_KEYS.map((key) => `$initial_${key}`),
];

const PRIVATE_PROPERTIES = new Set(MIXPANEL_PRIVATE_PROPERTIES);
const PILOT_PROPERTIES = new Set([
  "feature",
  "placement",
  "value",
  "platform",
  "viewer",
  "eligibility",
  "route_family",
  "selected",
  "selection_source",
  "exposure_kind",
  "action",
  "schema_version",
  // Mixpanel's identity and delivery metadata are preserved deliberately.
  "token",
  "distinct_id",
  "$device_id",
  "$user_id",
  "$anon_distinct_id",
  "$had_persisted_distinct_id",
  "$insert_id",
  "time",
  "$lib_version",
  "mp_lib",
  "mp_sent_by_lib_version",
  "$mp_loader",
  "$os",
  "$browser",
  "$browser_version",
  "$device",
  "$screen_height",
  "$screen_width",
]);

export function sanitizeMixpanelEnvelope(
  payload: BeforeSendHookPayload
): BeforeSendHookPayload {
  const isPilot =
    payload.event === "Wave Feature Seen" ||
    payload.event === "Wave Feature Activated";
  return {
    ...payload,
    properties: Object.fromEntries(
      Object.entries(payload.properties).filter(
        ([key]) =>
          !PRIVATE_PROPERTIES.has(key) &&
          (!isPilot || PILOT_PROPERTIES.has(key))
      )
    ),
  };
}

export function sanitizeMixpanelIdentityEnvelope(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...payload };
  for (const operation of ["$set", "$set_once"]) {
    const properties = payload[operation];
    if (
      properties !== null &&
      typeof properties === "object" &&
      !Array.isArray(properties)
    ) {
      sanitized[operation] = Object.fromEntries(
        Object.entries(properties).filter(
          ([key]) => !PRIVATE_PROPERTIES.has(key)
        )
      );
    }
  }
  return sanitized;
}

export const MIXPANEL_PRIVACY_CONFIG = {
  autocapture: false,
  track_pageview: false,
  record_sessions_percent: 0,
  track_marketing: false,
  skip_first_touch_marketing: true,
  store_google: false,
  stop_utm_persistence: true,
  save_referrer: false,
  property_blacklist: MIXPANEL_PRIVATE_PROPERTIES,
};
