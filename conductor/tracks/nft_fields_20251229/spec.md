# Specification: NFT Submission Additional Fields

## Overview
This track implements additional data collection fields in the NFT submission flow to support operational and social posting requirements. The new fields will capture private information regarding airdrops, payments, allowlists, and supplemental media. This data will be stored as part of the submission metadata and should be viewable on the submission page via a secondary "details" view to preserve screen real estate.

## Functional Requirements
### 1. New Submission Step: "Additional Information"
- Integrate a new dedicated step in the submission wizard.

### 2. Airdrop & Payment Fields
- **Fields:**
    - `airdrop_artist_address`: Wallet address (0x...).
    - `airdrop_artist_count`: Number of tokens.
    - `airdrop_choice_address`: Wallet address (0x...).
    - `airdrop_choice_count`: Number of tokens.
    - `payment_address`: Wallet address (0x...).
- **Validation:**
    - Must be valid Ethereum addresses (starts with 0x, 42 chars).
    - ENS names are not accepted.

### 3. Allowlist Configuration
- **Structure:** Support multiple "batches" of allowlists.
- **Input:** For each batch, capture:
    - Contract Address (0x...)
    - Token IDs (Input supports lists `1,2,3` and ranges `10-20`).
- **Data Modeling:** Store as a structured list in metadata, e.g., `allowlist_batches: [{ contract: "0x...", token_ids: [1,2,3...] }]`.
- **Parsing:** Reuse `NftPicker` logic to parse ranges/lists on the frontend.

### 4. Supplemental Media & Commentary
- **Artist Profile Media:** Up to 4 files (`artist_profile_media`).
- **Artwork Commentary Media:** Up to 4 files (`artwork_commentary_media`).
- **Artwork Commentary:** Text area (`artwork_commentary`).
- **Constraints:** Images/Video only, max 4 per category.

### 5. Submission View Updates
- **Display:** Do NOT show these fields in the primary metadata view.
- **Access:** Add a "View Additional Details" (or similar) toggle/modal on the submission page to inspect these operational fields.

## Data Storage Strategy
- All new fields will be appended to the existing submission `metadata` object.
- **Keys:**
    - `airdrop_info` (Object containing addresses/counts)
    - `payment_info` (Object containing payment address)
    - `allowlist_batches` (Array of objects)
    - `additional_media` (Object containing profile/commentary URLs)
    - `commentary` (String)

## Non-Functional Requirements
- **UX Consistency:** Match existing wizard styling.
- **Parsability:** Ensure Token ID ranges are expanded into explicit lists before submission.

## Acceptance Criteria
- [ ] "Additional Information" step added to wizard.
- [ ] Users can add multiple Allowlist Contract + Token ID sets.
- [ ] Token ID input successfully parses ranges (e.g., "1-5" -> [1,2,3,4,5]).
- [ ] Address fields validate strict 0x format.
- [ ] All new data is saved within the submission `metadata`.
- [ ] Submission page allows viewing this data via a secondary action (not cluttering the main view).
