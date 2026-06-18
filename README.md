# 6529seize Frontend

The open-source frontend for [6529.io](https://6529.io), a web3 social,
collecting, governance, and open-data application for the 6529 ecosystem.

This repository contains the Next.js application that powers the public site,
wallet-connected app surfaces, media and minting flows, Waves conversations,
network scoring views, delegation tools, and supporting utility routes.

## What Is In This App

- **Home and discovery**: the 6529.io landing experience, latest drops, coming
  up cards, and discovery sections.
- **Waves and messages**: public wave discovery, wallet-gated threads,
  direct-message routes, posting, voting, reactions, curation, link previews,
  and leaderboard views.
- **Profiles**: identity pages, profile tabs, collected media, subscriptions,
  proxy/delegation views, and profile navigation.
- **Media and minting**: The Memes, Meme Lab, Rememes, 6529 Gradient,
  NFT-related actions, minting calendar, and media rendering behavior.
- **Network, TDH, and xTDH**: leaderboards, activity feeds, health views,
  TDH/xTDH reference pages, levels, stats, and group-scoped network views.
- **Delegation and groups**: wallet delegation flows, primary address tooling,
  group creation, filters, membership criteria, and network scope handoffs.
- **NextGen, Drop Forge, and EMMA**: collection/token routes, mint/admin
  surfaces, claim operations, and distribution-plan tools.
- **Open data and tools**: downloadable datasets, API utilities, block finder,
  subscription reports, and app-wallet routes.

For route-level user documentation, start at [ops/docs/README.md](ops/docs/README.md).

## Tech Stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19 and TypeScript
- pnpm 10.33.0, always invoked through the repo-local `6529` wrapper
- Jest and Testing Library for unit/component tests
- Playwright for end-to-end tests
- OpenAPI Generator for TypeScript API models in `generated/`
- Sentry, AWS RUM, Elastic Beanstalk, S3, and CloudFront integration paths
- Wallet and web3 tooling through wagmi, viem, ethers, Reown AppKit, and
  related libraries

The root package is marked `"private": true` to prevent accidental npm
publication. The source code itself is licensed under Apache-2.0.

## Quick Start

Prerequisites:

- Git
- Node.js with Corepack available
- Bash-compatible shell for the repo wrapper scripts

From a fresh clone:

```bash
./bin/6529 bootstrap
```

Open a new shell, or activate the wrapper in the current shell:

```bash
source <(./bin/6529 bootstrap --print-export)
```

Install dependencies through the secure project path:

```bash
6529 install
```

Create a local `.env` file from [.env.sample](.env.sample), then start the app:

```bash
6529 run dev
```

The default local app port is `3001`.

## Environment

The app expects environment variables for API endpoints, wallet/network
settings, monitoring, IPFS gateways, and optional feature-specific integrations.
Use [.env.sample](.env.sample) as the source of truth for variable names and
safe placeholder values.

Important notes:

- Do not commit real secrets or local `.env` files.
- Production API examples are documented in `.env.sample`.
- Sentry Session Replay should remain disabled unless reviewed for PII risk.
- GitHub link-preview tokens and server-side client secrets are server-side
  only values.

## Project Commands

This repository intentionally routes project commands through `6529`.
Do not use plain `pnpm install`, `pnpm dev`, or `npm run ...`; the scripts are
guarded so dependency installs and package scripts use the expected secure path.

Common commands:

```bash
6529 install
6529 install:frozen
6529 add <package>
6529 add -D <package>
6529 update
6529 run dev
6529 run build
6529 run test
6529 run test:e2e
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

If pnpm reports ignored install/build scripts, run:

```bash
6529 approve-builds
```

For deeper package-manager, Socket Firewall, and deployment-wrapper details,
read [ops/docs/developer/pnpm-and-socket-firewall.md](ops/docs/developer/pnpm-and-socket-firewall.md).

## Repository Map

- `app/`: Next.js App Router routes. New routes should be created here.
- `AGENTS.md`: repository instructions for agents and automated coding tools.
- `components/`: shared and feature-specific UI components.
- `ops/`: operational material, including docs, skills, scripts, roadmaps, and workstream state.
- `ops/docs/`: user-facing documentation for routes, flows, feature behavior, and
  troubleshooting.
- `generated/`: TypeScript models generated from `openapi.yaml`.
- `helpers/`, `hooks/`, `services/`, `contexts/`, `store/`, `utils/`: shared
  application support code.
- `scripts/`: repository automation, environment switching, code generation,
  quality checks, and deployment helpers.
- `standalone/`: standalone export/runtime support, including The Memes mint
  page tooling.
- `tests/`, `__tests__/`, `e2e/`: automated test suites and test support.

All application routes now live under `app/`. Pages inside `app/` should define
`generateMetadata` with `getAppMetadata` so metadata is consistent across the
site.

## Generated API Models

The OpenAPI source is [openapi.yaml](openapi.yaml). Generated TypeScript models
live under `generated/` and are produced by:

```bash
6529 run generate
```

Avoid editing generated files directly unless you are intentionally
regenerating them from the OpenAPI source.

## Testing And Quality

Prefer focused checks for the files or behavior you changed:

```bash
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
6529 run test -- <pattern>
```

Use the full build when changes touch build-time behavior, generated API
models, Next.js configuration, routing, deployment packaging, or other
deployment-sensitive code:

```bash
6529 run build
```

## Documentation

- User-facing route and feature docs: [ops/docs/README.md](ops/docs/README.md)
- Agent and automation instructions: [AGENTS.md](AGENTS.md)
- Package-manager and deployment-wrapper guidance:
  [ops/docs/developer/pnpm-and-socket-firewall.md](ops/docs/developer/pnpm-and-socket-firewall.md)
- Standalone Memes mint page notes:
  [standalone/standalone-memes-mint/README.md](standalone/standalone-memes-mint/README.md)

When behavior changes are visible to users, update the relevant docs under
`ops/docs/` in the same pull request.

## Deployment Notes

Production deployment is managed by repository workflows and Elastic Beanstalk
packaging. The production bundle is built as Next standalone output, static
assets are uploaded to S3/CloudFront, and Elastic Beanstalk starts `server.js`
through [Procfile](Procfile).

Repository and deployment helper details, including `ghruns`, `ghdeploy`,
`6529 staging`, and PM2 launch examples, are documented in
[ops/docs/developer/pnpm-and-socket-firewall.md](ops/docs/developer/pnpm-and-socket-firewall.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Agents
and automated coding tools should also follow [AGENTS.md](AGENTS.md). This
project requires Developer Certificate of Origin signoffs on contributor
commits.

## Security

Read [SECURITY.md](SECURITY.md) for vulnerability reporting, supported branch
policy, and safe handling of secrets or security-sensitive configuration.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
