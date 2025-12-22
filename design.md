# Mobile App Design Document: Informacje o zastępstwie

## Overview
This is a mobile application for sending employee substitution notifications via email. The app features a dark theme following Material Design 3 guidelines and is optimized for one-handed portrait usage.

## Screen List

### 1. Main Form Screen (Home)
**Purpose:** Single-screen app for composing and sending substitution notifications

**Content:**
- Form header: "Informacje o zastępstwie"
- Refresh button (top-right corner) to reload employee/agency lists from cloud
- 4-5 input fields (depending on whether agency field is shown)
- Send button at bottom

**Functionality:**
- Load employee and agency lists from GitHub Gist on app start
- Cache lists locally for offline use
- Allow manual input for employee names not in the list
- Dynamically show agency field when manual name is entered
- Compose email with proper formatting
- Open Outlook with pre-filled email for user to send

## Primary Content and Functionality

### Input Fields

1. **Nieobecny pracownik** (Absent Employee)
   - Type: Combo box (dropdown + manual input)
   - Data source: Cloud-synced employee list
   - Behavior: Allows selection from list or manual text entry

2. **Zmiana** (Shift)
   - Type: Dropdown
   - Options: D, M, N (fixed values)

3. **Zastępca** (Substitute)
   - Type: Combo box (dropdown + manual input)
   - Data source: Cloud-synced employee list
   - Behavior: Allows selection from list or manual text entry
   - Triggers: If manual input detected, show agency field below

4. **Agencja** (Agency) - CONDITIONAL
   - Type: Dropdown
   - Data source: Cloud-synced agency list
   - Visibility: Only shown when substitute name is manually entered (not from list)
   - Behavior: When selected, adds agency email to CC recipients
   - Visual: Highlighted with amber border to indicate dynamic appearance

5. **Data** (Date)
   - Type: Date picker
   - Default: Current date
   - Format: DD.MM.YYYY

### Actions

**Primary Action: "Wyślij e-mail" Button**
- Validates all required fields are filled
- Formats email body using Polish template
- Adds agency name in parentheses after substitute name if agency selected
- Opens device's email client (Outlook) with pre-filled:
  - To: xdr1-lead-out@id-logistics.com, xdr1-flowcontrol@id-logistics.com
  - CC: mcal@id-logistics.com + agency email (if selected)
  - Subject: "Informacje o zastępstwie / [DATE] / [SHIFT] / Personnel Service"
  - Body: Formatted Polish text with substitution details

**Secondary Action: Refresh Button**
- Re-downloads employee and agency lists from GitHub Gist
- Updates cached data
- Shows loading indicator during download

## Key User Flows

### Flow 1: Standard Substitution (Both Employees from List)
1. User opens app
2. App loads cached employee/agency lists (or downloads if first launch)
3. User selects absent employee from dropdown
4. User selects shift (D/M/N)
5. User selects substitute from dropdown
6. User selects/confirms date
7. User taps "Wyślij e-mail"
8. Outlook opens with pre-filled email
9. User reviews and taps "Send" in Outlook

### Flow 2: External Agency Substitute
1. User opens app
2. User selects absent employee from list
3. User selects shift
4. User types substitute name manually (e.g., "Jan Kowalski")
5. **Agency field appears dynamically** with amber highlight
6. User selects agency from dropdown (e.g., "JobService")
7. User selects/confirms date
8. User taps "Wyślij e-mail"
9. Outlook opens with pre-filled email including:
   - Substitute name with agency in parentheses: "Jan Kowalski (JobService)"
   - Agency email in CC field
10. User reviews and taps "Send" in Outlook

### Flow 3: Offline Usage
1. User opens app without internet connection
2. App loads last cached employee/agency lists
3. User completes form normally
4. Email composition works as usual (requires internet for sending via Outlook)

### Flow 4: Update Lists
1. User taps refresh button (🔄) in top-right corner
2. App downloads latest lists from GitHub Gist
3. App updates cache
4. Dropdowns now show updated employee/agency lists

## Color Choices (Material Design 3 Dark Theme)

### Background Colors
- **Primary background:** `#121212` (very dark gray, almost black)
- **Surface/Card:** `#1E1E1E` (slightly lighter for input fields)
- **Elevated surface:** `#2C2C2C` (for modals/sheets if needed)

### Text Colors
- **Primary text:** `#FFFFFF` (white, for input values and titles)
- **Secondary text:** `#B3B3B3` (light gray, for field labels)
- **Disabled text:** `#6B6B6B` (darker gray)

### Accent Colors
- **Primary action (button):** `#2196F3` (Material Blue)
- **Dynamic highlight (agency field):** `#FF6F00` (Amber, for border)
- **Error/validation:** `#F44336` (Material Red)

### Icon Colors
- **Active icons:** `#B3B3B3` (light gray)
- **Inactive icons:** `#6B6B6B`

## Typography

- **Title (header):** 24pt, Bold, White
- **Field labels:** 14pt, Regular, Light Gray (#B3B3B3)
- **Input text:** 16pt, Regular, White
- **Button text:** 16pt, Semi-Bold, White

## Layout Specifications

- **Screen padding:** 16pt horizontal, 20pt vertical
- **Field spacing:** 16pt between fields
- **Input field height:** 56pt (Material Design standard)
- **Button height:** 48pt
- **Corner radius:** 8pt for inputs, 12pt for button
- **Touch targets:** Minimum 44pt for all interactive elements

## Data Sources

### Employee List
- **Source:** GitHub Gist (JSON array)
- **URL:** https://gist.githubusercontent.com/witalijolchowik-coder/3f56631351c945b27d54f05239ecd7ea/raw/44aa34f8ca86c46927214a259ec981e05621304c/gistfile1.txt
- **Format:** `["Name Surname", "Name Surname", ...]`
- **Cache key:** `employee_list_cache`
- **Fallback:** Hardcoded list if download fails

### Agency List
- **Source:** GitHub Gist (JSON array of objects)
- **URL:** https://gist.githubusercontent.com/witalijolchowik-coder/3f56631351c945b27d54f05239ecd7ea/raw/44aa34f8ca86c46927214a259ec981e05621304c/gistfile2.txt
- **Format:** `[{"name": "Agency Name", "email": "email@domain.com"}, ...]`
- **Cache key:** `agency_list_cache`
- **Fallback:** Hardcoded list if download fails

## Email Template

**Subject:**
```
Informacje o zastępstwie / [DD.MM.YYYY] / [SHIFT] / Personnel Service
```

**Body:**
```
Dzień dobry

Chciałbym poinformować, że [ABSENT_EMPLOYEE] nie będzie obecny (-a) w pracy [DD.MM.YYYY] na zmianie [SHIFT]. Na jego (-ej) miejsce wejdzie [SUBSTITUTE_NAME][(AGENCY_NAME)].

Proszę o uwzględnienie tej zmiany i wprowadzenie odpowiedniej korekty do harmonogramu.

Pozdrawiam,
```

**Recipients:**
- **To:** xdr1-lead-out@id-logistics.com; xdr1-flowcontrol@id-logistics.com
- **CC:** mcal@id-logistics.com; [agency_email if selected]

## Technical Notes

- **Platform:** React Native with Expo
- **Navigation:** Single screen app (no tabs needed)
- **Storage:** AsyncStorage for caching lists
- **Email:** React Native Linking API to open mailto: URL with Outlook
- **Network:** Fetch API for downloading lists from GitHub Gist
- **State Management:** React hooks (useState, useEffect)
