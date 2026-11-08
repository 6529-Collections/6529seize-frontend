# Encrypted messages on MLS 0x004E (D172): release checklist

Runbook for moving encrypted messages from MLS ciphersuite 0x004F to 0x004E,
with grant v2 and history kept (owner decision D172, option C+). The release
captain executes from this file.

- Backend: 6529-Collections/6529seize-backend#2396.
- Frontend engine: 6529-Collections/6529seize-frontend#4748.
- Frontend UI: 6529-Collections/6529seize-frontend#4749, stacked on #4748.
- Native: 6529-Collections/6529-client (the 0x004E switch) and 6529-core
  (pull-web). Merge these only once the web is live.

Live code, the PRs, current GitHub state and
[`ops/skills/deploy-6529/SKILL.md`](../../skills/deploy-6529/SKILL.md) override
this file.

## Owner decisions

The owner signed off on shipping C+ on 2026-11-08. The decisions are recorded
as D172 amendments in 6529chain: commit `9f3dbaa`, and commit `2403fe5` for the
deadline.

- **When:** a daytime release on 2026-11-09, backend before frontend.
- **Deadline, announced ahead of the release:** devices must move by the end
  of 1 December 2026 (UTC). The window ends at **2026-12-02T00:00:00Z**.
  - Set `E2EE_SUITE_TRANSITION_START=2026-11-09T00:00:00Z` and
    `E2EE_SUITE_TRANSITION_DAYS=23`.
  - Set both right after #2396 is live in production and the alarm exists.
    Don't wait for the first upgrades: the end date is fixed and public.
  - A backend test pins that these two values end the window at exactly
    2026-12-02T00:00:00Z.
- **Alarm:** a CloudWatch alarm on `6529/E2EE` `SuiteWindowConfigInvalid`. The
  owner authorized it; it is a release step and is created before the two keys
  are set.
- **Aliases:** a 0x004E grant also covers the code point the RFC finally assigns
  to the same algorithms. `E2EE_SUITE_ALIASES` stays empty until that number
  is assigned. It then gets one entry `{ from: 0x004e, to: <final> }`:
  - on the backend, in `src/e2ee/e2ee-suite-policy.ts`, plus `<final>` in
    `E2EE_CIPHERSUITES`;
  - on the frontend, in `lib/e2ee/grant.ts`.
- **Desktop and native clients must ship well before December 1.** After the
  deadline, a client still on the 0x004F build can no longer start or join
  new encrypted chats.
  - The 6529-core pull-web (the Desktop renderer) is a must-do. It must not
    slip past about 20 November.
  - So is the 6529-client 0x004E switch.
- **Still open:** when 0x004F leaves the accepted set entirely. That is one line
  plus a cleanup.

## Not reversible once a device has moved

Fix forward only, once any device has moved. A reverted client wipes the
local history of devices that already moved: the pre-D172 engine drops any
stored device whose grant names another suite, together with its groups and
messages.

- Before any device has moved, a revert is clean.
- After that, ship fixes forward.
- A backend revert after v2 devices exist also needs those devices and their
  0x004E KeyPackages cleaned up. The pre-D172 server does not filter by suite,
  so it would offer them to 0x004F clients, whose adds then fail.

## Gates before production

- [ ] #2396 and #4748 are green on their final heads. #4748 includes current
      `main`. #4749 includes #4748 and `main`.
- [ ] The C+ browser gate passes on the final #4748 head together with #4757.
      The only failures allowed are the four known product ones on `main`.
- [ ] Staging passes every step below.

The native and Desktop releases are not a gate. They follow once the web is
live, with a deadline of about 20 November (section 2.3).

## 1. Staging

### 1.1 Backend (#2396)

Units: `dbMigrationsLoop`, then `api`. No other service runs the changed
code. The change adds three columns, synced by `dbMigrationsLoop`:

- `e2ee_devices.grant_version`;
- `e2ee_devices.ciphersuites`;
- `e2ee_key_packages.ciphersuite`.

The `api` code reads them.

1. Fetch, then merge `claude/e2ee-suite-004e` into the latest `1a-staging` with
   an ordinary merge, and push.
2. Dispatch `Deploy a service` on `1a-staging`, `environment=staging`,
   `service=dbMigrationsLoop`. Wait for success.
3. Dispatch it again with `service=api`. Wait for success.
4. Leave `E2EE_SUITE_TRANSITION_START` unset on staging `seizeAPI` (eu-west-1).

Backend smoke, before any frontend change reaches staging:

