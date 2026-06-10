# Security Policy

Security reports are welcome and should be handled privately and carefully.

## Reporting a Vulnerability

Do not open a public issue, discussion, or pull request for a suspected
vulnerability, leaked secret, authentication bypass, payment/minting weakness,
or other security-sensitive finding.

Use GitHub's private vulnerability reporting flow for this repository if it is
available:

1. Open the repository on GitHub.
2. Go to **Security**.
3. Select **Report a vulnerability**.

If private vulnerability reporting is not available, contact the maintainers
through a private channel before disclosing details publicly. Include enough
information for maintainers to reproduce and assess the issue, such as affected
routes, required account or wallet state, observed impact, and safe reproduction
steps.

## Supported Versions

The `main` branch is the maintained branch for security fixes unless
maintainers publish a more specific support policy.

## Sensitive Data

- Do not commit `.env` files, API keys, wallet secrets, private tokens, or
  production credentials.
- Use [.env.sample](.env.sample) for variable names and safe placeholder values.
- Treat server-side client secrets, GitHub link-preview tokens, Sentry DSNs,
  AWS RUM configuration, and wallet/authentication material as sensitive.
- Keep Sentry Session Replay disabled unless it has been explicitly reviewed
  for PII risk.

## Dependency and Supply-Chain Guardrails

Project dependency installs are expected to go through the repo-local `6529`
wrapper, which uses the repository's secure pnpm path and Socket Firewall
integration. Do not bypass the wrapper with plain `pnpm install`, `pnpm dev`, or
`npm run ...`.

Use:

```bash
6529 install
6529 add <package>
6529 add -D <package>
6529 update
```

For more details, read
[ops/docs/developer/pnpm-and-socket-firewall.md](ops/docs/developer/pnpm-and-socket-firewall.md).

## Safe Disclosure

Please give maintainers a reasonable opportunity to investigate, patch, and
deploy before publishing vulnerability details. Maintainers may ask for
clarifications, reproduction notes, or validation on a fix when appropriate.
