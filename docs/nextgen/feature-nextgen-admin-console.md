# NextGen Admin Console Access and Actions

Parent: [NextGen Index](README.md)

## Overview

Use `/nextgen/manager` to run NextGen admin actions.
The page has three wallet-gated workspaces: `Global`, `Collection`, and
`Artist`.

## Location in the Site

- Admin route: `/nextgen/manager`
- Focus query variants:
  `/nextgen/manager?focus={global|collection|artist}`

## Entry Points

- Open `/nextgen/manager` directly.
- Open a shared URL with `?focus=global`, `?focus=collection`, or `?focus=artist`.
- Switch workspace from the left menu (`Global`, `Collection`, `Artist`).
- This route is not linked from the `/nextgen` header tabs.

## User Journey

1. Open `/nextgen/manager`.
2. Connect wallet if the page shows the wallet-connect state.
3. Choose a workspace (`Global`, `Collection`, `Artist`).
4. Select an action shown for the connected wallet role.
5. Fill form fields and submit.
6. Confirm wallet prompt (transaction or signature, by action).
7. Review inline errors and status output.

## Common Scenarios

- `Global` workspace:
  `Create Collection`, `Airdrop Tokens`, `Update Images and Attributes`,
  `Set Final Supply`, `Initialize Burn`, `Initialize External Burn/Swap`,
  `Mint & Auction`, `Set Splits`,
  `Propose {Primary|Secondary} Addresses and Percentages`,
  `Accept Addresses and Percentages`, `Pay Artist`, `Add Randomizer`.
- `Global` workspace registration actions (global admin only):
  `Global Admins`, `Function Admins`, and `Collection Admins`.
- `Collection` workspace:
  `Set Data`, `Set Costs`, `Upload Allowlist`, `Set Phases`,
  `Update Info`, `Update Base URI`, `Update Script By Index`,
  `Change Metadata View`.
- `Artist` workspace:
  `Sign Collection`,
  `Propose {Primary|Secondary} Addresses and Percentages`.
- Function-admin wallets can see only matching actions instead of full workspace access.

## Edge Cases

- Switching focus clears any open action form.
- Missing `focus` query defaults to `Global`.
- Unknown `focus` query values keep the page shell visible but render no
  workspace content.
- Permission reads are async, so content can appear blank briefly before
  actions or restriction text renders.
- The same wallet can pass checks in one workspace and fail in another.
- `Artist` focus shows a dedicated restriction message for non-artist wallets.
- `Global` and `Collection` focus use a shared admin restriction message.

## Failure and Recovery

- Connect or reconnect wallet if the page stays in wallet-connect state.
- If actions are missing, switch to a wallet with the required role or function admin rights.
- If the right panel is blank, set `focus` to `global`, `collection`, or `artist`,
  or clear the query and reload.
- Fix inline field errors, then resubmit.
- For transaction actions, resolve wallet/network errors and retry.
- For `Upload Allowlist`, retry wallet signature and CSV upload.

## Limitations / Notes

- Unsupported `focus` values have no fallback workspace.
- Action visibility depends on wallet permissions and can lag briefly after
  wallet changes.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
- [Docs Home](../README.md)
