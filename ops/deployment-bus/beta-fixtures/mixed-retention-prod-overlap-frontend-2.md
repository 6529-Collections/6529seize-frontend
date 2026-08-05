# Release Bus v2 mixed retention/production-overlap frontend fixture 2

This file intentionally changes no runtime behavior. It refreshes the frontend
member of the bounded operator-only mixed acceptance train after the immutable
release-cache retention repair. The candidate depends on the matching coupled
backend member, so frontend deployment cannot begin until that backend DAG has
completed. Its successful deployment must prune only validated old cache
entries and then contributes to the exact three-candidate manifest used by the
production-overlap beta.

- Test ID: `mixed-retention-prod-overlap-2`
- Candidate ID: `581f5522-900b-4f9f-b0aa-9b338c303a29`
- Backend candidate: `022b5a1d-6449-495a-962a-4f16b0b046a8`
- Global Release Bus v2 mode: `OFF`
