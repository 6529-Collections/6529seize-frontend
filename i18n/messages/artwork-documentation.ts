import { ARTWORK_DOCUMENTATION_GUIDANCE_MESSAGES } from "./artwork-documentation-guidance";
import { ARTWORK_DOCUMENTATION_EDITORIAL_MESSAGES } from "./artwork-documentation-editorial";
import { ARTWORK_DOCUMENTATION_CHAPTER_MESSAGES } from "./artwork-documentation-chapters";
import { ARTWORK_DOCUMENTATION_MUSEUM_MESSAGES } from "./artwork-documentation-museum";

export const ARTWORK_DOCUMENTATION_MESSAGES = {
  "artworkDocumentation.recoveryUnavailable":
    "This browser cannot keep a recovery copy of unfinished answers. Keep this page open until your changes have saved.",
  "artworkDocumentation.uploadSelected":
    "{filename} is selected on your device. Choose Upload file to transfer it.",
  "artworkDocumentation.uploadChecking":
    "Checking the saved upload. We will continue from the last completed step.",
  "artworkDocumentation.uploadAttaching":
    "The file has passed its checks. Adding it to your record…",
  "artworkDocumentation.uploadCompleted":
    "{filename} has been checked and added to your record. You can now select it in the relevant file field below.",
  "artworkDocumentation.uploadAttachmentFailed":
    "Your file has been received and checked, but could not yet be added to this record. Try adding it again; you do not need to upload it again.",
  "artworkDocumentation.uploadRetryAttachment": "Add checked file to record",
  "artworkDocumentation.assetChoicesEmpty":
    "A file becomes available here after its checks finish and it is added to the record.",
  "artworkDocumentation.assetChoicesUpload": "Go to file upload",
  "artworkDocumentation.validation.entry": "Entry {number}",
  "artworkDocumentation.validation.required":
    "Complete this part of the answer, or remove the unfinished entry.",
  "artworkDocumentation.validation.invalid_value":
    "Check this part of the answer against its choices and guidance.",
  "artworkDocumentation.validation.invalid_language":
    "Choose a language from the list. For a custom language tag, use a code such as en or en-GB.",
  "artworkDocumentation.validation.invalid_date":
    "Enter a valid date matching the selected precision: YYYY, YYYY-MM, or YYYY-MM-DD.",
  "artworkDocumentation.validation.invalid_uuid":
    "Choose an available record or checked file from the list.",
  "artworkDocumentation.validation.invalid_address":
    "Enter a complete Ethereum address: 0x followed by 40 hexadecimal characters.",
  "artworkDocumentation.validation.invalid_integer_string":
    "Enter a whole number without spaces, decimal places or a sign.",
  "artworkDocumentation.validation.invalid_uri":
    "Enter a complete https://, ipfs:// or ar:// address without a username or password.",
  "artworkDocumentation.validation.too_long":
    "Shorten this answer to the stated limit.",
  "artworkDocumentation.validation.out_of_range":
    "Use a number or number of entries within the stated limits.",
  "artworkDocumentation.validation.duplicate_item":
    "Remove the repeated entry or give each entry a distinct value.",
  "artworkDocumentation.validation.required_details":
    "Add the supporting details required for this choice.",
  "artworkDocumentation.validation.invalid_translations":
    "Choose a primary language and give each translation a different language.",
  "artworkDocumentation.validation.invalid_time_range":
    "Check that the end comes after the start and both use the selected format.",
  "artworkDocumentation.validation.incomplete_coordinates":
    "Provide both latitude and longitude, or remove both.",
  "artworkDocumentation.validation.invalid_authority":
    "Check the catalogue reference against the selected authority.",
  "artworkDocumentation.validation.invalid_entry_document":
    "Use a relative HTML file path without a leading slash or parent-directory segments.",
  "artworkDocumentation.validation.presentation_bounds":
    "Check that the preferred display dimensions fit within the minimum and maximum sizes.",
  "artworkDocumentation.validation.fixed_terms":
    "This answer must match the project’s fixed artwork terms.",
  "artworkDocumentation.validation.replacement_reason_required":
    "Explain the file replacement in 20 to 1,000 characters before saving it.",
  "artworkDocumentation.validation.interview_permission_required":
    "Record the interview date, participants and permission before linking the recording or transcript.",
  "artworkDocumentation.validation.serverRejected":
    "The server could not accept this answer. Check its details, then try saving it again.",
  "artworkDocumentation.uploadLeave":
    "A file is still being added. Stay on this page until it is complete, or cancel the upload before leaving.",
  "artworkDocumentation.legacyLicenseHelp":
    "The artwork license for Keys and Gates is CC0 1.0. Add its name and link below, then review your rights declaration.",
  "artworkDocumentation.legacyLicenseApply":
    "Add the project’s CC0 license details",
  ...ARTWORK_DOCUMENTATION_GUIDANCE_MESSAGES,
  ...ARTWORK_DOCUMENTATION_EDITORIAL_MESSAGES,
  ...ARTWORK_DOCUMENTATION_CHAPTER_MESSAGES,
  ...ARTWORK_DOCUMENTATION_MUSEUM_MESSAGES,
  "artworkDocumentation.interviewEvidenceHelp":
    "Before selecting a recording or transcript, add the interview date, at least one participant and permission for that material. Choose permission for a future public record only when the participants have agreed to that use; otherwise keep the material restricted for private review.",
  "artworkDocumentation.all": "All",
  "artworkDocumentation.filter.confirmation_status": "Artist confirmation",
  "artworkDocumentation.filter.review_lane": "Review lane",
  "artworkDocumentation.filter.outstanding_action": "Outstanding action",
  "artworkDocumentation.profileVersion": "Documentation profile version",
  "artworkDocumentation.action.artist_confirmation":
    "Needs artist confirmation",
  "artworkDocumentation.action.review": "Needs review",
  "artworkDocumentation.action.changes_requested": "Changes requested",
  "artworkDocumentation.yes": "Yes",
  "artworkDocumentation.no": "No",
  "artworkDocumentation.newContext": "Document this work for another context",
  "artworkDocumentation.newContextHelp":
    "The same work can have a separate documentation record for another program. Your existing words, files, private evidence, comments and access grants are not copied automatically.",
  "artworkDocumentation.newContextAcknowledge":
    "Start a separate, empty documentation record for this work.",
  "artworkDocumentation.participant": "Participant",
  "artworkDocumentation.editorPermissions":
    "Choose which sections this editor may update",
  "artworkDocumentation.evidencePermissions":
    "Restricted evidence needs a separate, explicit grant. Editors cannot confirm a version for you.",
  "artworkDocumentation.evidence.archival":
    "Original artwork and working files",
  "artworkDocumentation.evidence.rights": "Private rights and consent evidence",
  "artworkDocumentation.evidence.sources": "Full submission source receipts",
  "artworkDocumentation.evidence.contact": "Private contact information",
  "artworkDocumentation.module.identity": "Artist information",
  "artworkDocumentation.module.artwork": "Artwork",
  "artworkDocumentation.module.files": "Files",
  "artworkDocumentation.module.context": "Story and history",
  "artworkDocumentation.module.process": "Process and contributors",
  "artworkDocumentation.module.rights": "Rights and people",
  "artworkDocumentation.module.preservation": "Preservation and display",
  "artworkDocumentation.module.interview": "Artist interview",
  "artworkDocumentation.title": "Artwork documentation",
  "artworkDocumentation.myWorks": "My artwork documentation",
  "artworkDocumentation.intro":
    "Your work has a history. Keep it with the work.",
  "artworkDocumentation.description":
    "Tell us how you made it, what it means to you and what future viewers should know. Your words, source files and display preferences help people understand the work on your terms.",
  "artworkDocumentation.stages":
    "Start with what you have. Your progress is saved with 6529, and you can return to add more. We will ask you to review and confirm a specific version when you are ready.",
  "artworkDocumentation.privacy":
    "Your documentation is stored privately with 6529 for now. You choose which material is intended for a future public record. Nothing is published on-chain or to IPFS/Arweave by completing this form.",
  "artworkDocumentation.start": "Start documenting",
  "artworkDocumentation.entry.assignedRecords":
    "Open an assigned record to continue. The project team prepares new program records for invited artists.",
  "artworkDocumentation.entry.assignedEmpty":
    "No artwork records are assigned to this profile yet. If you have been invited, check that you are signed in with the invited profile or contact the project team.",
  "artworkDocumentation.entry.sourceMore":
    "This submission may already have a record on a later page. Use Load more below to find it.",
  "artworkDocumentation.entry.sourceRecord":
    "This submission already has a documentation record. Open it to continue where you left off.",
  "artworkDocumentation.entry.listUnavailable":
    "This record list is not available to your profile. Return to My artwork documentation to open records you can access.",
  "artworkDocumentation.entry.readError":
    "We could not load all the information for this list. Try again, or open a record that is already shown.",
  "artworkDocumentation.entry.createError":
    "We could not open a new documentation record. Try again to continue the same request.",
  "artworkDocumentation.entry.creationDisabled":
    "New standalone records are not available right now. Open an assigned record or contact the project team.",
  "artworkDocumentation.entry.programInvitation":
    "The project team prepares program records for invited artists. Open your assigned record, or contact the team if it is missing.",
  "artworkDocumentation.entry.directArtist":
    "Sign in directly with the artist profile to start a record. A delegated profile cannot create one.",
  "artworkDocumentation.continue": "Continue documentation",
  "artworkDocumentation.empty":
    "The next chapter starts here. Add the story, files and choices behind a work, then return whenever you have more to share.",
  "artworkDocumentation.signIn":
    "Sign in to your profile to open your artwork records.",
  "artworkDocumentation.connect": "Sign in",
  "artworkDocumentation.unavailable":
    "Artwork documentation is not available for this profile yet.",
  "artworkDocumentation.loading": "Loading your documentation…",
  "artworkDocumentation.error":
    "We could not complete that request. Your unsaved changes remain in this window. Please try again.",
  "artworkDocumentation.retry": "Try again",
  "artworkDocumentation.back": "My artwork documentation",
  "artworkDocumentation.backToResults": "Back to results",
  "artworkDocumentation.backToList": "Back to list",
  "artworkDocumentation.viewOnly":
    "You have view-only access to this artwork record.",
  "artworkDocumentation.untitled": "Title not yet provided",
  "artworkDocumentation.profile": "Documentation profile",
  "artworkDocumentation.program": "Program",
  "artworkDocumentation.allPrograms": "All programs",
  "artworkDocumentation.more": "Load more",
  "artworkDocumentation.savedAt": "Saved {date}",
  "artworkDocumentation.progress":
    "{addressed} of {required} required questions addressed",
  "artworkDocumentation.section": "Documentation section",
  "artworkDocumentation.section.artwork": "Artwork",
  "artworkDocumentation.section.story": "Story and process",
  "artworkDocumentation.section.artist": "Artist and contributors",
  "artworkDocumentation.section.rights": "Rights and people",
  "artworkDocumentation.section.preservation": "Preservation and display",
  "artworkDocumentation.section.review": "Review and approve",
  "artworkDocumentation.intro.artwork":
    "Help us identify the exact work and the file you consider final.",
  "artworkDocumentation.intro.story":
    "Record the choices behind the image in your own words.",
  "artworkDocumentation.intro.artist":
    "Tell us how you and your collaborators should be credited.",
  "artworkDocumentation.intro.rights":
    "Help us understand the rights and people connected to the work.",
  "artworkDocumentation.intro.preservation":
    "Tell future custodians what needs to survive.",
  "artworkDocumentation.intro.review":
    "Check that this version says what you intend.",
  "artworkDocumentation.why": "Why this matters",
  "artworkDocumentation.why.artwork":
    "Dates, titles and versions can become harder to recover over time. Keeping them together helps future viewers distinguish this work from another edit, print or related image.",
  "artworkDocumentation.why.story":
    "An image cannot explain every decision that made it. Your account gives curators and viewers a source they can attribute to you, including staging, construction and editing that are part of the work.",
  "artworkDocumentation.why.artist":
    "Consistent names and credits make it easier to connect a work to the people who made it. You may use your public artist name; a legal name is not required here.",
  "artworkDocumentation.why.rights":
    "A release can involve more than the photographer's copyright. Clear information about collaborators, source material and depicted people helps the team review how the work can be shared. Private evidence stays restricted.",
  "artworkDocumentation.why.preservation":
    "The frame, tonal balance, scale or detail may be essential to how your work is experienced. Your guidance gives future people a better starting point when displays and file formats change.",
  "artworkDocumentation.why.review":
    "Confirming keeps a dated version of your documentation. You can add or correct information later, while earlier confirmed versions remain distinguishable.",
  "artworkDocumentation.required": "Required for review",
  "artworkDocumentation.recommended": "Recommended",
  "artworkDocumentation.publicIntent": "Intended for a future public record",
  "artworkDocumentation.restricted": "Restricted",
  "artworkDocumentation.restrictedHelp":
    "Available to you and participants explicitly granted access to this evidence.",
  "artworkDocumentation.redacted":
    "Restricted evidence — your role does not include access.",
  "artworkDocumentation.visibility": "Intended visibility",
  "artworkDocumentation.answerStatus": "How would you like to answer?",
  "artworkDocumentation.status.provided": "Provide an answer",
  "artworkDocumentation.status.unknown": "I don't know",
  "artworkDocumentation.status.withheld": "Withheld",
  "artworkDocumentation.status.unavailable": "Unavailable",
  "artworkDocumentation.status.not_applicable": "Not applicable",
  "artworkDocumentation.unanswered": "Not answered yet",
  "artworkDocumentation.clear": "Leave unanswered",
  "artworkDocumentation.explanation": "Explanation",
  "artworkDocumentation.choose": "Choose an option",
  "artworkDocumentation.add": "Add entry",
  "artworkDocumentation.remove": "Remove entry {number}",
  "artworkDocumentation.entry": "Entry {number}",
  "artworkDocumentation.save": "Save changes",
  "artworkDocumentation.saveExit": "Save and exit",
  "artworkDocumentation.next": "Next section",
  "artworkDocumentation.save.clean": "All changes saved",
  "artworkDocumentation.save.dirty": "Unsaved changes",
  "artworkDocumentation.save.saving": "Saving…",
  "artworkDocumentation.save.retrying": "Retrying save…",
  "artworkDocumentation.save.invalid":
    "Some answers still need attention. Other changes continue to save.",
  "artworkDocumentation.save.conflict":
    "This draft changed in another window. Your changes are still here.",
  "artworkDocumentation.save.auth_expired":
    "Sign in again to continue saving. Your changes remain in this window.",
  "artworkDocumentation.save.offline":
    "We could not save. Check your connection and retry before leaving.",
  "artworkDocumentation.conflict.latest": "Use latest saved version",
  "artworkDocumentation.conflict.mine": "Apply my changes to the latest draft",
  "artworkDocumentation.conflict.base": "Before your changes",
  "artworkDocumentation.conflict.server": "Latest saved answer",
  "artworkDocumentation.conflict.local": "Your unsaved answer",
  "artworkDocumentation.leave":
    "You have unsaved documentation. Leave this page and lose those changes?",
  "artworkDocumentation.copy": "Copy unsaved text",
  "artworkDocumentation.copied": "Copied",
  "artworkDocumentation.confirm": "Confirm this version",
  "artworkDocumentation.confirmed": "Documentation confirmed",
  "artworkDocumentation.confirmation.recorded":
    "Your confirmation is recorded for this saved version. You can return to this record at any time.",
  "artworkDocumentation.confirmation.viewRecorded": "View confirmed version",
  "artworkDocumentation.confirmation.sending": "Recording your confirmation…",
  "artworkDocumentation.confirmation.checking":
    "Checking your saved confirmation…",
  "artworkDocumentation.confirmation.unverified":
    "We could not verify your confirmation. It may have been recorded. Check its status before confirming again.",
  "artworkDocumentation.confirmation.check": "Check confirmation status",
  "artworkDocumentation.confirmation.notRecorded":
    "This saved version has no recorded confirmation. Review the statement and check the box before confirming.",
  "artworkDocumentation.confirmation.reviewChanged":
    "This record has changed. Review the latest saved version before checking the confirmation again.",
  "artworkDocumentation.save.pendingFields":
    "These answers have not been saved yet. Review the guidance beneath each one before leaving.",
  "artworkDocumentation.save.licenseGuidance":
    "Check the license name and use a complete license URL, including https://.",
  "artworkDocumentation.save.rightsGuidance":
    "Check the selected rights category and include the supporting details it requires.",
  "artworkDocumentation.save.answerGuidance":
    "Check this answer’s required details, format and length before saving again.",
  "artworkDocumentation.validation.INVALID_VALUE":
    "An answer has a format the record cannot accept. Review the pending answers and their field guidance, then save again.",
  "artworkDocumentation.validation.DETAIL_REQUIRED":
    "A selected category needs supporting details. Review the pending answers, then save again.",
  "artworkDocumentation.validation.REQUIRED_ANSWERS_MISSING":
    "Some required answers are not saved yet. Follow the required-question links and finish saving before confirming.",
  "artworkDocumentation.validation.CONFIRMATION_COPY_REQUIRED":
    "The confirmation statement could not be accepted. Check the saved confirmation status, then review the statement before trying again.",
  "artworkDocumentation.save.actionUnverified":
    "The last action could not be verified. Your saved answers remain available.",
  "artworkDocumentation.confirmCopy":
    "I have reviewed this version. It reflects my account of the work to the best of my knowledge, including any uncertainty I have recorded. I have checked the credits, selected files and information marked for a future public record.",
  "artworkDocumentation.confirmHelp":
    "This saves a dated confirmation with 6529. It does not mint, publish, transfer copyright or confirm Museum accession. You can make a later revision if you need to add or correct information.",
  "artworkDocumentation.acknowledge":
    "I have reviewed this version and the confirmation above.",
  "artworkDocumentation.confirmMissing":
    "Address the required questions and finish saving before confirming.",
  "artworkDocumentation.confirmArtist":
    "Only the controlling artist can confirm this documentation.",
  "artworkDocumentation.reviewPending": "Review pending",
  "artworkDocumentation.newerDraft":
    "Changes since confirmation. The earlier confirmed version and its review remain in history.",
  "artworkDocumentation.history": "Confirmed versions",
  "artworkDocumentation.noHistory":
    "When you confirm your documentation, its dated version will appear here.",
  "artworkDocumentation.revision": "Version {number}",
  "artworkDocumentation.snapshot": "Confirmed version · read only",
  "artworkDocumentation.currentDraft": "Return to current draft",
  "artworkDocumentation.preview": "Preview future public record",
  "artworkDocumentation.previewNotice":
    "Preview only — nothing is published. Restricted information is excluded.",
  "artworkDocumentation.reviewAll": "Show full private review",
  "artworkDocumentation.feedback": "Feedback",
  "artworkDocumentation.noFeedback": "No feedback yet.",
  "artworkDocumentation.comment": "Your comment",
  "artworkDocumentation.sendComment": "Add comment",
  "artworkDocumentation.audience": "Who can read this conversation?",
  "artworkDocumentation.artistReviewers": "Artist and authorized reviewers",
  "artworkDocumentation.reviewersOnly": "Authorized reviewers only",
  "artworkDocumentation.resolve": "Resolve conversation",
  "artworkDocumentation.reopen": "Reopen conversation",
  "artworkDocumentation.resolved": "Resolved",
  "artworkDocumentation.reviewQueue": "Documentation review queue",
  "artworkDocumentation.reviewReason": "Review note",
  "artworkDocumentation.accept": "Accept this version",
  "artworkDocumentation.requestChanges": "Request changes",
  "artworkDocumentation.lane.curatorial": "Curatorial review",
  "artworkDocumentation.lane.technical": "Technical review",
  "artworkDocumentation.lane.rights": "Rights review",
  "artworkDocumentation.review.pending": "Pending",
  "artworkDocumentation.review.accepted": "Accepted",
  "artworkDocumentation.review.changes_requested": "Changes requested",
  "artworkDocumentation.reviewScope":
    "Review decisions apply to the latest confirmed version. They do not change the artist's words.",
  "artworkDocumentation.assign": "Assign access",
  "artworkDocumentation.profileId": "Participant profile ID",
  "artworkDocumentation.role": "Role",
  "artworkDocumentation.revoke": "Revoke access",
  "artworkDocumentation.archive": "Archive draft",
  "artworkDocumentation.restore": "Restore draft",
  "artworkDocumentation.archived": "Archived",
  "artworkDocumentation.inlineTitle": "Add the story behind your work",
  "artworkDocumentation.inlineHelp":
    "A few words now can help preserve the choices and context behind the image. Add what you like here, or return after submitting.",
  "artworkDocumentation.inlineOptional":
    "These optional documentation fields do not change whether your submission can be sent.",
  "artworkDocumentation.inlineStart": "Add documentation",
  "artworkDocumentation.inlineLater": "Continue later",
  "artworkDocumentation.inlineOpen": "Open full workspace",
  "artworkDocumentation.sourceTitle": "Check your existing information",
  "artworkDocumentation.sourceHelp":
    "Information from your submission is a starting point. Choose what to bring into this draft and check it in your own words. Your original submission stays unchanged.",
  "artworkDocumentation.sourceApply": "Use selected information",
  "artworkDocumentation.sourceOriginal": "Original submission",
  "artworkDocumentation.sourceUnavailable":
    "The source is unavailable. Your saved documentation remains available.",
  "artworkDocumentation.sourceReplace":
    "Selected fields will replace the draft answers shown below.",
  "artworkDocumentation.sourceProposal":
    "Submission proposal — review before confirming",
  "artworkDocumentation.keysTitle":
    "Help establish the record for Keys and Gates.",
  "artworkDocumentation.keysHelp":
    "Keys and Gates is the Network Museum's first commissioned project and is planned as the first Stream release. Alongside the photograph, we want to preserve your account of making it: what you saw, the choices you made and what matters when the work is shown.",
  "artworkDocumentation.keysMint":
    "This step prepares the artwork's documentation. Mint arrangements will be handled separately.",
  "artworkDocumentation.upload": "Add an original file",
  "artworkDocumentation.uploadHelp":
    "Add the file exactly as you want it preserved. The original is kept byte for byte. A preview, when available, is separate from the original.",
  "artworkDocumentation.uploadPrivacy":
    "Original files can contain location or other embedded information. They are restricted here; any preview is separate from the original.",
  "artworkDocumentation.uploadRole": "What is this file for?",
  "artworkDocumentation.uploadSelect": "Select file",
  "artworkDocumentation.uploadStart": "Upload file",
  "artworkDocumentation.uploadCancel": "Cancel upload",
  "artworkDocumentation.uploadProgress": "Uploaded {sent} of {total}",
  "artworkDocumentation.uploadProcessing":
    "Transfer complete. The server is checking the original bytes.",
  "artworkDocumentation.uploadReady": "Original received and checked",
  "artworkDocumentation.uploadFailed":
    "This file could not be completed. Try the upload again; it has not been added as a ready file.",
  "artworkDocumentation.uploadReselect":
    "Reselect the same file to resume. We check the bytes before reusing uploaded parts.",
  "artworkDocumentation.uploadMismatch":
    "This is a different file. Start a new upload to keep the original bytes consistent.",
  "artworkDocumentation.uploadLimit":
    "Maximum file size: {size}. Remaining context storage: {remaining}.",
  "artworkDocumentation.download": "Download original",
  "artworkDocumentation.noFiles": "No original files added yet.",
  "artworkDocumentation.noPreview": "Preview unavailable for this format",
  "artworkDocumentation.fileDetails": "File details and integrity",
  "artworkDocumentation.fileHash": "Original SHA-256",
  "artworkDocumentation.canonical": "Use as final artwork",
  "artworkDocumentation.canonicalReason":
    "Why are you replacing the confirmed final file?",
  "artworkDocumentation.canonicalReasonHelp":
    "Explain the change in 20–1,000 characters. This explanation becomes part of the record’s history.",
  "artworkDocumentation.fileLabel": "File label",
  "artworkDocumentation.fileDescription": "File description",
  "artworkDocumentation.masterHelp":
    "A preservation master may be the same file as your final artwork. If a larger or less compressed master survives, include it. If it no longer exists, tell us.",
  "artworkDocumentation.sourceFilesHelp":
    "RAW files, scans, layers and working files can help explain how a work was made. Add surviving files you are comfortable sharing for restricted review, or tell us that you retain them.",
  "artworkDocumentation.cc0":
    "CC0 is intended to let others use the artwork broadly without asking you. It does not automatically cover other people's rights or every supporting file you provide. Your proposed license and the effect of your declaration are recorded separately.",
  "artworkDocumentation.cc0Link": "Read the CC0 1.0 deed",
  "artworkDocumentation.interviewHelp":
    "Your voice can add another layer to the work's history. A short written reflection or a recorded conversation can preserve details that a caption leaves out. This section is recommended, not required for this first intake.",
  "artworkDocumentation.language": "Language",
  "artworkDocumentation.text": "Text",
  "artworkDocumentation.authorship": "Authorship",
  "artworkDocumentation.approved": "Approved by the artist",
  "artworkDocumentation.primaryLanguage": "Primary language",
  "artworkDocumentation.captionHelp":
    "Give a reader a way into the work. Aim for 75–150 words in your chosen language.",
  "artworkDocumentation.captureHelp":
    "When was the photograph made? A year or approximate range is useful if you do not know the exact date.",
  "artworkDocumentation.locationHelp":
    "A city or region is enough. Choose Withheld if the location could identify a private or sensitive place.",
  "artworkDocumentation.changesHelp":
    "Describe changes that matter to understanding the image, such as combining photographs, constructing a scene, removing elements or focus stacking. None is a valid answer.",
  "artworkDocumentation.budget": "Draft text: {used} of {limit}",
  "artworkDocumentation.invalidField":
    "Check this answer before saving. Required details may be missing or a value may exceed its limit.",
  "artworkDocumentation.upgrade":
    "This record uses a newer documentation format. Reload the app before editing it.",
  "artworkDocumentation.pin": "Use updated artist information",
  "artworkDocumentation.pinHelp":
    "Each work keeps the artist-information version you selected. Updating one work does not silently change another.",
} as const;
