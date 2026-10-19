# Rental Buddy — Design System & Engineering Baseline

> **Notice for AI Agents & Developers:**  
> This file is the primary design token and UI baseline for **Rental Buddy**. Every screen, component, spacing, color, and interaction in this project MUST strictly follow these guidelines to maintain 100% aesthetic and logical consistency across all development sessions.

---

## 1. Brand Identity & Product Scope
- **App Name**: **Rental Buddy** (formerly referenced as *RentHisab* in early prototypes — always use **Rental Buddy**).
- **Core Purpose**: A mobile-first, installable PWA for property owners/landlords and tenants to record, manage, and settle home rent, electricity, and water bills with automated clarity.
- **Design Philosophy**: High-clarity fintech, clean soft-tinted surfaces, high contrast typography, accessible touch targets, and smooth micro-animations.

---

## 2. Color Palette & Design Tokens

### Backgrounds & Surfaces
- **App Canvas (`--bg-canvas`)**: `#EFF0FA` (Soft periwinkle/lavender tint — creates depth and allows cards to stand out).
- **Surface / Card (`--bg-surface`)**: `#FFFFFF` (Pure white).
- **Surface Elevated / Hover (`--bg-surface-elevated`)**: `#FFFFFF` with elevated shadow.
- **Icon Container Subtle (`--bg-accent-subtle`)**: `#E8E7FB` (Light lavender tint for secondary icons).
- **Button Secondary Background (`--bg-secondary-btn`)**: `#E2E3F3` (Muted soft lavender-gray).
- **Button Secondary Active (`--bg-secondary-btn-hover`)**: `#D6D8EC`.

### Brand & Primary Accents
- **Primary Brand (`--color-primary`)**: `#5452EC` (Vibrant Indigo / Purple).
- **Primary Hover / Active (`--color-primary-active`)**: `#4340D8`.
- **Primary Glow / Focus (`--color-primary-focus`)**: `rgba(84, 82, 236, 0.25)`.
- **Primary Text on Brand (`--text-on-primary`)**: `#FFFFFF`.

### Typography Colors
- **Text Heading / Primary (`--text-heading`)**: `#0E1326` (Deep dark slate navy, 95% contrast).
- **Text Body / Secondary (`--text-body`)**: `#52586E` (Balanced slate purple-gray).
- **Text Muted / Tertiary (`--text-muted`)**: `#7D849B`.
- **Text Subtle / Placeholder (`--text-subtle`)**: `#9FA5BC`.

### Borders & Dividers
- **Card / Input Border (`--border-subtle`)**: `#E2E4F2`.
- **Border Active / Focused (`--border-active`)**: `#5452EC`.

---

## 3. Typography Hierarchy
- **Font Family**: `'Plus Jakarta Sans'`, system-ui, -apple-system, sans-serif.
- **Scale**:
  | Token | Size | Weight | Line Height | Usage |
  |---|---|---|---|---|
  | `font-brand` | 24px | 700 (Bold) | 1.2 | Top logo and brand titles |
  | `font-h1` | 28px - 32px | 800 (ExtraBold) | 1.15 | Main screen hero titles ("Refined Financial Clarity.") |
  | `font-h2` | 22px - 24px | 700 (Bold) | 1.25 | Section headers ("Choose Your Preferences") |
  | `font-card-title` | 16px - 17px | 700 (Bold) | 1.3 | Card headline, action options |
  | `font-body` | 14.5px - 15px | 400 (Regular) | 1.45 | Screen subtitles, explanatory copy |
  | `font-caption` | 13px - 13.5px | 400 (Regular) | 1.4 | Value proposition card descriptions |
  | `font-button` | 15px - 16px | 600 (SemiBold) | 1.2 | Pill action buttons |

---

## 4. Spacing, Geometry & Radii

### Border Radii
- **Buttons (Pill)**: `9999px` (Full round pill).
- **Cards & Containers**: `20px` (Feature cards, action cards, setup cards).
- **Radio / Input Items**: `16px`.
- **Icon Circles**: `50%` (Circular 48px × 48px).

### Padding & Margins
- **Screen Horizontal Gutter**: `20px` to `24px` (down to `16px` on 360px viewport).
- **Screen Top Safe-Area Padding**: `16px` (or `env(safe-area-inset-top)` on devices).
- **Screen Bottom Safe-Area Padding**: `20px` to `24px` (or `env(safe-area-inset-bottom)` on devices).
- **Card Internal Padding**: `18px 20px` (or `14px 16px` on 360px viewport).
- **Between Stacked Cards**: `12px` to `16px`.
- **Between Sections**: `24px` to `32px`.

### Shadows & Elevation ("Pop-Up" Feel)
- **Card Elevation**: `0px 4px 16px rgba(28, 33, 66, 0.04)`.
- **Active Card Elevation**: `0px 8px 24px rgba(84, 82, 236, 0.12)`.
- **Primary Pill Button Elevation**: `0px 8px 24px rgba(84, 82, 236, 0.35), 0px 2px 6px rgba(84, 82, 236, 0.2)` (Creates vibrant tactile pop-up depth).
- **Secondary Pill Button Elevation**: `0px 4px 14px rgba(14, 19, 38, 0.08)`.

---

## 5. UI Elements & Component Standards

### 1. Header & Navigation
- **Back Navigation**: Minimalist chevron/arrow `←` (`24px × 24px`, `#0E1326`), 44px tap target.
- **Brand Header**: Icon (House with person badge) + "Rental Buddy" bold text in `#5452EC`.

### 2. Feature Cards (Value Props)
- White background (`#FFFFFF`), rounded 20px, light subtle border or soft shadow.
- Left: 48px circle icon with lavender background (`#E8E7FB`) and `#5452EC` SVG icon.
- Right: Bold title (`#0E1326`) and muted description (`#52586E`).

### 3. Action Cards (Setup/Choices)
- Same card geometry with right-aligned chevron icon (`#9FA5BC`).
- Primary action: Solid primary circle (`#5452EC`) with white plus icon.
- Secondary action: Lavender circle (`#E8E7FB`) with primary download/restore icon.

### 4. Selectable / Radio List Options
- Height ~58px, padded 16px 20px, rounded 16px.
- Unchecked: White background, subtle border `#E2E4F2`, hollow circle on right.
- Checked: Border `#5452EC`, subtle tint background `rgba(84, 82, 236, 0.04)`, circle filled with `#5452EC` and white inner dot.

