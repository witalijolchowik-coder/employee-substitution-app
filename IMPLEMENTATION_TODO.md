# Implementation TODO

## Phase 1: UI Fixes & Journal Screen

### Page 1 (Substitution Form)
- [ ] Change background color to dark blue (#0B1929)
- [ ] Keep monochrome logo (no red arrow)
- [ ] Add "Dziennik" (Journal) button below "Wyślij e-mail" button
- [ ] Fix single-tap selection in autocomplete dropdowns
- [ ] Fix autocomplete for "Nieobecny pracownik" field
- [ ] Fix autocomplete for "Zastępca" field

### Page 2 (Journal Screen)
- [ ] Create new journal screen component
- [ ] Add fixed header bar with "LISTOPAD" / "2025" (updates based on scroll)
- [ ] Add scrollable journal entries (compact cards, 5+ visible)
- [ ] Each card shows: date | shift letter | absent employee (gray) | replacement (white)
- [ ] Implement swipe-left gesture to delete card
- [ ] Add fixed footer bar with "Wyjście" (Exit) or "Powrót" (Back) button
- [ ] Change background to dark blue (#0B1929)

### Navigation
- [ ] Add tab navigation between pages
- [ ] "Dziennik" button on page 1 navigates to page 2
- [ ] "Wyjście" button on page 2 navigates back to page 1

## Phase 2: Testing & Deployment
- [ ] Test single-tap autocomplete selection
- [ ] Test swipe-left deletion on journal cards
- [ ] Test month/year update in header
- [ ] Verify dark blue background on both pages
- [ ] Build APK and upload to GitHub

