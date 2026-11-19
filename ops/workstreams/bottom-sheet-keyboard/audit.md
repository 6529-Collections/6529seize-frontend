# App bottom-sheet audit — 2026-11-19

This records the main baseline and the changes in this PR. Device and browser results
are recorded separately; a source-reviewed row does not imply that every action
was exercised on hardware. Native OS pickers, wallet applications and essential
destructive/discard confirmations are identified separately from application
sheet navigation.

## Shared sheet inventory

There are 74 `MobileWrapperDialog` JSX sites in 70 owner files. Shared wrappers
also serve their callers, including menu and dropdown consumers. All currently
inherit the native keyboard inset and duration, but the wrapper uses `ease-out`
while the app publishes its own native keyboard easing. Browser viewport fitting
is optional and therefore inconsistent. The last column records the baseline
opt-in, not a claim of keyboard correctness.

| Owner | Text entry / focus surface | Can open another sheet? | Browser viewport fit |
| --- | --- | --- | --- |
| [`CapacitorConnectDialog`](../../../components/auth/CapacitorConnectDialog.tsx) | No text entry in this surface | Wallet views share this sheet; external wallet / OS UI is separate | Not opted in |
| [`WaveInformationSheet`](../../../components/brain/mobile/WaveInformationSheet.tsx) | Setting editors, group search, curation fields; rename currently opens its own sheet | YES: rename and picture bypass the shared subview. Other setting, curation, notification and owner-option editors use the same surface | Opted in |
| [`MyStreamWaveCurationCreateDialog`](../../../components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog.tsx) | Name and inline group search | Group search replaces the form inside this dialog | Not opted in |
| [`MyStreamWaveTabsMeme`](../../../components/brain/my-stream/tabs/MyStreamWaveTabsMeme.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`NotificationsCauseFilter`](../../../components/brain/notifications/NotificationsCauseFilter.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CollectDeliveryControl`](../../../components/collect/CollectDeliveryControl.tsx) | Recipient / address search | Recipient picker is inline | Opted in |
| [`CollectGoalDefinitionMobilePicker`](../../../components/collect/CollectGoalDefinitionMobilePicker.tsx) | Combobox search | Leaf picker; can itself be opened by a parent form | Not opted in |
| [`CollectTradeSheet`](../../../components/collect/CollectTradeSheet.tsx) | Trade forms supplied by the buy / offer consumers | Consumer may open delivery / account controls; inspect its caller before changing handoff | Conditional |
| [`CommunityMembers`](../../../components/community/CommunityMembers.tsx) | Group criteria and search; separate sort sheet has no text field | Filter criteria use inline views and Back; sort is a separate sibling state | Opted in |
| [`CompactMenuMobileBottomSheet`](../../../components/compact-menu/CompactMenuMobileBottomSheet.tsx) | No text entry in this surface | Actions normally defer until afterLeave; caller can explicitly opt out | Not opted in |
| [`DesktopConnectDialogView`](../../../components/desktop/DesktopConnectDialogView.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CreateSnapshotFormCollections`](../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormCollections.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CreateDropFullMobileWrapper`](../../../components/drops/create/full/mobile/CreateDropFullMobileWrapper.tsx) | Rich-text composer and attachment controls | YES: composer can open emoji, GIF, identity and poll sheets | Not opted in |
| [`GroupMembersPreviewDialog`](../../../components/groups/members/GroupMembersPreviewDialog.tsx) | Member search | No second application sheet opened directly by this surface | Not opted in |
| [`PushNotificationSettings`](../../../components/header/PushNotificationSettings.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`DesktopTitleStrip`](../../../components/header/titlebar/DesktopTitleStrip.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`MobileWrapperConfirmationDialog`](../../../components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog.tsx) | Caller-provided confirmation content | Reusable confirmation; may intentionally overlay an editor | Not opted in |
| [`GlobalRepCategoryDialog`](../../../components/rep/categories/GlobalRepCategoryDialog.tsx) | Category details and rating controls | Details can open rating / contributor controls | Not opted in |
| [`UserPageFollowersModal`](../../../components/user/followers/UserPageFollowersModal.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageFollowing`](../../../components/user/following/UserPageFollowing.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`IdentityGettingStartedCard`](../../../components/user/identity/getting-started/IdentityGettingStartedCard.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageIdentityAddStatements`](../../../components/user/identity/statements/add/UserPageIdentityAddStatements.tsx) | Statement-specific text fields | Select and detail views share one sheet with Back | Not opted in |
| [`UserPageIdentityDeleteStatementModal`](../../../components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageMentionShortcuts`](../../../components/user/mention-shortcuts/UserPageMentionShortcuts.tsx) | Alias and identity search | One editor sheet; searches are inline | Not opted in |
| [`NicRatingsDialog`](../../../components/user/rep/NicRatingsDialog.tsx) | Rating amounts and editor text | Unsaved-change confirmation is a separate intentional confirmation | Opted in |
| [`RepCategoryList`](../../../components/user/rep/RepCategoryList.tsx) | Category / rating forms supplied by details | Details can open rating / contributor controls | Opted in |
| [`RepContributorsDialog`](../../../components/user/rep/RepContributorsDialog.tsx) | Sort control; no editable rating | Sort uses its own shared select presentation | Opted in |
| [`RepRatingsDialog`](../../../components/user/rep/RepRatingsDialog.tsx) | Inline rating editor | Selection and editing share one dialog with Back | Opted in |
| [`UserPageRep`](../../../components/user/rep/UserPageRep.tsx) | NIC amount and reason | Rate and contributor/category dialogs are sibling controlled surfaces | Not opted in |
| [`UserPageRepMobile`](../../../components/user/rep/UserPageRepMobile.tsx) | NIC amount and reason | Rate and grant dialogs are sibling controlled surfaces | Not opted in |
| [`GrantRepDialog`](../../../components/user/rep/new-rep/GrantRepDialog.tsx) | REP category, amount and reason | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageSubscriptionsResponsivePanel`](../../../components/user/subscriptions/UserPageSubscriptionsResponsivePanel.tsx) | Consumer-provided subscription controls | Consumer-provided; transaction and picker handoffs belong to the caller | Opted in |
| [`UserPageSubscriptionsTopUp`](../../../components/user/subscriptions/UserPageSubscriptionsTopUp.tsx) | Quantity / top-up inputs | Top-up sheet hides when transaction modal becomes active | Opted in |
| [`UserPageSubscriptionsUpcoming`](../../../components/user/subscriptions/UserPageSubscriptionsUpcoming.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Opted in |
| [`UserPageHeaderEditProfile`](../../../components/user/user-page-header/UserPageHeaderEditProfile.tsx) | Inline name, classification, image and about editors | Menu and target editors share the parent surface | Not opted in |
| [`UserPageHeaderEditProfileDesktop`](../../../components/user/user-page-header/UserPageHeaderEditProfileDesktop.tsx) | Profile editor fields | Discard confirmation remains a separate confirmation | Opted in |
| [`UserPageHeaderEditBanner`](../../../components/user/user-page-header/banner/UserPageHeaderEditBanner.tsx) | Image picker / upload | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageHeaderEditName`](../../../components/user/user-page-header/name/UserPageHeaderEditName.tsx) | Name | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageHeaderEditClassification`](../../../components/user/user-page-header/name/classification/UserPageHeaderEditClassification.tsx) | Classification choices | Choice controls; preserve shared-select behavior | Not opted in |
| [`UserPageHeaderEditPfp`](../../../components/user/user-page-header/pfp/UserPageHeaderEditPfp.tsx) | Image / Meme selection | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageProfileCurationSetupDialog`](../../../components/user/waves/UserPageProfileCurationSetupDialog.tsx) | Setup and group search | No second application sheet opened directly by this surface | Not opted in |
| [`UserPageProfileWave`](../../../components/user/waves/UserPageProfileWave.tsx) | Source-wave search; curation picker is an action list | Sibling change-source, curation, create, setup, quick-post and disconnect surfaces | Not opted in |
| [`UserPageProfileWaveQuickPostDialog`](../../../components/user/waves/UserPageProfileWaveQuickPostDialog.tsx) | Rich-text post | No second application sheet opened directly by this surface | Not opted in |
| [`CommonDropdownItemsMobileWrapper`](../../../components/utils/select/dropdown/CommonDropdownItemsMobileWrapper.tsx) | Caller-provided; action lists / filters | Reusable shell; caller owns subsequent actions and afterLeave | Not opted in |
| [`FilterGridDropdownMobileWrapper`](../../../components/utils/select/dropdown/FilterGridDropdownMobileWrapper.tsx) | Caller-provided filters | Reusable shell; caller owns subsequent actions | Not opted in |
| [`MobileVotingModal`](../../../components/voting/MobileVotingModal.tsx) | Numeric amount and optional explanation | Voting and explanation are one surface; authentication can show its existing prompt | Not opted in |
| [`CreateDropEmojiPicker`](../../../components/waves/CreateDropEmojiPicker.tsx) | Emoji search | Leaf search picker, potentially opened from a composer sheet | Not opted in |
| [`CreateDropGifPicker`](../../../components/waves/CreateDropGifPicker.tsx) | GIF search | Leaf search picker, potentially opened from a composer sheet | Not opted in |
| [`CreateDropIdentityPickerModal`](../../../components/waves/CreateDropIdentityPickerModal.tsx) | Identity search | Leaf identity picker, potentially opened from a composer sheet | Not opted in |
| [`WaveApprovalStatusBar`](../../../components/waves/approval/WaveApprovalStatusBar.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CreateDirectMessageModal`](../../../components/waves/create-dm/CreateDirectMessageModal.tsx) | Recipient search and message composer | Recipient selection and composition share the dialog | Not opted in |
| [`CreateDropPollDialog`](../../../components/waves/create-drop-content/CreateDropPollDialog.tsx) | Question and options | Leaf poll editor, potentially opened from a composer sheet | Not opted in |
| [`CreateWaveModal`](../../../components/waves/create-wave/CreateWaveModal.tsx) | Names, descriptions, criteria, competition and group forms | Multi-step editor; group / dropdown / confirmation consumers can open dialogs | Not opted in |
| [`CreateWaveProfileRequiredModal`](../../../components/waves/create-wave/CreateWaveProfileRequiredModal.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CreateWaveDropdown`](../../../components/waves/create-wave/utils/CreateWaveDropdown.tsx) | Choice list; supplied content | Leaf choice list, potentially opened from Create Wave | Not opted in |
| [`DiscoverWaveControls`](../../../components/waves/discovery/DiscoverWaveControls.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`SingleWaveDropContentMetadata`](../../../components/waves/drop/SingleWaveDropContentMetadata.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`SingleWaveDropTraits`](../../../components/waves/drop/SingleWaveDropTraits.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`CurationWaveBadge`](../../../components/waves/drops/CurationWaveBadge.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`WaveDropActionsAddReaction`](../../../components/waves/drops/WaveDropActionsAddReaction.tsx) | Emoji search | No second application sheet opened directly by this surface | Not opted in |
| [`WaveDropCurationsDialog`](../../../components/waves/drops/WaveDropCurationsDialog.tsx) | Curation list and nested create form | YES: Create curation mounts another MobileWrapperDialog while this one stays open | Not opted in |
| [`WaveDropMobileMenu`](../../../components/waves/drops/WaveDropMobileMenu.tsx) | Inline reaction search; action view has no text entry | Reaction search replaces actions; curations defer opening until menu close; report/signature are sibling dialogs | Not opted in |
| [`WaveDropReactionsDetailDialog`](../../../components/waves/drops/WaveDropReactionsDetailDialog.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`ParticipationDropVoteDetailsTrigger`](../../../components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`WaveConfigurationDeleteChatHistory`](../../../components/waves/groups/WaveConfigurationDeleteChatHistory.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`WaveHeaderNameEditModal`](../../../components/waves/header/name/WaveHeaderNameEditModal.tsx) | Wave name | YES at entry: mounted independently from WaveInformationSheet | Not opted in |
| [`WaveDeleteModal`](../../../components/waves/header/options/delete/WaveDeleteModal.tsx) | No text entry in this surface | No second application sheet opened directly by this surface | Not opted in |
| [`WaveHeaderPictureEditModal`](../../../components/waves/header/picture/WaveHeaderPictureEditModal.tsx) | Image picker / upload | YES at entry: mounted independently from WaveInformationSheet | Not opted in |
| [`WaveRepRatingModal`](../../../components/waves/header/rep/WaveRepRatingModal.tsx) | REP amount and reason | No second application sheet opened directly by this surface | Not opted in |
| [`WaveSettingRow`](../../../components/waves/specs/WaveSettingRow.tsx) | Consumer-provided setting editor | Same-surface portal inside information sheet; standalone sheet otherwise | Opted in |