### 5. Buttons & Action Bar Architecture (STRICT ANTI-COLLAPSE RULE)
- **Zero-Shrink Guarantee**:
  - Every button (`.btn`) MUST have `height: 54px; min-height: 54px; flex-shrink: 0;`.
  - Every action bar container (`.bottom-bar`) MUST have `flex-shrink: 0;`.
  - Buttons MUST NEVER collapse, squash, or truncate vertically under flexbox pressure.
- **Visual Depth ("Pop-Up")**:
  - Buttons must clearly pop out with elevated shadows, clean rounded-full pill geometry (`border-radius: 9999px`), and crisp centered typography (`line-height: 1`).
- **Two-Button Action Bar (Screen 4: "Not now" & "Enable Notifications")**:
  - Both buttons MUST share the EXACT same height (`54px`, `min-height: 54px`).
  - Balanced width split: "Not now" secondary button and "Enable Notifications" primary button must have proportional flex spacing with `white-space: nowrap;` so neither button wraps text or looks disproportionate/awkward.

---

## 6. Logic Mismatches & Copy Fixes Applied
1. **Brand Name Mismatch**:  
   - *Figma Screen 1*: Text read *"RentHisab is your all-in-one utility..."* while title/logo read **Rental Buddy**.  
   - *Resolution*: Unified to **Rental Buddy**.
2. **Placeholder & Typo in Smart Ledger Card**:  
   - *Figma Screen 1*: Read *"Lorem ipsum dolar sit amet."* with misspelled "dolar".  
   - *Resolution*: Replaced with high-fidelity copy: *"Automated tracking for rent, utilities, dues, and advance balances."*
3. **Punctuation in Private Data Card**:  
   - *Figma Screen 1*: Read *"Your data is only accessible by you"* (missing punctuation).  
   - *Resolution*: Standardized to *"Your records are stored privately and accessible only by you."*
4. **Notification Permission Copy**:  
   - *Figma Screen 4*: Read *"You will get the notification for the bill generation reminders once enabled."*  
   - *Resolution*: Rewritten for natural mobile tone: *"Receive timely reminders for monthly rent generation, utility bill splits, and payment due dates."*
5. **Currency Screen Options**:  
   - Provided: Indian Rupee (₹), USD ($), Others (~).  
   - Added interactive modal/selector for custom currency when "Others" is tapped.

---

## 7. Mobile Viewport & 360px Constraint (STRICT RESPONSIVENESS RULE)
- **360px Minimum Viewport Width Guarantee**:
  - The app layout MUST support narrow mobile screens down to **360px width** (and up to desktop preview).
  - **No Awkward Wrapping or Congestion**: Under no circumstances should text, headers, action buttons, or list items wrap awkwardly or look congested as if there's no space.
  - On screens `<= 380px`:
    - Container horizontal padding adjusts from `24px` to `16px`.
    - Hero title scales smoothly via `clamp(24px, 7vw, 30px)`.
    - Button text scales smoothly with `white-space: nowrap;` and appropriate padding (`12px 16px`).
- **Independent Scrollable Screen Content**:
  - `.screen-content` MUST have `overflow-y: auto; flex: 1;`.
  - When screen height is limited (small mobile devices or landscape), the content scrolls smoothly inside the screen while the sticky bottom action bar stays fixed and uncompressed at its full `54px` height.

---

## 8. Self-Learning & Non-Destructive Update Protocol for AI Agents
- **Automatic Learning Capture**:
  - Whenever new UI components, user preferences, layout constraints, or styling decisions are introduced during conversation sessions, the AI agent MUST automatically document them in this `AGENTS.md` file.
- **Strict Non-Destructive Rule**:
  - Additions must be made non-destructively: **NEVER delete, truncate, or overwrite previously established rules or tokens**. Always append new subsections, augment existing tables, or refine rules while preserving historical baseline context.

---

## 9. Native OS System Bars (STRICT EXCLUSION RULE)
- **Do NOT Replicate Native OS Bars in App DOM**:
  - **Gesture Bar**: The bottom center black pill bar in mobile mockups is the **native Android/iOS gesture navigation bar**. Never draw or simulate this bar in the app DOM.
  - **Status Bar**: The top clock, battery, wifi, and camera notch in mockups are the **native OS status bar**. Do NOT render a fake status bar header inside the web app DOM.
  - Layout must respect safe-area insets (`env(safe-area-inset-top, 16px)`, `env(safe-area-inset-bottom, 16px)`), but never duplicate OS-level UI controls.

---

## 10. Form Controls & Inputs Architecture

### Text Inputs & Number Fields
- **Container**: White background (`#FFFFFF`), border `1.5px solid var(--border-subtle)` (`#E2E4F2`), rounded `16px`, height `54px`, horizontal padding `16px`.
- **Typography**: Input text `15px`, weight `500`, color `var(--text-heading)`. Placeholder color `var(--text-subtle)` (`#9FA5BC`).
- **Focus State**: `border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-focus); outline: none;`.
- **Labels**: `font-size: 14.5px; font-weight: 600; color: var(--text-heading); margin-bottom: 6px; display: block;`.
- **Helper / Caption Text**: `font-size: 12.5px; color: var(--text-muted); margin-top: 4px;`.
- **Split Fields**: Dual inputs (e.g., Rent Amount & Advance Amount) share a 2-column grid (`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`).
- **Input Action Buttons**: E.g., Phone contact picker button placed adjacent to input (`width: 52px; height: 52px; border-radius: 14px; background: #FFFFFF; border: 1.5px solid #E2E4F2;`).
- **Date Picker Controls (MANDATORY)**:
  - Recurring billing date MUST be an interactive date/day picker and NEVER a plain text box.
  - Tapping opens native/custom calendar picker, displaying formatted billing recurrence (e.g. "12th of every month").

