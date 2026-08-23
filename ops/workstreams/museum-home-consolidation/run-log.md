# Museum homepage consolidation run log

## 2026-08-23

- Confirmed production source base
  `2ed9d2e45cfdd0c31b01c07403848c6de220006a`.
- Diagnosed the repetition: the typed homepage rendered
  `MuseumTypedCollectionPresentation` and then the complete
  `MuseumAcquisitionStories` index using the same representative works.
- Removed the duplicate Collection preview and retained one complete
  acquisition section.
- Reworked the section heading, status summary, navigation, and responsive
  four-acquisition grid.
- Added a source-contract regression test that requires one acquisition
  section in the typed homepage and forbids restoration of the removed
  presentation component.