## Other mobile sheet/dialog shells

These do not automatically inherit changes to `MobileWrapperDialog`.

| Shell | Inputs / nested surfaces | Baseline keyboard handling |
| --- | --- | --- |
| `ArtistPreviewAppWrapper` / `PreviewModalShell` | Artist, participant and My Submissions previews; vote and explanation inputs | Native inset and shared easing; focused-field observer. Browser preview uses its own panel. |
| `SingleWaveDropWrapper` | Submission detail and reply; may open a voting sheet | Native inset, `ease-out`; distinct detail overlay. |
| `WaveChatSubmitDropModal` | Rich-text composer; media/poll/identity dialogs | Native inset and separate height/transform `ease-out`; delayed focus scrolling. |
| `MemesArtSubmissionModal` | Submission wizard and nested picker/confirmation controls | Native inset, `ease-out`; delayed focus scrolling in the form. |
| `MemesQuickVoteDialog` | Numeric amount and explanation | Native inset and `ease-out`; native `<dialog>` lifecycle. |
| `MemeCollaborationReviewDialog` | Artist name and confirmation | Visual viewport fitting plus native inset; focused-field observer. |
| `MemeCollaborationManageDialog` | Collaborator search | Fixed viewport; no common keyboard geometry. |
| `E2eeDialog` | Device name, recovery and backup forms across consumers | Fixed/safe-area viewport and scroll body; no common keyboard geometry. |
| `ReportDropModal` | Report explanation and acknowledgement | Fixed viewport and scroll; no common keyboard geometry. |
| `GroupAssignmentDialog` | Criteria search / amounts | Fixed viewport and scroll; criteria focus helper. |
| `DropSignatureDialog` / `SignatureDialogFrame` | Verification information; no software-keyboard text field | Fixed viewport and scroll. |
| `SignedWriteDecisionHost` | Permission decision; no software-keyboard text field | Fixed viewport; preserves security prompts. |
| `WaveGuidelinesAgreementDialog` | Agreement text and checkbox; no text entry | Fixed viewport; preserves agreement and submit flow. |
| `HeaderProxyNewModal` | Information and preference checkbox | Fixed viewport; no software keyboard expected. |
| `CommonConfirmationModal` / `DropsListItemDeleteDropModal` | Destructive confirmation; no text entry | Fixed viewport; preserve the confirmation. |

