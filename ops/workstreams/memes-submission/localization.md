# Memes submission localization

## Wallet signing guidance

- Surface: `SubmissionSigningNote`, shown in `AdditionalInfoStep` and
  `MemesSubmissionPreviewScreen` within the Main Stage submission modal.
- Untranslated keys: all `memes.submission.signing.*` messages.
- Current behavior: `en-GB`, `fr-FR`, `es-ES` and `de-DE` use the existing
  `en-US` fallback for these keys, including the explanation's accessible name.
- User impact: artists using those locales see English wallet guidance.
- Follow-up owner: the Memes submission frontend maintainers, as part of the
  progressive localization workstream.
- Remediation: translate the messages into the supported locale dictionaries,
  then verify accessible names, narrow-screen wrapping and short-screen scrolling
  in both submission screens. The current fallback was browser-verified in all
  five supported locales.

Keep `signing.notice` as one complete message so translators control wording,
clause order and punctuation together. It is not assembled from translated
fragments. Preserve the wallet-rendered literals `Submit a Meme Card to The Memes`
and `Unknown Signature Type` when translating the surrounding explanation;
artists use them to match the signing prompt. MetaMask and Rabby are product names.
