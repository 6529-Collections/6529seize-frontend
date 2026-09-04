# Frontend artifact portability: implementation boundary

The frontend builds staging and production separately because environment
values are embedded in Next.js output and the standalone server bundle. The
production workflow records `production-deployment-v1` artifact identity and
an `artifact-portability.v1` report covering source, content, toolchain,
package checksum, and the runtime-configuration values baked into the package.

The portability scan inspects the exact extracted production bundle and records
classifications, value digests, and bounded file evidence without exposing raw
runtime values. Unknown inputs remain blockers. The report is descriptive:
`NOT_PORTABLE` does not authorize staging-to-production reuse or promotion.
Existing reports for older `environment-bound-v3` or dual-profile artifacts
remain historical evidence; they are not inputs to the ordinary deployment
workflow. The artifact report workflow can compare supported reports without
mutating an environment.

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
   digest. Only after those proofs are durable may a separately reviewed
   deployment workflow accept a portable artifact input.

Until every gate passes in a separately reviewed change, deployment workflows
keep building environment-bound artifacts per environment. The adaptive Elastic
Beanstalk poller in this release improves readiness observation latency; it does not
change the artifact boundary.
