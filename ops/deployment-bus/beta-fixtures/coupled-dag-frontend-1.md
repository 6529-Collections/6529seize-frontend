# Release Bus v2 coupled DAG frontend beta fixture 1

This file intentionally changes no runtime behavior. It gives the bounded
operator-only coupled staging acceptance test one exact green frontend
merge-tree. The candidate depends on the matching backend fixture, so frontend
deployment cannot begin until the backend DAG has completed successfully.

- Test ID: `coupled-dag-1`
- Candidate ID: `244b7d81-469d-4cad-8855-960cceb7f121`
- Backend candidate: `70024a48-7130-43ed-b2c9-9fb0347479c5`
- Global Release Bus v2 mode: `OFF`
