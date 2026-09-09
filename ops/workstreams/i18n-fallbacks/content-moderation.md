# Content Moderation I18n Fallback Debt

## Scope

- Routes/components: content moderation actions and tombstones, `/preferences`, `/content-moderation`, and the drop-composer safety-check rejection.
- Untranslated surface: the complete `contentModeration.*` message namespace, including visible labels, feedback, errors, and accessible status text.
- Current fallback: these surfaces resolve the browser locale through `t()`, but supported non-source locale dictionaries currently fall back to the reviewed `en-US` content-moderation messages.
- User impact: moderation controls remain complete and accessible in English while users of other supported locales see source-locale copy for this feature.
- Owner/follow-up: frontend content-moderation localization follow-up.
- Remediation path: add reviewed `contentModeration.*` messages to every supported locale dictionary, verify the report dialog, tombstones, preferences, moderator queue, composer error feedback, and accessible names, then remove this record.

## Block activity follow-up

- The `contentModeration.moderator.blockActivity.blocked` and `.unblocked` action labels currently use the same source-locale fallback. Visible text is also the accessible action text; there is no separate translated row summary to drift from it.
- The aligned action column is 7.5rem, with a fixed slot for the lock icon, inside a full-width feed. Before enabling translated labels, verify their text plus the lock icon at every container breakpoint, especially around 32rem, and at increased text size. Adjust wrapping or the shared column width if needed; do not truncate labels or profile handles.
- Owner: frontend content-moderation localization follow-up. Source-locale labels fit today; longer translations must pass browser layout and accessibility checks before release.
