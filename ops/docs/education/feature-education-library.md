# Education Library

[Education index](README.md)

## Overview

The Education library is a historical archive of 6529 Tweetstorms and podcast
appearances. The landing page also points to the original Open Metaverse thesis,
the current 6529 Network Museum, and the education collaboration contact.

## Location in the Site

- Education landing page: `/education`
- Tweetstorms archive: `/education/tweetstorms`
- Podcasts archive: `/education/podcasts`
- Collaboration contact: `/education/education-collaboration-form`

## Entry Points

- Open `/education` and choose **Tweetstorms** or **Podcasts**.
- Follow the contextual links from the landing page to the Open Metaverse
  overview, the Museum's institutional overview, its permanent collection, or
  its research hub.
- Select **send a collaboration inquiry** to open the collaboration page.

## User Journey

1. Open `/education` for an introduction to the library.
2. Choose the Tweetstorms or Podcasts archive.
3. Select an entry to open its original external source. Podcast entries also
   show their recorded publication dates.
4. Return to the Education page to follow related first-party context or open
   the collaboration contact.
5. On the collaboration page, select the support email address to prepare a
   message in the device's configured mail application.

## Common Scenarios

- Use Tweetstorms to find original 6529 threads by topic.
- Use Podcasts to find dated appearances and their original listening pages.
- Use the Open Metaverse link to read the original thesis in its historical
  context.
- Use the Museum links to move from the thesis into current public collection
  records and research.
- Use the collaboration contact for relevant education, research, advocacy, or
  policy inquiries.

## Edge Cases

- Tweetstorm and podcast destinations are external sources. Their availability
  and presentation are controlled by the destination site.
- Selecting the support email address requires a configured mail application.
  It prepares an email but does not send one automatically.

## Failure and Recovery

- If an external archive link is unavailable, return to the archive and choose
  another entry or try the original destination later.
- If the email link does not open a composer, copy `support@6529.io` into a mail
  application manually.

## Limitations / Notes

- The archive is primarily an index to original sources rather than a complete
  on-site edition of every Tweetstorm or podcast.
- Historical material remains historical; links to current Museum work provide
  present context without rewriting the original thesis.

### Localization fallback debt

| Field                     | Current exception                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route or component        | `/education` via `app/education/content.tsx`                                                                                                                                                                                    |
| Untranslated surface      | Migrated WordPress headings, paragraphs, and link labels, including the archive context and related first-party links changed here                                                                                              |
| Current fallback behavior | The route publishes its source copy in `en-US` only; it has no locale selector or partial-locale dictionary path                                                                                                                |
| User impact               | Visitors using another locale still receive a functional page and descriptive links, but the Education copy remains English                                                                                                     |
| Owner or follow-up        | Frontend localization maintainers; track the Education migrated-content conversion in the progressive i18n workstream before enabling a localized route                                                                         |
| Expected remediation      | Move Education blocks and link labels into the source message dictionary, preserve trusted-link rendering, add locale fallback tests, and then add localized routing only after metadata, canonical, and browser QA are defined |

## Related Pages

- [Education index](README.md)
- [Network Museum](../museum/README.md)
- [Public Museum Proposition](../museum/feature-public-museum-proposition.md)
