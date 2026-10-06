# Wave feature usage pilot

This pilot measures **available controls people saw and deliberately used**. It
does not measure whether someone read, understood or completed a view. Existing
Page Viewed, auth and Wave feed event names, consumers, identity and consent
rules remain in place. There is no new provider or analytics destination.

## Events and coverage

`Wave Feature Seen` requires at least 50% of a bounded control's area to be
visible for one continuous second while the document is visible and focused.
The check clips against the viewport and nested scroll containers, rejects
hidden, inert and disabled controls, and hit-tests the clipped center for
overlays. This is an exposure opportunity, not proof of attention. A deliberate
fast action records Seen with `exposure_kind=direct_activation`; it does not
pretend the one-second dwell occurred. Seen deduplicates responsive copies,
repeated preview rows and child remounts within a route/viewer visit. It resets after
navigation or a consent/identity generation change. Entering, switching or leaving
a `drop` query view or a first-party `serialNo` link on Waves or Messages changes
the internal visit key; raw drop identifiers and serial numbers stay in memory
and never enter event properties.

Visit resets invalidate pending dwell through an epoch and notify active
observers even when the pathname and feature context stay the same.
Scroll listeners cover each root, its ancestors and viewport scrolling;
unrelated nested scroll events do not trigger those listeners. Scroll, resize,
intersection and mutation checks share one animation frame across roots, with
each root checked at most once in that frame. One shared page observer covers
portal occlusion and disconnects when its last root unmounts. Visibility/focus
loss and visit resets still cancel dwell immediately.
Observer attachment follows the mounted root, including a chat-only Wave whose
tab row appears later after content registration. Root replacement and unmount
disconnect the previous observer and capture listener.
Activated is emitted only after that feature's Seen has been synchronously
accepted in the same visit. A rejected direct Seen suppresses that activation;
the control still works, and a later deliberate action can retry exposure.

`Wave Feature Activated` records semantic clicks, including keyboard-generated
clicks and touch activation. Script-generated clicks, hover, focus, prefetch, background requests,
restoration and default selection do not activate a feature. Modified links
retain their existing behavior and are outside this pilot's activation count.
Dropdown choices are recorded from the actual portal menu button before it
closes. Repeated deliberate actions remain repeated actions.

