# Website studio example-language coverage

- Surface: `components/profile-cms-builder/studio/*`,
  `components/profile-cms/CmsStudioSiteRenderer.tsx`, and template recipes under
  `lib/profile-cms/studio/`.
- Current behavior: editor controls, template descriptions, upload and wallet
  controls use the five supported message dictionaries. The populated example
  websites have English editorial copy in their canonical document data.
  Template names, fictional names, artist credits and artwork titles remain
  authored content.
- Impact: members using French, Spanish or German can operate the studio in
  their language, but example headings, page names and body copy initially appear
  in English. Members can replace this writing through the ordinary page and
  section controls. Choosing another UI language does not translate an existing
  draft or change its signed content.
- Fallback: English sample document literals in the template recipes; these
  values do not use message fallback after the document is instantiated.
- Owner: frontend Website studio maintainers.
- Follow-up: add explicitly selected, editorially reviewed sample-document
  language variants before broadening the template language promise. Preserve
  artwork titles, credits, selected document language and existing draft hashes.
  Tracked in the Website studio delivery workstream and PR #3941.

Validation for this release checks matching keys across each of the five studio,
upload, wallet-import and template-description dictionaries. Published member
writing remains authored content and is not automatically translated.
