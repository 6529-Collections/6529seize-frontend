# Homepage localization follow-up

The homepage refinement preserves existing copy and data behavior. The
Coming up next-mint label, rank labels,
artwork fallbacks, hero, and mission copy remain English-only. Coming up date
formatting also retains its existing browser-locale formatter and day/month
ordering. Visitors using another locale therefore still see English labels
and the existing date presentation on these surfaces.

Owner: frontend homepage maintainers. Follow-up: extract these surfaces into
the shared message catalog with explicit `en-US` fallback, use complete
interpolated rank messages, and route dates through the shared locale-aware
formatters. The waves section and Coming up header already use the shared catalog. Keep this work
separate from the reviewed layout so translation migration can be tested
across supported locales without changing the current release's copy.