| Feature              | Covered controls                                                            | Values                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar_section`    | Worth Checking Out and Active Votes disclosure headers                      | `recommendations`, `active_votes`                                                                                                                   |
| `sidebar_entry`      | Their View all links and preview rows, Profile Waves Feed, Find wave toggle | `recommendations_all`, `recommendations_wave`, `active_votes_all`, `active_votes_wave`, `profile_feed`, `search`                                    |
| `sidebar_collection` | Available All/Pinned/Joined buttons                                         | `all`, `pinned`, `joined`                                                                                                                           |
| `wave_tab`           | Standard visible Wave tabs, including the native competition Voters tab     | `chat`, `competitions`, `leaderboard`, `submissions`, `sales`, `winners`, `outcome`, `my_votes`, `polls`, `faq`, `configuration`, `about`, `voters` |
| `leaderboard_sort`   | Actual sort tabs and dropdown entry/choices                                 | `rank`, `rating_prediction`, `realtime_vote`, `trend`, `created_at`, `price`, `menu`                                                                |

The dropdown's visible trigger uses `value=menu`: a closed dropdown does not
expose its individual choices. Trusted trigger openings record `action=open`,
and a direct trigger toggle that closes it records `action=collapse`. Closing
through the portal or Escape does not choose a sort. A deliberate choice records
its bounded value with direct exposure. Width-measurement probes receive no
tracking scope.
Custom curation IDs/labels, general Wave rows, announcements, search queries,
REP, submissions, votes, Quick DMs, creation and content outcomes are excluded.
Viewing the Submissions or My Votes **tab control** does not track submitting
or voting. Native/Electron platform labels describe the runtime branch; local
browser fixtures do not establish packaged native coverage.

The headless foreground test drives the document visibility lifecycle signal
explicitly; it does not prove operating-system window focus behavior.

Properties are `schema_version=1`, `feature`, `placement`, `value`, `platform`,
`viewer`, `eligibility=available`, `route_family`, `selected`,
`selection_source`, and the event-specific `exposure_kind` or `action`.
Placements are `sidebar`, `wave_tabs`, `leaderboard_tabs`, `leaderboard_dropdown`.
Platforms are `desktop_web`, `mobile_web`, `native`, `desktop_app`; viewer is
`guest`, `profile`, or `proxy`. These are availability cohorts, not claims that
the user can vote, submit or administer a Wave. Gates still determine which
controls exist. Route families are Waves, My Stream, Messages, or `/other`.
Wave and message creation use `/other`, keeping their sidebar traffic outside
detail cohorts. Trailing slashes preserve the index, creation or detail family.

Seen uses `selection_source=automatic` for default, restored, deep-linked,
history-driven and other selections without a recorded action in the current
visit. Activated always uses `selection_source=user`. `selected` describes
the control before the action. Recommendation links expose their existing active
Wave through `aria-current`, including before a deliberate deselection. No
reading-completion event is generated.

## Privacy and compatibility

The pinned SDK adds current URL and referrer fields after app properties and
can load attribution from earlier SDK persistence. That is a verified source
gap, not evidence that production received sensitive data. The SDK config now
disables marketing/referrer capture, first-touch attribution and replay; a
blacklist removes navigation, search and attribution fields after enrichment,
including SDK-generated identify events. Known persisted attribution is
unregistered at initialization and around tracking/identity calls. The SDK's
search attribution can briefly be populated while constructing an event and
is removed after the call; it is blacklisted from the outgoing event.

A send-time event hook and final event batch transport guard strip the same fields,
check current consent and allowlist Wave pilot envelope properties. People/group
send hooks and batch transports apply the same consent gate, including pending
and recovered updates. Their `$set`/`$set_once` operations remove reserved SDK
navigation/attribution fields, including the SDK's unprefixed `initial_utm_*`
first-touch keys, while preserving explicit traits and identity
metadata. The pinned SDK bypasses its hook for recovered orphaned queue entries,
so batch senders start only after the final guard is installed. This narrow SDK integration
must be checked when upgrading Mixpanel. The pinned SDK creates batchers
synchronously; an unexpected missing batcher keeps delivery closed. The SDK's
explicit XHR/storage fallback uses direct delivery through the send-time hook.
Failure to scrub persisted private properties also keeps delivery closed rather
than silently continuing with uncleared storage. Missing or malformed performance
consent cookies fail closed even while React consent state is stale. Existing
Mixpanel identity and delivery metadata remain. Consent withdrawal synchronously
closes the send gate and resets identity. Delivery remains blocked until pending
enqueue/flush writes settle and all event, People and group queues finish their
persisted deletion. Rapid regrant cannot restart senders during that barrier;
a rejected deletion keeps delivery closed and initialization retries clearing.
Logout clears local identity even when consent is missing or inaccessible;
delivery stays closed until affirmative consent returns. If the SDK reset fails,
delivery stays closed and initialization must complete that reset before any
guest or profile delivery resumes. If profile identity
setup fails, delivery closes and local identity resets rather than attributing
the new profile's activity to the previous profile. The provider caches only
successful setup. The provider retries failed initialization for guests and
initialization/identity setup for connected profiles after one second, then five
seconds if needed. Profile or consent
changes and unmount cancel pending retries. Delivery stays closed if both retries
fail; a later consent grant or reload can retry again. A pending clear that
finishes after those retries wakes setup for the current consent/profile and
retries the dropped page view. That recovery subscription also cancels on
consent/profile changes or unmount. Already dispatched
network requests cannot be recalled. SDK and observer failures are best effort
and must not interrupt controls.

Successful delayed analytics recovery resets the current feature visit and wakes
visibility observers. Page Viewed and Seen are cached only after synchronous
SDK acceptance, so a rejected attempt can retry in the same visit. Acceptance
means the SDK initiated or queued the event; it does not confirm network or
backend delivery. Async transport failures remain best effort.

Existing explicit event properties and optional identity traits are preserved.
Dashboards relying on SDK raw URLs, referrers, search or campaign attribution
will stop receiving those fields and should use the existing normalized route
properties. Live dashboard usage is unverified. Pilot events contain no raw
path/query, handle, wallet, Wave/drop/curation identifier or content property.
Internal visit/scope keys stay in memory and never enter event properties.

## Validation and interpretation

`6529 run test:e2e:wave-feature-usage-sandbox` bundles the real components,
telemetry code and pinned SDK with production SDK gating and synthetic data.
Provider/data dependencies are fixtures; SDK transport is fixed to loopback
with a fake token and browser egress guard. It verifies direct and batch
envelopes, persisted attribution, responsive copies, nested scrolling,
collapsed sections, fast/keyboard/touch use, remounts, navigation, withdrawal
and SDK failure. The pack is selected by the PR's effective CI plan when its
tracking boundaries or controls change. Existing social/search/native
competition browser contracts remain unchanged; review or run them for any
actual product behavior changes.

Use consented, feature-exposed identities as the denominator, split by viewer,
platform, placement and exposure kind. Keep automatic selection separate from
deliberate use. Observe at least one full competition cycle and 28 days, with
seven days of follow-up, before proposing removal. Low use may reflect poor
exposure, eligibility, confusing placement, or cohort size. This PR does not
establish deployed collection, dashboard correctness or an adoption result.

No user-facing routes, labels, controls or workflows change, so the Help Bot
corpus needs no update for this invisible measurement contract.