- [ ] The `seizeAPI` start-up log shows
      `[E2EE SUITE WINDOW NOT STARTED] [BOTH SUITES ACCEPTED]`, and no
      `[E2EE SUITE WINDOW CONFIG INVALID]` line.
- [ ] The current staging web build (0x004F, v1 grants) still enrols, lists,
      sends and receives encrypted DMs. Requests that name no suite mean 0x004F.
- [ ] The `6529/E2EE` `DeviceRegistrations` metric appears with
      `GrantVersion=1`.

### 1.2 Frontend (#4748, then #4749)

1. Merge `claude/e2ee-suite-004e` (#4748) into the latest `1a-staging` and push.
2. Merge the #4749 branch into `1a-staging` and push.
3. `Web Deploy - STAGING` starts on the push. Wait for its build, artifact,
   version and health checks.
4. Staging E2E starts by itself, but its default `all` selection excludes the
   encrypted-messages pack. Dispatch Staging E2E on `main` with the deploy run
   ID and `pack=e2ee-staging`. E2E reports separately and does not gate the
   deployment.

Frontend smoke, with a browser that already had a 0x004F device on staging:

- [ ] Opening encrypted messages shows the upgrade notice. One signature (or
      the combined sign-in) enrols a 0x004E device.
- [ ] Earlier conversations are readable and read-only, attachments included.
- [ ] "Continue" on a DM with a person who has also moved creates or links one
      new DM, and messages deliver both ways.
- [ ] With a person who has not moved, "Continue" is refused with the
      not-yet-upgraded message. The old chat stays readable.
- [ ] A fresh browser enrols straight onto 0x004E, with a v2 grant and a
      `mls-device-grant:v2:78` resource in the sign-in.
- [ ] `DeviceRegistrations` with `GrantVersion=2` appears, and the
      `ActiveDevices` census shows `Suite=78`.

## 2. Production (daytime, 2026-11-09)

### 2.1 Backend (#2396)

1. Merge #2396 into `main`.
2. Dispatch `Deploy a service` on `main`, `environment=prod`,
   `service=dbMigrationsLoop`, `release_pull_request=2396`. Wait for success.
3. Dispatch it with `service=api`, `release_pull_request=2396` and
   `release_note_publish=true` (the last service). Wait for success.
4. Run the backend smoke from 1.1 against prod `seizeAPI` (us-east-1).
5. Create the alarm (section 3).
6. Set the window (section 4): both keys, right away. The frontend can follow
   the same day, because both suites stay accepted until December 2.

### 2.2 Frontend (#4748, then #4749)

1. Merge #4748 into `main`.
2. Retarget #4749 to `main` (GitHub does it when the #4748 branch is deleted),
   wait for its checks, and merge it.
3. Dispatch `Web Deploy - PROD` on `main`. Wait for its build, artifact,
   version and health checks. Production E2E starts by itself and reports
   separately.
4. Run the frontend smoke from 1.2 on 6529.io with a team device.

### 2.3 Native and Desktop (after the web; deadline about 20 November)

These are not gates for the web release. They follow once the web is live, and
must be released well before 1 December.

- 6529-client: merge the 0x004E switch, 6529-Collections/6529-client#47 (draft).
- 6529-core: the pull-web PR, built from a `main` commit that contains both
  #4748 and #4749 (the engine and its UI), never #4748 alone.
- The native client follows the same policy and re-vendors the WASM module from
  #4748's merge commit.

## 3. The alarm (release step, owner-authorized)

Create it in us-east-1 only, where production `seizeAPI` runs. Staging gets no
alarm. Point it at the existing `cloudwatch-alarms` SNS topic.

```bash
topic_arn="$(aws sns list-topics --region us-east-1 \
  --query "Topics[?ends_with(TopicArn, ':cloudwatch-alarms')].TopicArn" \
  --output text)"
test -n "$topic_arn"
aws cloudwatch put-metric-alarm --region us-east-1 \
  --alarm-name e2ee-suite-window-config-invalid \
  --alarm-description "E2EE_SUITE_TRANSITION_START/DAYS is malformed (D172)" \
  --namespace 6529/E2EE --metric-name SuiteWindowConfigInvalid \
  --statistic Sum --period 300 --evaluation-periods 1 \
  --threshold 0 --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching --alarm-actions "$topic_arn"
aws cloudwatch describe-alarms --region us-east-1 \
  --alarm-names e2ee-suite-window-config-invalid \
  --query "MetricAlarms[0].StateValue"
```

- The metric has no dimensions.
- The API reports a malformed `E2EE_SUITE_TRANSITION_START` or
  `E2EE_SUITE_TRANSITION_DAYS` once per process, and then behaves as if the
  window had not started. Only this alarm makes a typo visible.

## 4. Setting the window (right after the prod backend)

Set both keys on prod `seizeAPI` (us-east-1), only once the alarm exists:

- `E2EE_SUITE_TRANSITION_START=2026-11-09T00:00:00Z`
- `E2EE_SUITE_TRANSITION_DAYS=23`

The window then ends at 2026-12-02T00:00:00Z.

1. Add the two keys without disturbing the other variables. The API deploy
   keeps the Lambda's environment. The variables include secrets, so no
   command prints a value: the reads list key names only, and the update
   shows only status fields.

   ```bash
   fn=<prod seizeAPI function name>
   env_file="$(mktemp)"
   aws lambda get-function-configuration --region us-east-1 \
     --function-name "$fn" --query 'Environment.Variables' \
     --output json > "$env_file"
   jq -r 'keys[]' "$env_file"   # names only
   jq '{Variables: (. + {
     E2EE_SUITE_TRANSITION_START: "2026-11-09T00:00:00Z",
     E2EE_SUITE_TRANSITION_DAYS: "23"})}' "$env_file" > "$env_file.new"
   aws lambda update-function-configuration --region us-east-1 \
     --function-name "$fn" --environment "file://$env_file.new" \
     --query '{State: State, LastUpdateStatus: LastUpdateStatus}'
   aws lambda wait function-updated --region us-east-1 --function-name "$fn"
   aws lambda get-function-configuration --region us-east-1 \
     --function-name "$fn" --query 'keys(Environment.Variables)'
   rm -f "$env_file" "$env_file.new"
   ```

2. Confirm that new cold starts log exactly
   `[E2EE SUITE WINDOW START 2026-11-09T00:00:00.000Z] [END 2026-12-02T00:00:00.000Z] [DAYS 23]`,
   that no `[E2EE SUITE WINDOW CONFIG INVALID]` line appears, and that the alarm
   stays OK.
3. Until the end, both suites stay accepted, so today's clients keep working.
   At 2026-12-02T00:00:00Z the server starts accepting only 0x004E:
   - v1 grants and v2 sets without 0x004E no longer register, list, claim or
     upload KeyPackages.
   - `POST /device-grants` refuses such an encryption key.
   - Group creation and roster additions refuse such devices. That includes a
     roster repair re-adding a 0x004F-only device to an old group, which gets
     400; this is consistent with old-suite groups being read-only.
   - Reads (logs, Welcomes, attachments) keep working.
   - The census then logs `[E2EE SUITE WINDOW CLOSED] [V1 DEVICES NOT HONOURED n]`.

The deadline is public, so only change these keys with the owner. Removing
both reopens the window.

## Signing paths for the upgrade grant

Every device moves with one wallet signature over a v2 grant: the suite set
`{0x004E}`, as `uint16[] ciphersuites`. The table shows each path, its status
and the evidence.

- **Verified (code):** the path passes the v2 data through unchanged, and Jest
  or vector tests cover it.
- **Device QA (prxt):** a real wallet or device has to confirm rendering and
  signing. These items are on prxt's QA list for staging.

| Path                                                                    | What is signed                                                                  | Status                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Website, combined sign-in (most users)                                  | SIWE text (`personal_sign`) with a `urn:6529:mls-device-grant:v2:78:…` line     | Verified (code)                               | Plain text, so every wallet signs it as before. `grant-message.ts` builds it and checks it exactly. The backend vectors match (`combined-grant-vectors.test.ts`, `authRequestSignIn.combinedGrant.test.ts`).                                                                                                                                                                                                                                                                                                                               |
| Website, separate prompt, browser extension (MetaMask, Rabby, Coinbase) | EIP-712 `MlsDeviceGrant` v2, domain version `"2"`, `uint16[]`                   | Verified (code) + device QA                   | `useE2eeEngineDeps.signE2eeTypedData` passes domain, types and message unchanged to wagmi `signTypedDataAsync` (viem `eth_signTypedData_v4`). The v2 vector signed with viem matches the backend's ethers signature (`grant.test.ts`). Device QA: how the array renders in each extension.                                                                                                                                                                                                                                                 |
| WalletConnect / Reown QR from a desktop browser to a phone wallet       | the same typed data over the relay                                              | Verified (code) + device QA                   | It is the same wagmi call. The payload is 1,123 B (`MlsDeviceGrant` v2 JSON) or 1,480 B (combined app grant), about the size of v1 and far below relay limits. Device QA: `ciphersuites: [78]` renders and signs in MetaMask Mobile, Rainbow, Trust, Coinbase Wallet and Ledger Live (Ledger may show a hash for arrays).                                                                                                                                                                                                                  |
| 6529 Mobile, app wallet                                                 | EIP-712 app grant v2 (`DeviceGrant`, `uint16[]`), signed on the phone           | Verified (code) + device QA                   | `wagmiAppWalletConnector` uses a viem local account (`privateKeyToAccount`), and `useAppGrantSigner` passes the typed data unchanged. `app-grant-request.test.ts` asserts domain version `"2"` and `ciphersuites: [0x004e]`. The v2 vectors cover signing-only and combined grants (`app-grant.test.ts`), and so does the backend (`app-device-grant-v2.test.ts`). Device QA: iOS and Android.                                                                                                                                             |
| 6529 Mobile, external wallet via WalletConnect                          | the same app grant v2                                                           | Verified (code) + device QA                   | Same signer as above (`eth_signTypedData_v4`). Device QA as for WalletConnect.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Connect-device QR (`ConnectDeviceContent`), either direction            | app grant v2, carried in the sealed setup envelope                              | Verified (code) + device QA                   | `connection-setup.ts` signs v2. The envelope schema keeps `version` and `ciphersuites` (`connection-setup-envelope.test.ts`, v2 round trip). The receiver computes the same id (`setupGrantId`). `connection-setup.test.ts` asserts the v2 typed data and the registered v2 terms. Device QA: desktop browser to phone and phone to desktop.                                                                                                                                                                                               |
| 6529 Desktop, seed wallet and browser connector (Core #286)             | EIP-712 typed data through `parseTypedDataRequest`, then ethers `signTypedData` | Verified (code), pending pull-web + device QA | `renderer/wagmiConfig/typedDataRequest.ts` copies field types verbatim (so `uint16[]` passes), passes the message unchanged and only normalizes `chainId` (the grant domain has none). The root type check accepts `MlsDeviceGrant` and `DeviceGrant`. Suggestion for #286: add a v2 `uint16[]` case to `electron-src/typed-data-request.test.ts`. The Desktop gets v2 only through the pull-web of #4748 + #4749 (the engine, the UI and the WASM module `mls-wasm-530b38d27f820745.wasm`). Core's flags and CSP from #286 are unchanged. |
| Safe and other contract wallets (EIP-1271)                              | the same v2 typed data, or SIWE text                                            | Verified (code) + device QA                   | Both sides compute the grant id from the version-aware typed data: frontend `verifyGrant` → `hashTypedData` of v2, and the backend `buildE2eeGrantTypedData` and `computeAppDeviceGrantId` are version-aware. EIP-1271 checks that digest, so labels are unchanged (`contract-verified`, or server-verified without an RPC). Device QA: Safe{Wallet} off-chain typed-data signing with `uint16[]`.                                                                                                                                         |

Device QA list for prxt (staging, before the Desktop and app releases):

- Extensions: MetaMask, Rabby and Coinbase sign the separate-prompt v2 grant.
- WalletConnect QR: MetaMask Mobile, Rainbow, Trust, Coinbase and Ledger Live
  render and sign.
- 6529 Mobile on iOS and Android:
  - app-wallet upgrade;
  - the external-wallet upgrade;
  - Connect-device QR in both directions.
- 6529 Desktop after the pull-web:
  - seed wallet;
  - browser connector;
  - Connect-device QR.
- Safe{Wallet}: the upgrade grant is signed and the device shows as
  contract-verified.

## What users see

- **Upgrade:** each device signs once to move. On the website this happens in
  the combined sign-in where possible; otherwise it is one prompt.
- **History:** earlier conversations stay readable and read-only on the device.
  "Start again" continues each one once on 0x004E. Until the other person has
  moved too, it is refused.
- **Unsent messages:** a message still queued when its conversation became
  read-only is kept as unsent (`E2eeMessage.unsent: "suite_upgrade"`). It is
  never sent automatically. The user can resend it in the upgraded chat or
  delete it.

## Watch after each step

- EMF namespace `6529/E2EE`:
  - `DeviceRegistrations` by `GrantVersion` and `Via`;
  - the `ActiveDevices` census per `Suite` and `ActiveDevicesByGrant` per
    `GrantVersion`, at most every 10 minutes per process;
  - `SuiteWindowConfigInvalid`, which should never fire (alarmed in us-east-1).
- After the window closes, the census logs
  `[E2EE SUITE WINDOW CLOSED] [V1 DEVICES NOT HONOURED n]`.
