# Wave creation localization follow-up

The Quick Chat flow adds messages in `i18n/messages/wave-creation.en-US.json`.
The progressive localization policy permits these messages to fall back to
en-US in en-GB, fr-FR, es-ES and de-DE. Accessible names use the same messages
as visible controls. Existing translated controls retain their translations.

Affected route/components: `/waves/create`, the Waves create modal, global
Search, `CreateWaveQuickChat`, first-post validation, draft notices and the
creation-success toast. Non-English users see English Quick Chat copy and
accessible names until translations are available.

Owner: @simo6529. Tracked with frontend PR #4165. Remediation: add translated
keys to the existing partial locale dictionaries for each supported locale,
then check setup, validation, draft recovery and review on desktop and mobile.
The message-loader contract test verifies the current fallback for every locale.
