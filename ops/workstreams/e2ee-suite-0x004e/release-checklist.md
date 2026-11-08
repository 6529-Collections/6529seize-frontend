# Encrypted messages on MLS 0x004E (D172): release checklist

Release checklist and deploy notes for moving encrypted messages from MLS
ciphersuite 0x004F to 0x004E with grant v2 and history kept (owner decision
D172, option C+).

- Backend: 6529-Collections/6529seize-backend#2396.
- Frontend engine: 6529-Collections/6529seize-frontend#4748.
- Frontend UI: 6529-Collections/6529seize-frontend#4749, stacked on #4748.

Live code, the PRs and current GitHub state override this file.

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

## Order, per environment

1. **Backend first** (#2396):
   1. Run `dbMigrationsLoop`. It syncs three additive columns:
      - `e2ee_devices.grant_version`;
      - `e2ee_devices.ciphersuites`;
      - `e2ee_key_packages.ciphersuite`.
   2. Then deploy `api`.
   3. Leave `E2EE_SUITE_TRANSITION_START` unset at first. Unset means the
      window is open and v1 grants are honoured.
2. **Check the backend** before any frontend reaches that environment:
   - The `api` start-up log shows
     `[E2EE SUITE WINDOW NOT STARTED] [V1 GRANTS HONOURED]`.
   - Today's clients still list, claim and send. Requests that name no suite
     mean 0x004F.
3. **Frontend** (#4748 together with #4749). It must never reach an
   environment whose backend lacks #2396, which would refuse v2 grants,
   `mls_ciphersuites` and the `ciphersuite` parameters.
4. **Native clients** (6529-client#38) follow the same policy and re-vendor the
   WASM module from #4748's merge commit.
5. **Precondition before anyone sets `E2EE_SUITE_TRANSITION_START`:** a
   CloudWatch alarm on `6529/E2EE` `SuiteWindowConfigInvalid` must exist. A
   malformed value does not fail the start; it is reported and treated as
   "not started", so only this alarm makes a typo visible. Creating the alarm
   is a new AWS resource and sits on the owner list.
6. **Start the window** only with owner sign-off. Set
   `E2EE_SUITE_TRANSITION_START` to an ISO 8601 date-time with a zone, or to
   unix milliseconds:
   - Never use seconds. Anything before 2026-11-08 (the D172 decision),
     malformed, or not a real calendar date is refused: logged as an ERROR,
     counted in `SuiteWindowConfigInvalid`, and treated as "not started".
   - `E2EE_SUITE_TRANSITION_DAYS` defaults to 14.
   - The start-up log shows the effective start and end.
   - After the window the server accepts only 0x004E: v1 grants and v2 sets
     without 0x004E no longer register, list, claim or upload KeyPackages,
     and `POST /device-grants` refuses such an encryption key.
   - A roster repair re-adding a 0x004F-only device to an old group gets 400
     after the window. That is consistent with old-suite groups becoming
     read-only.

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
  - the `ActiveDevices` census per `Suite` and per `GrantVersion`.
- After the window closes, the census logs
  `[E2EE SUITE WINDOW CLOSED] [V1 DEVICES NOT HONOURED n]`.

## Open owner decisions

- The window start date.
- Whether an alias maps a provisional code point to the RFC's final one.
  `E2EE_SUITE_ALIASES` is empty.
- When 0x004F leaves the accepted set. That is one line plus a cleanup.
