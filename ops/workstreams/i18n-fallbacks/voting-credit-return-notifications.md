# Returned voting credit notifications

The notification card uses English source messages and locale-aware number
formatting. en-GB, fr-FR, es-ES and de-DE currently use the approved en-US message
fallback for the new win/deletion sentences. Submission and competition names
remain user-authored content. The row allows long translated text to wrap.

Before adding translations, replace the English binary one/many selector with
a locale-aware plural selector and the required message categories. Returned
allocations are positive safe integers; zero and fractional amounts are not
valid credit-return notification amounts.
