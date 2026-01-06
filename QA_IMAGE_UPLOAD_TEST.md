# QA Test Plan: Image Upload Bug Fix

## Overview
Testing the fix for image upload in drop creation. The bug prevented re-adding the same image after removing it.

---

## Prerequisites
- Logged into 6529SEIZE
- Have 2-3 test images ready on your device (e.g., `test1.jpg`, `test2.jpg`, `test3.jpg`)

---

## Getting to the Test Area

### Step 1: Navigate to Waves
1. From the landing page, look at the **left sidebar**
2. Click on **"Waves"** in the navigation menu
3. You should see a list of available waves

### Step 2: Enter a Wave
1. Click on any wave from the list to open it
2. You should now see a chat/feed area with a **text input box** at the bottom
3. Look for an **image icon** (upload media button) next to or below the text input

---

## Test Cases

### Test Case 1: Add, Remove, Re-add Same Image
**Priority: HIGH** (This is the main bug scenario)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** next to the input | File picker opens |
| 2 | Select `test1.jpg` from your device | Image appears as preview below the input |
| 3 | Click the **X button** on the image preview to remove it | Image preview disappears |
| 4 | Click the **image/media upload icon** again | File picker opens |
| 5 | Select the **same image** (`test1.jpg`) again | **Image should appear as preview** |

**Pass criteria:** Image appears after step 5
**Fail criteria:** Nothing happens after selecting the same image

---

### Test Case 2: Add, Remove, Post, Re-add Same Image
**Priority: HIGH** (Second bug scenario)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** | File picker opens |
| 2 | Select `test1.jpg` | Image preview appears |
| 3 | Click **X** to remove the image | Image preview disappears |
| 4 | Type some text in the input (e.g., "Test post") | Text appears in input |
| 5 | Click the **Submit/Post button** | Drop is posted (text only, no image) |
| 6 | Click the **image/media upload icon** again | File picker opens |
| 7 | Select `test1.jpg` again | **Image should appear as preview** |

**Pass criteria:** Image appears after step 7
**Fail criteria:** Nothing happens after selecting the image

---

### Test Case 3: Add Different Image After Removal
**Priority: MEDIUM** (Sanity check)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** | File picker opens |
| 2 | Select `test1.jpg` | Image preview appears |
| 3 | Click **X** to remove the image | Image preview disappears |
| 4 | Click the **image/media upload icon** again | File picker opens |
| 5 | Select a **different image** (`test2.jpg`) | Image preview appears |

**Pass criteria:** Different image appears after step 5

---

### Test Case 4: Multiple Images
**Priority: MEDIUM** (Regression check)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** | File picker opens |
| 2 | Select multiple images (up to 4) | All images appear as previews |
| 3 | Remove one image by clicking its **X** | That image disappears, others remain |
| 4 | Click upload icon and re-add the removed image | Image appears again |

**Pass criteria:** All steps work as described

---

### Test Case 5: Post with Image Successfully
**Priority: HIGH** (Regression - ensure posting still works)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** | File picker opens |
| 2 | Select an image | Image preview appears |
| 3 | Optionally add text | Text appears in input |
| 4 | Click **Submit/Post button** | Drop is posted with image visible in feed |

**Pass criteria:** Image appears in the posted drop in the feed

---

### Test Case 6: Exceed File Limit Then Retry
**Priority: LOW** (Edge case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the **image/media upload icon** | File picker opens |
| 2 | Select more than 4 files at once | Error toast appears about file limit |
| 3 | Click upload icon again | File picker opens |
| 4 | Select 1-4 files | Files appear as previews |

**Pass criteria:** After error, can still select valid number of files

---

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Add, Remove, Re-add Same | PASS / FAIL | |
| TC2: Add, Remove, Post, Re-add | PASS / FAIL | |
| TC3: Add Different After Removal | PASS / FAIL | |
| TC4: Multiple Images | PASS / FAIL | |
| TC5: Post with Image | PASS / FAIL | |
| TC6: Exceed Limit Then Retry | PASS / FAIL | |

---

## Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Notes for Tester
- The upload button may look like a **camera icon**, **image icon**, or **paperclip icon**
- If you can't find the upload button, look for a button that expands to show more options (chevron/arrow)
- Image previews appear below or near the text input area
- The X button to remove is usually in the top-right corner of each image preview
