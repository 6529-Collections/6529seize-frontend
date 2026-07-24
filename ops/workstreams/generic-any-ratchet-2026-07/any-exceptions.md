# Generic `any` burn-down inventory

This is the authoritative human-readable inventory for the active generic
`any` ratchet workstream. The machine-enforced source of truth is
`scripts/debt-ratchet-baseline.json`; update this file whenever a cleanup slice
changes the baseline or the per-file scanner output.

Current interim floors:

- Production `any_casts` = 23.
- Test `test_generic_any` = 127.

Both nonzero floors are burn-down inventories, not accepted exceptions.

## Current exceptions

| Site | Count | Justification           |
| ---- | ----: | ----------------------- |
| None |     0 | Keep the floor at zero. |

## Production generic-argument burn-down inventory

The parser-backed scanner finds 23 generic-argument `any` keywords in 11
production files:

| Site                                                                                                                 | Count |
| -------------------------------------------------------------------------------------------------------------------- | ----: |
| `app/api/pepe/resolve/route.ts`                                                                                      |     6 |
| `components/drops/view/item/rate/give/clap/DropListItemRateGiveClap.tsx`                                             |     5 |
| `components/waves/drop/SingleWaveDropTraits.tsx`                                                                     |     4 |
| `components/allowlist-tool/allowlist-tool.types.ts`                                                                  |     1 |
| `components/drops/view/item/content/media/MediaDisplayGLB.tsx`                                                       |     1 |
| `components/nextGen/admin/NextGenAdminUploadAL.tsx`                                                                  |     1 |
| `components/nextGen/collections/collectionParts/hooks/useSlideshowAutoplay.ts`                                       |     1 |
| `components/react-query-wrapper/ReactQueryWrapper.tsx`                                                               |     1 |
| `components/rememes/alchemy-sdk-types.ts`                                                                            |     1 |
| `components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItem.tsx` |     1 |
| `components/waves/memes/traits/schema.ts`                                                                            |     1 |

## Test generic-argument burn-down inventory

The test-only counter finds 127 generic-argument `any` keywords in 43 files.
It intentionally does not absorb unrelated direct test annotations or casts
into this bounded workstream.

| Site                                                                                                                                 | Count |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----: |
| `__tests__/components/auth/Auth.test.tsx`                                                                                            |    40 |
| `__tests__/components/auth/SeizeConnectContext.test.tsx`                                                                             |    11 |
| `__tests__/components/drops/create/utils/CreateDropWrapper.test.tsx`                                                                 |    10 |
| `__tests__/components/waves/CreateDropInput.test.tsx`                                                                                |     7 |
| `__tests__/components/react-query-wrapper/utils/updateAttachmentInCachedDrops.test.ts`                                               |     6 |
| `__tests__/services/distribution-plan-api.test.ts`                                                                                   |     5 |
| `__tests__/components/waves/memes/MemesArtSubmissionFile.test.tsx`                                                                   |     4 |
| `__tests__/components/meme-calendar/meme-calendar.helpers.test.ts`                                                                   |     3 |
| `__tests__/components/waves/WaveServerFeedSeed.test.tsx`                                                                             |     3 |
| `__tests__/components/groups/page/create/config/nfts/GroupCreateNftSearchItems.test.tsx`                                             |     2 |
| `__tests__/components/waves/discovery/DiscoverWaveExplorer.test.tsx`                                                                 |     2 |
| `__tests__/contexts/wave/hooks/useWaveMessagesStore.test.ts`                                                                         |     2 |
| `__tests__/scripts/release-bus-install-dependencies.test.ts`                                                                         |     2 |
| `__tests__/app/api/open-graph.ens.test.ts`                                                                                           |     1 |
| `__tests__/components/CreateDropWrapper.test.tsx`                                                                                    |     1 |
| `__tests__/components/about/AboutPrimaryAddress.test.tsx`                                                                            |     1 |
| `__tests__/components/brain/my-stream/tabs/MyStreamWaveTabsDefault.test.tsx`                                                         |     1 |
| `__tests__/components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshot.test.tsx` |     1 |
| `__tests__/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownItem.test.tsx`          |     1 |
| `__tests__/components/drops/create/DropEditor.test.tsx`                                                                              |     1 |
| `__tests__/components/drops/create/lexical/plugins/mentions/MentionsPlugin.test.tsx`                                                 |     1 |
| `__tests__/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin.test.tsx`                                                |     1 |
| `__tests__/components/drops/create/utils/CreateDropContent.component.test.tsx`                                                       |     1 |
| `__tests__/components/leaderboard/leaderboard_helpers.test.tsx`                                                                      |     1 |
| `__tests__/components/mapping-tools/ConsolidationMappingTool.click.test.tsx`                                                         |     1 |
| `__tests__/components/mapping-tools/ConsolidationMappingTool.drop.test.tsx`                                                          |     1 |
| `__tests__/components/mapping-tools/ConsolidationMappingTool.test.tsx`                                                               |     1 |
| `__tests__/components/mapping-tools/DelegationMappingTool.test.tsx`                                                                  |     1 |
| `__tests__/components/nextGen/collections/collectionParts/mint/NextGenMintBurnWidget.test.tsx`                                       |     1 |
| `__tests__/components/nextGen/collections/nextgenToken/NextGenTokenProvenance.test.tsx`                                              |     1 |
| `__tests__/components/user/subscriptions/UserPageSubscriptionsUpcoming.test.tsx`                                                     |     1 |
| `__tests__/components/waves/create-drop-content/useWaveDraftPersistence.test.tsx`                                                    |     1 |
| `__tests__/components/waves/specs/groups/group/edit/WaveGroupEditButtons.test.tsx`                                                   |     1 |
| `__tests__/contexts/wave/hooks/useWaveDataFetching.test.ts`                                                                          |     1 |
| `__tests__/contracts/waves-multi-competition-phase-1.test.ts`                                                                        |     1 |
| `__tests__/fixtures/gradientFixtures.ts`                                                                                             |     1 |
| `__tests__/hooks/drops/useDropUpdateMutation.test.tsx`                                                                               |     1 |
| `__tests__/hooks/useHlsPlayer.hlsSupported.test.tsx`                                                                                 |     1 |
| `__tests__/hooks/useMemesQuickVoteQueue.test.ts`                                                                                     |     1 |
| `__tests__/hooks/waves/invalidateWaveApprovalStatusQueries.test.ts`                                                                  |     1 |
| `__tests__/integration/EditDropFlow.test.tsx`                                                                                        |     1 |
| `__tests__/scenarios/EditDropErrorScenarios.test.tsx`                                                                                |     1 |
| `__tests__/useWaveRealtimeUpdater.test.ts`                                                                                           |     1 |

## Scanner coverage

The ratchet uses the TypeScript compiler API rather than text matching.
Production `any_casts` counts direct annotations/assertions plus every
`AnyKeyword` parsed inside a generic type argument. `test_generic_any` applies
the generic-argument rule to TypeScript files under conventional test roots and
to nested/co-located TypeScript test files. Nested, adjacent, multiline,
tuple-contained, call-expression, type-reference, and JSX type arguments are
covered. Comments, prose, strings, identifiers, generic parameter defaults, and
non-generic test `any` do not count.

Counts and per-file locations:

```text
seize run debt:ratchet --details any_casts
seize run debt:ratchet --details test_generic_any
```
