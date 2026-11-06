# Sanctions page

## Overview

`/sanctions` explains, in plain language, how 6529 follows sanctions laws. The
page has three parts:

- **Places**: where 6529.io is not available.
- **Wallet addresses**: the policy for wallet addresses on official sanctions
  lists.
- **The list**: the wallet addresses 6529 checks, grouped by the authority that
  published them.

The page shows official public data only. It never shows which 6529 profiles
or wallets matched a list.

## Location in the site

- Route: `/sanctions` (stable path, so the Terms of Service can link to it).
- Download: `/sanctions/sanctions-list.v1.json` returns the exact bytes whose
  SHA-256 and IPFS CID the page shows.
- There is no navigation entry. Users reach the page from links, help answers
  and search engines.

## Places

The page lists the places under comprehensive US sanctions where 6529.io is not
available:

- Cuba
- Iran
- North Korea
- The Crimea region of Ukraine, including Sevastopol
- The Donetsk and Luhansk regions of Ukraine

Location is estimated from the visitor's IP address and network. The page
explains the effect of VPNs and travel, and gives a contact for wrong blocks.

## Wallet addresses

The page names the official lists that are checked:

- United States (OFAC SDN)
- United Kingdom
- European Union
- Switzerland (SECO)
- Japan (Ministry of Finance)
- South Korea (FSC)
- Israel (NBCTF seizure orders still in force)
- Canada, whose list currently has no wallet addresses

It also states the rules:

- A listing on any one list is enough.
- A listed wallet affects its whole consolidated profile.
- A delegation to or from a listed wallet carries no rights, and the other
  wallet is not blocked because of it.
- Listed profiles can browse while signed out, but cannot sign in or take
  actions.
- The list is rebuilt daily from the official sources.

**Appeals.** People who think a match is wrong email support. Address-level
corrections are published. A genuine listing can only be removed by the
authority that made it; the page links to OFAC's removal process.

## The list

- **Summary:** the number of addresses checked, the number of official lists,
  and when the list was built.
- **Verification:** the list's SHA-256 and IPFS CID, plus a download of the
  exact bytes.
- **Groups:** one per authority, in this order: United States, United Kingdom,
  European Union, Switzerland, Japan, South Korea, Israel, Canada. Each shows
  its address count, when the source was last updated, and a link to the
  official source.
- **Entries:** each shows the address, the chain labels as published, the
  listing reference and programme, the listed name, and the listing date
  where the source states one.
- **Lapsed Israeli orders:** orders past their validity date appear in their
  own group, marked "Lapsed, not enforced". An address there may still appear
  on another list.
- **Search:** filters entries by address, name, reference or chain. The result
  count is announced to screen readers.

## Data source

Until the daily signed release is published, the page renders a preview
snapshot built from the official sources on 2026-11-06 with the backend
builder.

- The page recomputes the snapshot's canonical bytes and checks them against
  the pinned SHA-256 and CID before rendering.
- It re-renders at most hourly, so an Israeli order moves to the lapsed group
  on the right day.

## Edge cases

- **Search with no matches:** "No entries match your search."
- **Canada:** "This list currently includes no wallet addresses."
- **Missing listing date:** shown as "Not stated".

## Localization

The page is message-backed (`i18n/messages/sanctions.en-US.json`, namespace
`sanctions`), but only `en-US` copy exists so far. This fallback debt is
tracked here:

- **Route:** `/sanctions`, including the list browser.
- **Untranslated surface:** all page copy, including the authority and list
  names. Official entity names and listing references stay as published,
  because they are source data.
- **Current behavior:** copy is rendered in `en-US` on the server, as on the
  Museum pages. Other supported locales fall back to `en-US`, and dates and
  numbers use the `en-US` formats.
- **User impact:** readers in other locales see English. The page is fully
  usable, and nothing is hidden or broken.
- **Owner and follow-up:** sanctions lane R13. Add `en-GB`, `fr-FR`, `es-ES`
  and `de-DE` dictionaries after the copy has been reviewed (the wording is
  aligned with the country block page).
- **Remediation path:** translate the namespace, then render with the
  request's locale once route-level localization lands. The search status
  already uses plural rules.

## Related

- [Shared](shared/README.md)
- [Navigation](navigation/README.md)
