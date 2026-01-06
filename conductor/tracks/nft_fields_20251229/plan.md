# Plan: NFT Submission Additional Fields Implementation

This plan implements additional operational fields in the NFT submission flow, storing them within the submission metadata.

## Phase 1: Foundation & Utility Logic [checkpoint: cc7d52e]
Implement the core data structures and the parsing logic for token ID ranges and address validation.

- [x] Task: Define TypeScript interfaces and constants for new metadata fields 4770a8f
    - [x] Sub-task: Create types for `airdrop_info`, `payment_info`, `allowlist_batches`, and `additional_media` in a shared types file
- [x] Task: Implement and test Token ID range parsing utility 1ebcd66
    - [x] Sub-task: Write unit tests for parsing strings like "1,2,4-6,10" into [1,2,4,5,6,10] (Red Phase)
    - [x] Sub-task: Implement `parseTokenIds` utility reusing logic from `NftPicker` (Green Phase)
- [x] Task: Implement and test strict Ethereum address validation bde452c
    - [x] Sub-task: Write unit tests for validating 0x-prefixed addresses and rejecting ENS (Red Phase)
    - [x] Sub-task: Implement `validateStrictAddress` utility (Green Phase)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Utility Logic' (Protocol in workflow.md) cc7d52e

## Phase 2: Submission Wizard UI Components [checkpoint: 2b6d1ffd9ebf8ec89846ec7364f6cb152f4f5539]
Create the UI components for the new form fields, adhering to existing submission styles.

- [x] Task: Implement `AirdropAddressFields` component 5b19f0b
    - [x] Sub-task: Write tests for rendering and basic validation (Red Phase)
    - [x] Sub-task: Implement component with inputs for artist/choice addresses and counts (Green Phase)
- [x] Task: Implement AllowlistBatchManager component 44555be
    - [x] Sub-task: Write tests for adding/removing multiple allowlist batches (Red Phase)
    - [x] Sub-task: Implement component that allows dynamic addition of Contract Address + Token ID range inputs (Green Phase)
- [x] Task: Implement `AdditionalMediaUpload` component a873a8e
    - [x] Sub-task: Write tests for file type and count restrictions (Red Phase)
    - [x] Sub-task: Implement media uploader for Artist Profile and Commentary Media (Green Phase)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Submission Wizard UI Components' (Protocol in workflow.md) 2b6d1ffd9ebf8ec89846ec7364f6cb152f4f5539

## Phase 3: Wizard Integration & Submission Logic
Integrate the new step into the submission flow and ensure data is correctly bundled into the metadata.

- [x] Task: Create "Additional Information" step component
    - [x] Sub-task: Implement `AdditionalInfoStep.tsx` combining the components from Phase 2
- [x] Task: Integrate new step into the submission container
    - [x] Sub-task: Update `MemesArtSubmissionContainer` to include the "Additional Information" step
    - [x] Sub-task: Update form state management to track the new field values
- [x] Task: Update submission mutation logic
    - [x] Sub-task: Write tests to ensure metadata is correctly formatted before API call (Red Phase)
    - [x] Sub-task: Modify `useArtworkSubmissionMutation` to bundle new fields into the `metadata` object (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Wizard Integration & Submission Logic' (Protocol in workflow.md)

## Phase 4: Displaying Additional Details
Update the submission view to allow authorized users to view the supplemental operational data.

- [ ] Task: Implement `AdditionalSubmissionDetails` display component
    - [ ] Sub-task: Create a component to render the structured metadata (airdrops, allowlists, etc.)
- [ ] Task: Add "View Additional Details" action to submission page
    - [ ] Sub-task: Add a button/toggle to the submission detail view that opens a modal or expands a section containing the new data
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Displaying Additional Details' (Protocol in workflow.md)
