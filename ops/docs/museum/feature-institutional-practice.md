# Institutional practice

[Network Museum documentation](README.md)

## Overview

_A field of practice_ is the Network Museum's comparative study of fourteen
institutions whose work bears directly on contemporary art, digital art,
collection publishing, conservation, and public research. The study pairs a
long-form essay with one profile for each institution and a register of the
primary sources used in the research.

Each profile identifies demonstrated practices, explains what the Network
Museum can adopt, and states where the comparison reaches its limit. The study
is a working instrument for building the Museum; it is neither a ranking nor an
endorsement of every institutional policy.

## Location in the Site

- Study: `/museum/network/stories/a-field-of-practice`
- Institutional profile: `/museum/network/stories/a-field-of-practice/{slug}`
- Primary-source register: `/museum/network/stories/a-field-of-practice/sources`

The study is also linked from `/museum/network/stories`.

## Entry Points

- Open **Stories & Research** in the Museum navigation, then choose _A field of
  practice_.
- Follow an institution from the numbered directory on the study page.
- Open **Sources** from the study or any institutional profile.
- Use **Read the source**, **Propose an edit**, or **Contributor guide** in the
  source panel at the foot of a Museum page.

## User Journey

1. Read the comparative essay to understand the practices under examination.
2. Choose an institution from the fourteen-profile directory.
3. Read the profile's evidence, the practices proposed for adoption, and the
   stated limits of the analogy.
4. Follow citations to the institution's own collection, conservation,
   research, or program material.
5. Open the source register to inspect the complete research base and the date
   attached to each source.
6. Open **Read the source** to inspect the exact Museum manuscript behind the
   page. Choose **Propose an edit** to prepare a change against the maintained
   repository, or **Contributor guide** for review and submission requirements.

## Common Scenarios

### Compare institutional approaches

Begin with the essay, then move between profiles. The profile titles and order
match the governed Museum manuscripts. Each profile keeps evidence, lessons,
and limits together so that a useful precedent remains attached to its
institutional context.

### Check a factual claim

Use the citations in the profile or open the source register. External sources
open over HTTPS in a separate tab. The source register records the source type,
the date shown by the publisher, and the use made of that evidence.

### Improve the research

**Propose an edit** opens the current manuscript on the repository's `main`
branch. A contribution may add stronger evidence, correct a statement, improve
accessibility, or sharpen an interpretation. Repository review determines
whether the proposal enters a later Museum edition.

### Cite the Museum's edition

**Read the source** points to the immutable commit used to render the page.
That link preserves the exact manuscript even after later revisions are
published.

## Edge Cases

- A citation may lead to an institutional page that has moved or disappeared.
  The Museum source register preserves the citation and its research date; it
  does not silently substitute a different source.
- Long institution names, tables, and source URLs wrap or scroll within the
  reading surface. The page itself remains within the viewport at 390 pixels.
- The current public edition may be replaced while a visitor is reading. Every
  page in a loaded edition continues to identify the same exact source commit.
- A profile slug outside the declared fourteen-profile inventory resolves to a
  not-found page.

## Failure and Recovery

The study is admitted as one publication: the essay, all fourteen profiles,
and the source register must validate from the same repository commit. The site
does not assemble a partial study from different editions.

If a fresh repository check fails, the Museum may identify and serve its last
complete verified edition while the refresh is retried. If no complete edition
is available, the route displays the Museum publication-unavailable state.
External citation failures do not alter the Museum manuscript; readers can use
the source register and exact source link while the publisher's page is
unavailable.

## Limitations / Notes

- The profiles describe evidence available by the research cutoff printed in
  each manuscript. Institutional collections, websites, and programs continue
  to change.
- The Network Museum remains responsible for applying each lesson to its own
  collection, technical environment, legal duties, and public mandate.
- GitHub is the Museum's transitional public record. The planned on-chain
  registry has not been deployed; the source panel identifies the repository
  edition currently used by the site.
- The website publishes the research for reading and contribution. The
  governed repository preserves the manuscript, citations, review history, and
  release commitments.

## Related Pages

- [Network Museum documentation](README.md)
- [Navigation](../navigation/README.md)
- [Public Contract Reviews](../public-reviews/README.md)
- [Documentation home](../README.md)
