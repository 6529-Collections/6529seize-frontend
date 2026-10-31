# Direct-Message Admission Localization Fallback Debt

- Routes/components: `/preferences` (**Notifications & messages**),
  `components/header/ProfilePreferencesSettings.tsx`,
  `components/header/ProfilePreferencesDirectMessageGroup.tsx`, and the
  new-DM refusal toasts from `helpers/waves/direct-message-admission.helpers.ts`
  used by `CreateDirectMessage`, `UserProfileTooltip`, and
  `UserPageHeaderClient`.
- Untranslated surface: the `profilePreferences.dm.GROUP_MEMBERS.*`,
  `profilePreferences.dm.blockNote`, and `profilePreferences.dm.group.*`
  messages (option label and description, group summary, Choose/Change group,
  required-group hint, unavailable-group warning, follow switch, picker dialog
  title and description, creation error), and the
  `directMessageAdmission.*` refusal messages.
- Current fallback: all of these exist only in the `en-US` source dictionary.
  `t()` resolves them to `en-US` in `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.
  The profile-header refusal toast resolves with `DEFAULT_LOCALE`, matching the
  rest of that header's messages. The other existing Preferences DM options are
  also `en-US` only.
- User impact: non-English locales see English copy for the group option and
  for refusal notices, which stay fully functional. Refusal copy never reveals a
  recipient's block in any locale, because the API reports a block with the
  same code as the Nobody setting.
- Owner/follow-up: frontend i18n backlog, together with the rest of the
  Preferences surface.
- Remediation path: add reviewed entries for the `profilePreferences.dm.*` and
  `directMessageAdmission.*` families to each supported locale dictionary,
  thread the active locale into the profile-header toast instead of
  `DEFAULT_LOCALE`, verify wrapping of the option card, warning, and dialog at
  phone width plus the accessible names of the switch and Save description,
  then remove this record.
