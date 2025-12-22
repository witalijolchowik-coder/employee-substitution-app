# Project TODO

## App Branding
- [x] Generate custom app icon
- [x] Update app.config.ts with branding info

## Main Form Screen
- [x] Remove default template content
- [x] Create form layout with proper spacing
- [x] Add header with title and refresh button
- [x] Implement "Nieobecny pracownik" combo box field
- [x] Implement "Zmiana" dropdown field (D, M, N)
- [x] Implement "Zastępca" combo box field
- [x] Implement conditional "Agencja" dropdown field
- [x] Implement "Data" date picker field
- [x] Add "Wyślij e-mail" button at bottom

## Data Management
- [x] Create service to fetch employee list from GitHub Gist
- [x] Create service to fetch agency list from GitHub Gist
- [x] Implement AsyncStorage caching for employee list
- [x] Implement AsyncStorage caching for agency list
- [x] Add hardcoded fallback lists
- [x] Implement refresh functionality

## Dynamic UI Logic
- [x] Detect manual input vs list selection for employee fields
- [x] Show/hide agency field based on substitute input
- [x] Add amber highlight to agency field when it appears
- [x] Validate all required fields before email composition

## Email Integration
- [x] Build email subject with date and shift
- [x] Build email body using Polish template
- [x] Add agency name in parentheses if selected
- [x] Compose recipient lists (To and CC)
- [x] Add agency email to CC when selected
- [x] Open Outlook with mailto: URL using Linking API

## Dark Theme Styling
- [x] Update theme.ts with Material Design dark colors
- [x] Style form container with dark background
- [x] Style input fields with dark surface color
- [x] Style labels with light gray color
- [x] Style button with Material Blue
- [x] Style agency field with amber border highlight
- [x] Ensure proper contrast for accessibility

## Testing & Polish
- [x] Test with all employee names from list
- [x] Test with manual employee input
- [x] Test agency field appearance/disappearance
- [x] Test email composition with all field combinations
- [x] Test offline mode with cached data
- [x] Test refresh functionality
- [x] Verify date picker works correctly
- [x] Check all text is in Polish
