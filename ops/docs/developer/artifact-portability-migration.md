# Frontend artifact portability: implementation boundary

The frontend currently produces environment-bound artifacts. The
`staging-deployment-v1` and `production-deployment-v1` manifests are accurate
about source and package identity, but they do not describe a portable package.
Each environment is built separately because environment-specific values are
written into Next.js output and into the standalone server bundle.

The checked-in `artifact-portability.v1` inventory records the distinction explicitly:

- source identity is the exact Git SHA;
- content identity covers the checked-in public and review inputs;
- toolchain identity covers `package.json`, `pnpm-lock.yaml`, and pinned tool versions;
- package identity is the SHA-256 of the deployable `package.zip`;
- runtime-configuration identity is a separate digest for the values baked into that
  package.

The producer also scans every regular file in the exact extracted bundle used to
construct `package.zip`. Every key declared by the public runtime schema, plus every
additional key actually observed in `PUBLIC_RUNTIME.json`, receives a closed
classification and a value digest. The scan records the extracted-tree digest,
file/byte totals, match counts, a digest of all matching paths, and at most twenty
sample paths per input. Raw runtime values are never written to the inventory.
Unknown keys remain explicit fail-closed blockers.

The inventory is report-only. Current `staging-deployment-v1` and
`production-deployment-v1` artifacts, along with legacy dual-profile artifacts,
are `NOT_PORTABLE`; neither reuse nor promotion is authorized by this contract. A
comparison may explain why staging and production differ, but it cannot approve
moving bytes between them and it cannot mutate an environment.

The report workflow separately verifies each source run's repository, workflow
path, event, successful conclusion, run head SHA, artifact name, source SHA,
environment, manifest digest, and exact producer-bound artifact contract before
comparison. It also obtains the named artifact's independent GitHub Actions API
digest and recomputes the complete downloaded-file membership and digest set
against `SHA256SUMS`; the checksum file is a claim to verify, not an authority.

## What must move out of package bytes

Before build-once/promote-twice can be enabled, the build must stop embedding these
environment-specific inputs in `next.config.ts`, `PUBLIC_RUNTIME.json`, the generated
client graph, or the standalone server bundle:

- API, WebSocket, and allowlist API endpoints;
- `BASE_ENDPOINT`;
- the NextGen chain identifier;
- the asset source switch (`ASSETS_FROM_S3`);
- the announced-version endpoint;
- AWS RUM, Mixpanel, and Sentry configuration, including the public-review profile;
- any additional endpoint, feature flag, or profile value that changes the runtime
  graph or generated asset URLs by environment.

The replacement is a signed, versioned runtime configuration supplied when the
artifact starts. It must be validated against the same schema in both environments,
kept outside the content-addressed package, and represented by its own
`runtime_config_sha256`. Server-only secrets remain runtime secrets and must never be
copied into the client bundle or the portability inventory.

## Activation gates

1. Build the same source tree twice with staging and production configuration and
   prove identical package bytes, not merely identical source or lockfile digests.
2. Scan the extracted package and generated client/server output for every known
   environment input, plus an explicit unknown-input failure path. Replace the
   current exact-literal scan with a portable-package proof that finds encoded,
   transformed, and indirectly generated configuration before activation.
3. Start the identical package with two signed runtime configurations and prove that
   endpoint selection, chain selection, asset selection, announcement, telemetry,
   Sentry, and public-review behavior are all runtime-controlled.
4. Bind one package digest to two distinct runtime-configuration digests in a new
   manifest contract. Keep exact source, content, toolchain, package, and runtime
   digests in the release evidence.
5. Run staging and production read-only qualification against the same package
   digest. Only after those proofs are durable may a separately reviewed change
   authorize cross-environment artifact reuse.

Until every gate passes in a separately reviewed change, the deployment
workflows must keep building environment-bound artifacts per environment. The
adaptive Elastic Beanstalk poller improves readiness observation latency; it
does not change the artifact boundary.