### Toggle Switches (Utilities)
- **Geometry**: Pill track `48px × 28px`, circular white knob `22px × 22px`.
- **OFF State**: Track background `#6F7488` (or `#787D94`), knob aligned to left.
- **ON State**: Track background `#10B981` (Emerald Green) or `#22C55E`, knob translated right by `20px`.
- **Transition**: Smooth ease-spring sliding animation (`200ms cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 11. Wizard Navigation & Progress Header
- **Structure**:
  - Left: Back arrow `←` (`40px × 40px` tap target).
  - Center: Main Title ("Create Tenancy" — `18px`, bold `#0E1326`) and Progress Subtitle ("Step 1 of 3", "Step 2 of 3", etc. — `13px`, `#7D849B`).
  - Right: Empty spacer (`40px`) to maintain perfect center alignment.

---

## 12. Utility Expandable Cards (Accordion Pattern & Dynamic Field Swapping)
- **Closed State**: White rounded card (`20px`), padded `16px 20px`, containing utility title on left and toggle switch on right.
- **Expanded State (Toggled ON)**:
  - Card expands downwards revealing sub-options.
  - Subtle divider line (`#EAEBF6`).
  - **Bill Type Selection (Dynamic Field Swapping)**:
    - Choosing **`Meter Reading`** MUST display:
      1. Price Per Unit (e.g., "Electricity Price Per Unit")
      2. Current Meter Reading
    - Choosing **`Flat`** MUST display:
      1. Bill Amount (e.g., "Electricity Bill Amount" / "Water Bill Amount")
    - Selecting between `Flat` and `Meter Reading` must dynamically swap these fields instantly without page reload.
- **Micro-animation**: Height/opacity transition when toggled so the form feels alive and responsive.

---

## 13. Dashboard & Empty State ("Your Tenancy")
- **Header**: Settings gear icon (`24px`, `#0E1326`) on left, Add icon (`+`, `#0E1326`) on right.
- **Screen Title**: "Your Tenancy" (`28px`, bold).
- **Empty State Card**:
  - Large rounded surface (`border-radius: 24px`, border `1.5px solid #D6D9EE` or white card with soft shadow).
  - Centered icon container: Rounded square (`60px × 60px`, `#E8E7FB`), House + Person icon in `#5452EC`.
  - Title: "No Tenancy" (`20px`, bold `#0E1326`).
  - Explanatory copy: Centered slate description.
  - Action Button: Compact pill button ("Create Tenancy", `#5452EC`, `height: 46px`).

---

## 14. Typographic Widow & Orphan Elimination Rule
- **Text Wrap Balance Guarantee**:
  - All hero subtitles, card descriptions, and explanatory copy MUST use `text-wrap: balance;` (and `text-wrap: pretty;`).
  - Single trailing words (e.g., orphan "it.", "with.", etc.) on a new line are strictly prohibited across all viewports down to 360px.

---

## 15. Version Control & Git Commit Protocol (STRICT RULE)
- **Local Commits Mandatory**:
  - Every meaningful change, screen addition, bug fix, or design refinement MUST be committed and saved locally to Git.
- **Strict Push Restriction**:
  - AI agents MUST **NEVER** push commits to remote (`git push`) automatically.
  - Pushing to remote repository is strictly forbidden unless the USER gives an **explicit command** to push.

---

## 16. Home Dashboard Architecture, Multi-Tenancy Cards & Landlord Ledger

### 1. Dynamic Title Hierarchy
- **Single Tenancy or Initial State**: Display `"Your Tenancy"` (Singular).
- **Multiple Tenancies**: Display `"Your Tenancies"` (Plural).

### 2. Status Pill Badges
- **Overdue (`.status-overdue`)**: Background `#FEE2E2`, text `#DC2626`, border `1px solid #FECACA` (e.g., "Payment overdue - 3 days", "Billing overdue - 3 days").
- **Due Today (`.status-due-today`)**: Background `#FEF3C7`, text `#B45309`, border `1px solid #FDE68A` (e.g., "Due today", "Billing today").
- **Upcoming (`.status-upcoming`)**: Background `#E0F2FE`, text `#0284C7`, border `1px solid #BAE6FD` (e.g., "Billing in 5 days").
- **Metrics Badges**:
  - `No Past Dues`: Inline green checkmark SVG (`#16A34A`), weight 600.
  - Dues Alert: Red bold warning (`#DC2626`), e.g., "2 months due".

### 3. Card Action Button Architecture
- **Single Action Button (`.lavender-action`)**: Full-width pill (`height: 48px`, `#E8E7FB` background, `#5452EC` text, subtle border `rgba(84, 82, 236, 0.15)`). Used for "Record Payment" or "Generate Bill".
- **Dual Side-by-Side Action Buttons (`.dual-action-row`)**:
  - Left Button (`.peach-action`): Soft peach/coral background `#FFE4E6`, text `#E11D48`, document icon ("Generate Bill & Share", flex ratio 1.45).
  - Right Button (`.lavender-action`): Lavender background `#E8E7FB`, text `#5452EC`, cash icon ("Record", flex ratio 1).
  - 360px viewport guarantee: font-size scales to `12px - 12.5px`, padding `0 10px`, gap `8px`, zero wrapping.

### 4. Recent Activity: Segmented Ledger Switcher (Payments vs Bills)
- **Landlord Perspective Resolution**: Landlords require visibility into both collected cashflows and sent bills.
- **Segmented Control**: Pill toggle `[ Payments | Bills ]` placed right in the section header.
- **Recent Payments List**: Displays property name, payment method tag (`Paid Cash`, `Paid via Gpay`, `Paid via NEFT`), timestamp, formatted amount, and chevron `>`.
- **Recent Bills List**: Displays billing period (supports both Gregorian and Bikram Sambat BS calendar formats, e.g., "19 Chaitra 2082 - 26 Chaitra 2082"), generation date, amount, and chevron `>`.
- **Empty State & Typo Correction**:
  - Corrected Figma typo from *"you will see the here"* to *"you will see them here once they are marked as paid."*

### 5. Interactive Bottom Sheets / Modals
- **Record Payment Modal**: Quick bottom sheet allowing the landlord to select the tenancy, input the payment amount received, pick the payment mode (`Cash`, `GPay / UPI`, `Bank / NEFT`), select the date, and save.
- **Generate Bill & Share Modal**: Calculation preview showing base rent + electricity units + water + garbage, with instant one-tap "Send Invoice via WhatsApp" and "Copy Bill Summary" actions.

---

## 17. Tenancy Details & Month-Wise / Year-Wise Payment Status Architecture

### 1. Top Navigation & 3-Dots Action Menu
- **Back Navigation**: Left chevron arrow `←` returning directly to Dashboard (`Screen 6`).
- **Property Title**: Centered `18px` bold heading with text truncation guarantee.
- **3-Dots Options Menu (`⋮`)**:
  - Triggers floating dropdown card (`border-radius: 16px`, subtle border `#E2E4F2`, shadow `0 10px 30px rgba(14, 19, 38, 0.12)`).
  - Actions: `✏️ Edit`, `🗃️ Archive`, and `🗑️ Delete` (danger red text `#DC2626`).

### 2. Summary Overview Card
- Displays `Total Bill Paid` with dynamic count pill (`12 bills` or `0 bill`).
- Large amount display (`Rs. 68,148.16` or `Rs. 0.00` in `28px` ExtraBold `#0E1326`).
- Rent rate line (`Rs. 12,000 . Monthly`).
- Divider line with 2-column metrics: `Last Generated Bill` (hidden when 0 bills exist) and `Next Billing`.

### 3. Month-Wise / Year-Wise Payment Status Ledger (Landlord Enhancement)
- **Problem Resolved**: Standard ledger lists only show isolated transaction receipts; landlords cannot quickly identify which specific months are settled, skipped, or overdue.
- **Segmented Control**: Pill toggle switching between `[ Month-wise | History ]`.
- **Financial Year Picker**: Dropdown selector (`2082 BS (2025/26)` / `2081 BS (2024/25)`) with status summary chips:
  - `✔ 9 Paid` (Green chip: `#DCFCE7` bg, `#16A34A` text).
  - `⚠️ 2 Due` (Red chip: `#FEE2E2` bg, `#DC2626` text).
  - `⏳ 1 Next` (Blue chip: `#E0F2FE` bg, `#0284C7` text).
- **12-Month Card Stack**:
  - **Settled / Paid Months**: Left accent border `4px solid #16A34A`, month badge (`Falgun`, `Magh`, etc.), payment method tag (`Cash`, `GPay`, `NEFT`), and amount.
  - **Overdue / Pending Months**: Left accent border `4px solid #DC2626`, soft red gradient background, overdue warning caption (e.g. "3 days overdue"), amount in bold red, and status pill `Pending`.
  - **Upcoming Months**: Left accent border `4px solid #0284C7`, cycle countdown label, and status pill `⏳ Upcoming`.

### 4. Empty State Typo Correction (Frame 1)
- Corrected Figma typo from *"you will see the here once they are generated."* to *"you will see them here once they are generated."*

### 5. Sticky Bottom Action Bar
- Full-width `Generate New Bill` pill button (`54px` min height, zero shrink, vibrant purple gradient).

---

## 18. Edit Tenancy & Future Cycle Rent Revision Architecture

### 1. Landlord Business Logic & Historical Ledger Protection
- **The Financial Integrity Problem**: In rental management, naively editing a property's base rent value overwrites historical ledger calculations, breaking previous invoice records.
- **The Solution**: A landlord can either edit current tenancy details or explicitly schedule a **Rent Revision** starting from a designated future billing cycle (e.g. *1 Baisakh 2083 / May 2026*). Historical billing receipts remain 100% intact.

### 2. UI Components & Interaction Patterns
- **Header Navigation**: Back arrow `←` returning to Tenancy Details, centered title ("Edit Tenancy"), and subtitle with property name.
- **Revise Rent Action Button (`.btn-text-action`)**: Positioned directly on the field label row adjacent to "Rent Amount", featuring an upward trend line SVG icon and primary purple text.
- **Revise Rent Bottom Sheet (`#modal-revise-rent`)**:
  - Reference Current Rent (read-only card).
  - New Rent input field.
  - Effective Cycle Selector (`Next Cycle`, `In 2 Months`, `In 3 Months`, or `Custom Date`).
  - Revision Reason / Note field (e.g. "Annual 10% increment").
  - Tenant WhatsApp Notice toggle switch.
- **Scheduled Revision Banner (`.scheduled-revision-banner`)**:
  - Displays directly under the rent field with a blue info pill theme (`#EFF6FF` background, `#BFDBFE` border, `#1D4ED8` icon).
  - Displays scheduled amount, effective date, and a quick cancel button (`✕`).
- **Sticky Bottom Action Bar**:
  - Full-width `Save Changes` pill button (`height: 54px; min-height: 54px; flex-shrink: 0;`).

---

## 19. Dedicated Record Payment Page & Month Settlement Architecture (Screen 12)

### 1. Landlord Payment Settlement Problem & Solution
- **The Problem**: A basic quick modal only allows entering a raw number and payment mode without linking the cashflow to specific billing cycles. Landlords frequently deal with tenants paying for multiple overdue months simultaneously, paying partially, or paying in advance.
- **The Solution (Screen 12)**: A dedicated, full-screen **Record Payment** flow that intelligently detects whether the property has past overdue months or is up to date, providing specialized settlement workflows for each.

### 2. Dynamic Month Settlement Architecture (Pending vs Current)
- **State A: Pending Months Available (Manual Selection)**:
  - When the selected tenancy has arrears (e.g. *2nd Floor, Lalitpur* with 1 overdue cycle; *Ram’s Flat* with 2 overdue cycles):
    - Amber alert banner: `"Pending dues found. Select month(s) to settle:"`.
    - Interactive stack of month checkboxes (e.g. `Falgun 2082`, `Chaitra 2082`, `Baisakh 2083`).
    - Landlords can check single or multiple months manually to explicitly declare which cycles are cleared.
    - Status pills highlight overdue severity (e.g. `"Overdue 3 days • Rs. 12,034.12"`).
- **State B: No Pending Dues (Current Month Default + Advance Option)**:
  - When the tenant has zero past dues (e.g. *Apartment 11, Bhakatapur*):
    - Green checkmark banner: `"No past dues. Settling for Current Month:"`.
    - Defaults cleanly to the current billing cycle (`Baisakh 2083 / May 2026`) with a green `"Current"` badge.
    - Provides a `+ Settle for another month / Advance` toggle button.
    - Expanding reveals a select dropdown for future cycles (`Jestha 2083`, `Ashadh 2083`, `Shrawan 2083`) for advance rent collection.

### 3. Payment Mode & Sub-Channels
- **Split Selector**: Dual pill grid with `Cash` and `Online`.
- **Dynamic Online Sub-Fields**: Selecting `Online` reveals radio chips for `GPay / UPI`, `Bank / NEFT`, and `Other App`, plus an optional text input for transaction reference or UTR number.

### 4. Interactive Date Picker & Amount Shortcuts
- **Date Picker**: Dedicated picker box (`#recordDatePickerTrigger`) invoking the native calendar picker, displaying formatted human-friendly dates (`"Today, 17 Oct 2026"`).
- **Shortcut Amount Chips**: Quick pill buttons (`Full Due`, `Base Rent`, `Round Rs. 10,000`) allowing instant one-tap entry without typing.

### 5. Ledger Synchronization & Tenant Receipt
- Saving immediately prepends the transaction to the Dashboard's **Recent Payments** list with tenancy name, settled month tag, payment channel, and formatted currency.
- WhatsApp receipt toggle switch queues automated digital acknowledgment.
- Sticky bottom bar with full `54px` min-height `"Confirm & Save Receipt"` pill button and 360px viewport responsiveness.

---

## 20. Modal Lifecycle, Scoping & Universal Overlay Visibility Protocol (STRICT RULE)

### 1. The Root Cause of Stuck Modals
- When CSS specifies `.modal-overlay { display: flex; }`, dynamically toggling `.hidden` has **zero effect** unless `.hidden` is explicitly declared with `display: none !important;` and `.modal-overlay.hidden { display: none !important; pointer-events: none !important; visibility: hidden !important; }`. Without this, modals remain permanently rendered and block viewport interactivity.

### 2. Strict Architectural Rules for Modals
1. **DOM Scoping Inside Parent Screen**:
   - Every modal sheet MUST be nested inside its parent `<section class="screen">` container rather than floating loosely in `.screens-slider`. When a screen is inactive (`opacity: 0; pointer-events: none;`), its modals are guaranteed to be dormant.
2. **Universal Dismissal Vectors**:
   - Every modal MUST support four independent closure methods:
     1. Dedicated close button (`.modal-close-btn` with minimum 36px tap target, centered icon, hover/active scaling).
     2. Background overlay backdrop tap (tapping on `.modal-overlay` outside `.modal-sheet`).
     3. Sheet drag handle tap (`.modal-handle` cursor pointer).
     4. Keyboard `Escape` key.
3. **Screen Transition Auto-Cleanup**:
   - The screen navigator (`navigateToScreen`) MUST automatically dismiss all active `.modal-overlay` elements and floating menus whenever the user transitions between screens, preventing orphaned modals across views.

---

## 21. Bill Generation, Review, Invoice Details, Settings & Tenancy Archive Architecture (Screens 13 – 18)

### 1. Bill Generation Flow (Screen 13: "Generate Bill")
- **Context & Header**: Back arrow returning to Tenancy Details/Dashboard, title `"Generate Bill"`, subtitle with tenancy location (e.g., `for 2nd Floor, Lalitpur`).
- **Interactive Bill Duration Date Range**:
  - Twin date-pickers for `Start Date` and `End Date` in a 2-column layout.
  - Interactive calendar pickers with human-formatted dates (e.g. `5 Mar 2026` to `5 Apr 2026`).
- **Read-Only Meter Anchors**:
  - `Last Month's Electricity Reading` and `Last Month's Water Reading` rendered with disabled styling (`#ECEEF8` background, `#7D849B` text) to guarantee baseline integrity.
- **Dynamic Usage Inputs**:
  - `Current Electricity Reading` and `Current Water Reading` fields with auto-calculation listeners.
- **Optional Adjustments & Notes**:
  - `Advance Payment (if any)` (Optional) with instant deduction preview.
  - `Due Amount (if any)` (Optional) for carrying forward arrears.
  - `Notes` (Optional) multi-line textarea (`min-height: 84px`) for landlord remarks.
- **Sticky Bottom Action Bar**:
  - Full-width `Preview Bill` pill button (`54px` min height, zero shrink).

### 2. Bill Review (Screen 14: "Review Bill")
- **Header**: Back arrow returning to Screen 13, centered title `"Review Bill"`.
- **Tenancy Summary Card**:
  - Property title (`2nd Floor, Lalitpur`).
  - Two-column metadata: `Bill Duration` (e.g., `1 Falgun 2082 – 30 Falgun 2082`) and `Bill Generated On` (`1 Chaitra 2082`).
  - *Figma Glitch Fixed*: Resolved Figma artifact `"April, 2081 Falgun 2082 - 30 Falgun 2082"` to clean, standard Gregorian/BS formatted interval `"1 Falgun 2082 – 30 Falgun 2082"`.
- **Bill Breakdown Card**:
  - `Rent Amount` (`Rs. 12,000`).
  - `Electricity` calculation line with explicit sub-formula: `14187 - 13187 = 100 units @ 12/unit` -> `Rs. 1,200`.
  - Utility line items: `Internet` (`Rs. 500`), `Water` (`Rs. 500`), `Sewage` (`Rs. 500`).
  - `Total` subtotal line (`Rs. 14,700` bold navy).
  - `Advance Payment` deduction line (`- Rs. 1000` emphasized in red `#DC2626`).
  - `Net Payable` highlight row (`Rs. 13,700` bold `17px`).
  - `Notes` card reflecting remarks entered in generation form.
- **Sticky Bottom Action Bar**:
  - Full-width `Generate Bill` pill button (`54px` min height) that saves the invoice to state and prepends it to the recent bills list.

### 3. Final Bill Details & Invoice View (Screen 15: "Bill details")
- **Header Navigation & Document Action**:
  - Back arrow returning to Tenancy Details/Dashboard.
  - Centered title `"Bill details"`.
  - Document/share icon action in top right corner.
- **Figma Typo Correction**:
  - *Figma Bug*: Figma canvas displayed overlapping/corrupted text `"Bill breBill Breakdownakdown"`.
  - *Resolution*: Corrected to clean, crisp `"Bill Breakdown"` section title.
- **Invoice Breakdown**: Displays finalized verified calculation and settled breakdown.
- **Sticky Bottom Action Bar**:
  - Full-width `"Share Invoice via WhatsApp"` pill button (`54px` min height) triggering real-time invoice summary clipboard copy or direct WhatsApp web/app link.

### 4. Settings Screen (Screen 16: "Settings")
- **Header**: Back arrow returning to Dashboard, large title `"Settings"` (`28px` bold).
- **Primary Preferences Card**:
  - `Archived Tenancies`: Chevron navigation leading to Screen 17 with dynamic badge count.
  - `Haptics`: Emerald green interactive toggle switch (`#10B981` active state).
  - `Notifications`: Emerald green interactive toggle switch.
  - `Backup & Restore`: Chevron item triggering instant offline JSON data export download.
- **App Information & Support Card**:
  - `About The App`: App info modal trigger.
  - `Contact Support`: Landlord support email trigger.
  - `Report a Bug`: Feedback dialog trigger.
  - `Request Feature`: Feature wishlist trigger.
- **App Footer Branding**:
  - Version: `"Rental Buddy v1.0.0"`.
  - Attribution: `"Crafted using Vroxal Design"`.

### 5. Archived Tenancies (Screen 17: "Archived Tenancies")
- **Header**: Back arrow returning to Settings, title `"Archived Tenancies"`.
- **Figma Consistency Fix**:
  - Standardized header title across all screens to `"Archived Tenancies"` (fixing typo where one frame was titled "Archive Tenancies").
- **Empty State**:
  - Lavender rounded container (`60px × 60px`, `#E8E7FB`) with house icon.
  - Title: `"No archived tenancies"`.
  - Explanatory copy: *"Tenancies you archive will appear here. You can archive a tenancy from its details screen."*
- **Populated State**:
  - White card (`20px` radius) with `Archived` chip, relative timestamp (`"Archived 1 day ago"`, fixing typo `"Archive 1 day ago"`), property title (`"2nd Floor, Lalitpur"`), monthly rate, divider line, and 2-column metrics (`Last Bill Amount` and `Total Generated`).
  - Tapping card opens Screen 18 (Archived Tenancy Details).

### 6. Archived Tenancy Details (Screen 18)
- **Header**: Back arrow returning to Screen 17, centered property title, 3-dots menu button.
- **Landlord 3-Dots Action Menu**:
  - `Unarchive` action (restores the tenancy back to active status on Dashboard Screen 6).
  - `Delete` action (red text `#DC2626` with confirmation prompt).
- **Summary Overview Card**:
  - Displays `Total Bill Paid` (`Rs. 68,148.16`), monthly rate, `Last Generated Bill` (`Rs. 12,034.12`), and `Next Billing` (`1 Baisakh 2083`).
- **Rent Bill History**:
  - Stack of 5 settled bills with billing date intervals, generated dates, formatted amounts, and clickable chevron chevrons opening full bill details (Screen 15).

---

## 22. Backup & Restore Architecture (Screen 19)

### 1. Landlord Data Portability & Offline Sovereignty
- **Context & Purpose**: Rental records, tenant utility splits, and historical payments are sensitive financial records. Landlords require a simple, offline-first, vendor-independent backup and restoration mechanism that doesn't force third-party cloud lock-in.
- **The .rhb Format**: Dedicated proprietary JSON schema (`.rhb` = Rental Buddy Backup) containing schema versioning, export timestamps, tenancies with utility configurations, past dues, preferences, and payment ledgers.

### 2. UI Layout & Component Architecture
- **Header Navigation**:
  - Back arrow `←` returning directly to Settings (`Screen 16`), with large hero title `"Backup & Restore"` (`28px` bold).
- **Create Backup Action Card**:
  - White surface card (`24px` radius, `0 4px 18px rgba(28, 33, 66, 0.04)` shadow, subtle border `#E2E4F2`).
  - Title: `"Create Backup"` (`18px` bold).
  - Description: *"Exports all your tenancies and bills into a .rhb file. You can save it to Files, Google Drive, email it to yourself, or store it anywhere you prefer"*.
  - Action Button: Full-width primary purple pill button (`#5452EC`, `height: 54px; min-height: 54px; flex-shrink: 0;`), elevated depth (`0 8px 24px rgba(84, 82, 236, 0.35)`), server/drive icon + `"Create Backup"`.
  - Behavior: Instant in-browser generation and download of `rental-buddy-backup-[YYYY-MM-DD].rhb`.
- **Restore Action Card**:
  - Same white rounded card geometry.
  - Title: `"Restore"` (`18px` bold).
  - **Corrected Figma Typo**:
    - *Figma Glitch*: Read *"You current preferences will be kept."*
    - *Resolution*: Corrected to grammatical *"Your current preferences will be kept."*
  - Action Button: Full-width lavender pill button (`#D4D5F8` background, `#5452EC` text, `height: 54px; min-height: 54px; flex-shrink: 0;`), counter-clockwise restore arrow icon + `"Restore From Backup"`.
  - Behavior: Triggers hidden native file input (`accept=".rhb,.json"`), reads file with `FileReader`, parses and validates data structure, provides toast notification confirmation, and safely syncs state.

### 3. Responsive Guarantee (360px Viewport)
- On `<= 380px` viewports, card padding scales gracefully to `18px 16px`, gap to `14px`, and typography maintains crisp `text-wrap: balance;` with zero awkward line breaks or button crushing.

---

## 23. English Calendar Standardization, Supabase Auth (Screen 20), Family Sharing & Cloud Architecture Blueprint

### 1. 100% Gregorian / English Calendar Standardization
- **Universal Date Standard**:
  - Permanently cleansed all screens, cards, modals, mock data, and generators of the traditional Bikram Sambat (BS) calendar (e.g., *Chaitra*, *Falgun*, *2082 BS*).
  - Standardized entirely on the English / Gregorian calendar (`Jan – Dec 2026`) across:
    - Screen 6 Recent Bills (`1 Mar 2026 – 31 Mar 2026`, etc.).
    - Screen 10 Month-wise ledger (12-month English cards: `Apr 2026`, `Mar 2026`, `Feb 2026`, ..., `May 2026 Upcoming`).
    - Screen 11 Rent Revision date chips (`1 May 2026`, `1 June 2026`, `1 July 2026`).
    - Screen 12 Payment Settlement months (`March 2026`, `February 2026`, `April 2026`).
    - Screen 13 & 14 Billing intervals (`1 Mar 2026 – 31 Mar 2026`, `Generated on 1 Apr 2026`, `Next Billing: 1 May 2026`).

### 2. Screen 20: Supabase Cloud Authentication & Role-Based Access
- **Purpose**: Cloud-first user authentication using Supabase Auth (Email & Password).
- **Primary Role (Admin / Landlord)**:
  - Landlord logs in with their admin credentials (e.g. `admin@rentalbuddy.app`).
  - Holds full read/write privileges: creating/editing tenancies, revising rent, generating bills, settling payments, archiving/deleting properties, and managing family sharing permissions.
- **Secondary Role (Family Member / Viewer / Manager)**:
  - Family members log in using their own email addresses (e.g. `family@rentalbuddy.app`).
  - Permissions are governed by the `family_shares` table and Supabase Row Level Security (RLS).
  - Can view all property cards, month-wise payment ledgers, and download/share invoices; cannot delete tenancies or modify critical landlord configurations unless granted manager permissions.
- **Component Geometry & Visual Depth**:
  - Centered brand header with house icon and "Rental Buddy".
  - Quick role demo selector chips (`👑 Admin (Landlord)` vs `👨‍👩‍👧 Family Member`) for instant testability.
  - White surface input container (54px height, 16px radius) with password visibility toggle.
  - Primary full-width pill button (`54px` min-height, `#5452EC`, `0 8px 24px rgba(84, 82, 236, 0.35)` shadow).
  - Mode toggle: "Don't have an account? Sign Up" / "Already have an account? Sign In".

### 3. Family Sharing in Settings (Screen 16 & Scoped Modal)
- **Settings Integration**:
  - Added `Family Sharing` list item with an active count badge (e.g., `"1 Shared"`) under Account preferences.
  - Added Account Card displaying current logged-in user email with role badge and `"Sign Out"` action leading back to Screen 20.
- **Interactive Scoped Modal (`#modal-family-sharing`)**:
  - Displays list of active family members with status badges (`Admin / Owner`, `Family / Viewer`, `Manager`).
  - Invite form: Email input field + Role selector (`Viewer (Read Only)` vs `Manager (Record Payments)`).
  - Action buttons: `"Send Invite"` (queues invite in Supabase).
  - Member card actions: One-tap `"Revoke Access"` trigger.

### 4. Supabase Backend Architecture & AI Handover Protocol
- **Master Blueprint Artifact**: Complete specifications, PostgreSQL schemas, RLS policies, and module-by-module implementation steps are documented in `supabase_backend_architecture_handover.md`.
- **Database Schema (7 Core Tables)**:
  1. `profiles`: User IDs, full names, default currencies, role types.
  2. `tenancies`: Property names, tenant names, phones, base rents, advance deposits, billing recurrence day, status (`active`, `archived`).
  3. `tenancy_utilities`: Utility types (`electricity`, `water`, `internet`, `sewage`, `garbage`), bill types (`meter_reading`, `flat`), rates, last readings.
  4. `rent_revisions`: Tenancy ID, old rent, new rent, effective date, note, status (`scheduled`, `applied`, `cancelled`).
  5. `bills`: Invoice numbers, duration start/end, rent amount, utility breakdowns (JSONB), advance applied, net payable, payment status (`unpaid`, `partially_paid`, `paid`).
  6. `payments`: Amount, payment mode (`cash`, `online`), channel (`upi`, `bank`, `neft`), reference number, settlement months (ARRAY/JSONB), payment date.
  7. `family_shares`: Admin user ID, member email, member user ID, permission role (`viewer`, `manager`), status (`pending`, `accepted`, `revoked`).
- **Row Level Security (RLS)**:
  - Enforces `has_family_access(tenancy_id, auth.uid())` so family members only see properties shared with them.
- **Token-Safe Sequential Implementation**:
  - Backend integration must be performed in sequential modules (Module 1: Auth & Profiles -> Module 2: Tenancies CRUD -> Module 3: Utilities & Revisions -> Module 4: Bills Engine -> Module 5: Payments & Month Settlement -> Module 6: Family Sharing & Realtime) so AI models never run out of tokens.

---

## 24. Production Hardening: Aesthetic Invariants, Financial Risk Guardrails & Live Supabase Cloud Provisioning

### 1. Strict List Item & Icon Aesthetic Invariants
- **Icon Color Uniformity**:
  - All standard navigation, settings, drawer, and list item icons MUST use `var(--text-heading)` (`#0E1326`, deep dark navy slate / black) or inherit `currentColor`.
  - Under no circumstances should individual list item icons (such as Family Sharing or Account) use ad-hoc primary purple/blue (`#5452EC`) or custom tints.
- **Single-Line List Clarity & Elimination of Clutter Subtitles**:
  - Preference rows (Settings Screen 16, Menu dropdowns) MUST remain strictly single-line items.
  - Never add arbitrary multi-line descriptive text (e.g. *"Invite members to view properties"*) beneath list labels.
  - Status indicators must use compact pill badges (`.badge-pill`) placed cleanly to the left of the navigation chevron.

### 2. Live Supabase Cloud Provisioning
- **Project Name**: `Rental-Buddy-Cloud`
- **Project Ref / ID**: `hxflqcvhtkfpjjkociaq`
- **Region**: `ap-south-1` (Mumbai)
- **Status**: `ACTIVE_HEALTHY`
- **Database Schema**: 7 core tables (`profiles`, `tenancies`, `tenancy_utilities`, `rent_revisions`, `bills`, `payments`, `family_shares`) created with full Row Level Security (RLS) policies and security-definer helper functions.
- **SDK Integration**: Integrated `@supabase/supabase-js` via `src/supabase.js`, wired directly into app controllers (`main.js`) with resilient offline fallback.

### 3. Financial Loss & Data Integrity Guardrails
- **Meter Reading Anomaly Protection**:
  - Current meter reading cannot be lower than previous meter reading. Attempts to enter a lower reading trigger a defensive toast alert, preventing inverted/negative bill computations.
- **Advance Over-Deduction Protection**:
  - Advance deduction is strictly clamped to `min(advance, subtotal)`, preventing negative net payable totals and advance balance corruption.
- **Safe State Transitions**:
  - Screen transitions automatically dismiss all active modals and floating menus, preventing orphaned or unclickable UI states.

---

## 25. Production Readiness: Zero-Demo Data Baseline, Strict Auth Guard & Supabase Admin Lifecycle

### 1. Zero-Demo Data Baseline (Mandatory Production Standard)
- **Purge of Prototype Data**:
  - All mock properties (`2nd Floor, Lalitpur`, `Ram's Flat`, `Apartment 11, Bhakatapur`), static bill rows, and fake payment ledgers are permanently purged from HTML templates and JS controller code.
  - Form fields across all screens (Step 1 Tenancy, Step 2 Utilities, Edit Tenancy, Record Payment, Bill Generation) initialize empty with clean placeholders.
  - When a user logs in for the first time, the application displays clean empty states (`#dashboard-empty-tenancies`, `#empty-recent-payments`, `#empty-recent-bills`, `#archived-empty-state`).
  - All records rendered in the app are strictly loaded live from the user's Supabase Cloud database.

### 2. Strict Production Auth Guard
- **Unauthenticated Route Protection**:
  - The application strictly bars unauthenticated access to inner screens (Screens 6 through 19).
  - On application boot (`DOMContentLoaded`), the app checks for an active session via `supabase.auth.getSession()`.
  - If no session exists, the app immediately redirects to **Screen 20 (Authentication / Sign In / Create Account)**.
  - Any programmatic navigation attempt to Screens 6–19 without authentication triggers a defensive redirect to Screen 20 with an informative alert toast.

### 3. Landlord Admin Registration Lifecycle
- **How Admin Credentials Work**:
  - Admin login credentials are NOT hardcoded or pre-set by developers.
  - The landlord registers their own real email and secure password directly through the app's Screen 20 ("Create Account" mode).
  - Calling `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` creates the user account in Supabase Auth (`auth.users`) and establishes a corresponding record in `public.profiles`.
  - The first registered user operates as the Owner/Admin with full privileges.
  - All tenancies created by the landlord are tied to their unique `owner_id = auth.uid()` under Row Level Security (RLS).
  - When family members are invited via Settings Screen 16, they log in with their own email addresses and receive scoped viewer or manager permissions.

---

## 26. Tab Mutual Exclusivity, 12-Month Calendar Ledger, Email Verification & Account Deletion Protocol

### 1. Dashboard Recent Activity: Mutual Exclusivity Guarantee (Screenshot 1 Fix)
- **The Bug**: Previously, `syncDashboardFromCloud()` unhid both `#empty-recent-payments` and `#empty-recent-bills` simultaneously when both collections were empty, causing dual stacked empty cards on screen.
- **The Architectural Fix**:
  - Created centralized `renderRecentActivityView(activeTab)` controller.
  - When viewing `payments`: `#empty-recent-bills` and `#list-recent-bills` are strictly hidden; only the payments list or payments empty state can be displayed.
  - When viewing `bills`: `#empty-recent-payments` and `#list-recent-payments` are strictly hidden; only the bills list or bills empty state can be displayed.
  - Zero possibility of dual empty states coexisting on screen.

### 2. Tenancy Details Month-Wise 12-Month Calendar Stack (Screenshot 2 Fix)
- **The Bug**: On Screen 10, when viewing `Payment Status [Month-wise | History]`, a newly created tenancy with 0 recorded payments emptied the month stack and displayed `No bills or payments yet` over the Month-wise view.
- **The Architectural Fix**:
  - The Month-wise view is designed to track 12 billing cycles across the financial year (`Jan–Dec 2026`).
  - `bindTenancyToDetails(t)` dynamically populates `#details-month-cards-stack` with all 12 calendar months:
    - Settled months: `month-card month-paid` with checkmark, green pill, settled date.
    - Due/unpaid bills: `month-card month-due` with red due pill and invoice total.
    - Current/next billing cycle: `month-card month-upcoming` with `⏳ Next` badge and property rent.
    - Future cycles: `month-card month-future` with `Upcoming` badge and scheduled cycle date.
    - Summary counter chips (`✔ X Paid`, `⚠️ Y Due`, `⏳ Z Next`) update dynamically.
  - `#details-empty-bills` is strictly segregated to the `History` tab when 0 payment transactions exist, and NEVER covers the Month-wise calendar view.

### 3. Tenancy Details 3-Dots Menu Listener Deduplication (Screenshot 3 Fix)
- **The Bug**: `initTenancyDetails()` was registered twice (in `initEventListeners()` and `DOMContentLoaded`), causing clicking the 3-dots button to toggle `.hidden` twice simultaneously, instantly closing the dropdown. Additionally, clicking SVG child elements caused document click listeners to falsely identify the event as an outside click.
- **The Architectural Fix**:
  - Deduplicated `initTenancyDetails()` so it registers exactly once during application boot.
  - Menu button click stops event propagation (`e.stopPropagation()`).
  - Outside-click dismiss checks `!menuBtn.contains(e.target)` to safely handle SVG child elements.
  - Added elevated z-index (`.floating-action-menu { z-index: 1000 !important; }`).

### 4. Account Creation Email Verification Gatekeeper & Confirmatory Screen
- **The Security & UX Problem**: When users created an account, unverified users were previously redirected straight into the app without a persisted Supabase session token, causing an abrupt logout on page refresh.
- **The Fix**:
  - `signUpUser()` checks if email confirmation is required (`needsEmailConfirmation: !data.session`).
  - App displays `#auth-confirm-box` inside `#screen-20`:
    - Clean emerald verification checkmark icon.
    - Title: "Account Created!"
    - Displays user's registered email with prominent styling.
    - Explains that a verification link was sent, advising users to check inbox and spam/junk folders.
    - "Proceed to Sign In" button: seamlessly restores Sign In form with email pre-filled.
    - "Resend Email" button: triggers `resendVerificationEmail(email)` with immediate toast feedback.
  - The app strictly prevents entry until the user verifies their email and signs in.

### 5. Session Persistence & Zero-Flicker Boot Protocol
- **Zero-Flicker Boot**:
  - Removed initial `.active` class from `#screen-1` in `index.html`.
  - Added full-frame `#app-splash-screen` (`z-index: 9999`) with clean brand logo and CSS spinner.
  - Screen 1 never flashes on page reload or app launch.
- **Session Persistence**:
  - Subscribed to `supabase.auth.onAuthStateChange` (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`) to sync session state across tabs and prevent automatic logouts.
  - Supabase client configured with `persistSession: true, autoRefreshToken: true, detectSessionInUrl: true`.

### 6. Functional First-Time Onboarding
- **The Flow**:
  - Returning users who have already set up their profile go straight to Screen 6 (Dashboard).
  - First-time users logging in after email verification are guided through functional onboarding:
    - Screen 2: Choose Currency (stores preference in user profile).
    - Screen 4: Notification preferences.
    - Screen 5 / Screen 6: Finalizes setup, writes `onboarding_completed: true` to Supabase `profiles` and localStorage.

### 7. Danger Zone: Complete Account & Cloud Data Deletion (Including auth.users)
- **Location**: Settings (Screen 16) -> Danger Zone.
- **Components**: `#item-delete-account` and `#modal-delete-account`.
- **Database Function**: `delete_user_account()` PostgreSQL `SECURITY DEFINER` RPC:
  - Deletes all payments, bills, utilities, rent revisions, and tenancies owned by `auth.uid()`.
  - Deletes all family shares and profile records.
  - **Account Eradication**: Deletes the user account directly from `auth.users` (`DELETE FROM auth.users WHERE id = auth.uid()`).
- **Post-Deletion Lifecycle**:
  - The client signs out and clears `localStorage` and `sessionStorage`.
  - The app routes to Screen 20 in **Create Account** mode (`setAuthMode(true)`).
  - Attempting to sign in with the deleted credentials will fail as "Invalid login credentials"; the user must register a brand new account.