## Findings and voting alignment

- Wave rename bypasses `useWaveInformationPanel`. The existing panel context,
  portal and history provide a same-surface editor with Back and one Close.
- Shared sheet easing differs from the existing native curve. Some forms also
  schedule a smooth centering scroll 350ms after focus, adding a second movement.
- Mobile web input sheets do not all opt into visual-viewport fitting.
- Other nested navigation exists, particularly curation creation and composer
  pickers. Removing actions or flattening mandatory confirmations is not a fix.
- [Voting PR #4961](https://github.com/6529-Collections/6529seize-frontend/pull/4961)
  is not merged into this baseline. Its committed implementation opts iOS voting
  into `useLayoutViewportLock` and the existing
  `--native-keyboard-layout-transition-easing`. This task will generalize those
  existing mechanisms rather than introduce a second timing curve. The shared
  wrapper now uses that curve by default and owns its native background lock.
  The voting PR's caller-specific lock and optional easing override can therefore
  use these defaults when the branches are integrated; no second curve is needed.
  This PR also incorporates its focused-field content-resize tracking, Android
  lock-release rule and iOS non-text focus hide recovery. The voting UI changes
  themselves remain in that PR.

## Resulting keyboard policy

- Every shared wrapper now fits the browser visual viewport by default, follows
  the app's existing native inset/duration/easing, and locks background stream
  measurements while a native sheet is open. Explicit caller opt-outs remain.
- The shared scroll body reveals focused fields on layout frames with nearest,
  instant scrolling. Create Wave/submission focus handling defers to that owner
  instead of adding a delayed smooth centering animation.
- Custom input shells listed above use the same background-lock and focused-field
  helper. Native geometry remains owned by the native keyboard hook; browser
  geometry uses the visual viewport and preserves pinch zoom. Artist preview,
  single-drop reply, submission composer, artwork wizard, quick vote and
  collaboration review use the same published native timing curve.
- Android retains its existing immediate viewport compensation, subtracting
  window resize/pan exactly once. Lock release still waits for restored geometry
  but tolerates a missing final did-hide event. iOS keeps its native lifecycle
  authoritative and recovers when focus returns to a non-text control.

## Navigation changes and remaining nesting

- Wave rename is now an information-panel subview, using its existing portal,
  Back history and single Close control. Back discards an unsaved draft and
  returns focus to the pencil. Save retains the v3 name-only PATCH and returns
  to About. Close, outside dismissal and header swipe still dismiss the panel.
- Rename fits its field and Save action instead of inheriting About's tall
  fixed surface. Back restores About's full information view. This follows the
  task-focused, custom-height approach in [Apple's sheet guidance](https://developer.apple.com/design/human-interface-guidelines/sheets)
  and the short-content behavior in [Material's bottom-sheet guidance](https://m2.material.io/components/sheets-bottom/flutter).
  Existing full-height setting/search flows retain their scrolling space.
- Wave options also fits its short action list. Its Delete action and existing
  confirmation/cancellation path remain available; Back restores About's size
  and the three-dot trigger's focus.
- Standalone rename entry points retain their existing dialog. Permission checks
  are unchanged: connected, non-proxy author/admin eligibility on non-DM waves.
- The other nesting findings in the baseline inventory remain source-audited:
  picture editing, curation creation from a drop's picker, composer pickers,
  category/rating detail transitions and mandatory confirmations. This PR does
  not remove any of those actions or confirmations. Their input surfaces inherit
  the common keyboard changes; the rename requirement is addressed directly.

## Runtime evidence

- Physical iPhone baseline: one About sheet becomes two dialogs after selecting
  Edit wave name. Native screenshots, page source and a native screen recording
  reproduce the stacked controls and keyboard transition. Test data and writes
  are isolated from live waves.
- Browser simulation: the representative rename scenario passes on mobile web,
  simulated iOS and simulated Android. It checks one dialog, one Close, keyboard
  visibility, compact height/action containment, Back/draft reset/focus
  restoration, Close and header swipe. The existing owner-options scenarios
  also pass on all three surfaces, including Delete/Cancel and three ways Back.
- Physical iPhone updated build: same-sheet rename and compact Wave options
  are visible in native screenshots/page source. The local rename save returns
  to About. A second native recording of the compact editor shows the sheet
  and keyboard moving together, with the input and Save remaining above it.
  This is visual runtime evidence, not a constant-frame-rate measurement.
- Android updated-build verification remains in progress. Browser results do
  not establish Android native animation smoothness.
