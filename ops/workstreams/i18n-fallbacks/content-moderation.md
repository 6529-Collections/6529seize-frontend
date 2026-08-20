# Content Moderation I18n Fallback Debt

## Scope

- Routes/components: content moderation actions and tombstones, `/content-preferences`, `/content-moderation`, and the drop-composer safety-check rejection.
- Untranslated surface: the complete `contentModeration.*` message namespace, including visible labels, feedback, errors, and accessible status text.
- Current fallback: these surfaces resolve the browser locale through `t()`, but supported non-source locale dictionaries currently fall back to the reviewed `en-US` content-moderation messages.
- User impact: moderation controls remain complete and accessible in English while users of other supported locales see source-locale copy for this feature.
- Owner/follow-up: frontend content-moderation localization follow-up.
- Remediation path: add reviewed `contentModeration.*` messages to every supported locale dictionary, verify the report dialog, tombstones, preferences, moderator queue, composer error feedback, and accessible names, then remove this record.
