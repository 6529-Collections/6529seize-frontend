# Global error fallback localization debt

- Route/component: the App Router global error boundary and
  `components/error/Error.tsx`.
- Untranslated surface: the error heading and recovery message, retry control,
  stack-trace show/hide and copy controls, copy status, and digest label.
- Current fallback: the document title resolves through the `en-US`
  `errorFallback.pageTitle` message. The remaining copy renders from English
  literals; the decorative images use empty alternative text.
- User impact: users in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` contexts see a
  functional English error page until this provider-independent fallback is
  fully localized.
- Owner/follow-up: frontend error-surface localization follow-up.
- Remediation path: extract the remaining copy into `i18n/messages`, add
  reviewed translations, choose the supported locale without relying on the
  replaced root provider tree, verify wrapping and accessible names, then
  remove this debt record.
