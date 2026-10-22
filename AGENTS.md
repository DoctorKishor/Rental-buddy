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

---

## 27. Autonomous Full-App Audit & Multi-Screen Architectural Defect Resolution

### 1. Screen 14 & 15 Element ID Synchronization & Bill Inspection Controller
- **The Defect**:
  - In `Screen 14 (Review Bill)`, JavaScript referenced `#review-prop-name` and `#review-billing-period`, while the DOM IDs were `#review-prop-title` and `#review-duration-text`. This resulted in the tenancy title and billing duration displaying placeholder values `--`.
  - In `Screen 15 (Bill Details)`, JavaScript attempted to populate nonexistent IDs (`#billdetails-prop-title`, `#billdetails-invoice-no`, `#billdetails-net-amount`), leaving all 11 breakdown fields unpopulated.
  - Tapping on generated invoices in Dashboard Recent Activity opened Screen 15 without binding invoice records.
- **The Architectural Fix**:
  - Synchronized all element IDs on Screen 14 (`#review-prop-title`, `#review-duration-text`, `#review-generated-date`, `#review-water-val`).
  - Created centralized `renderBillDetails(billData)` controller binding all 11 metrics (`#details-bill-prop-title`, `#details-bill-duration`, `#details-bill-gendate`, `#details-bill-rent-val`, `#details-bill-elec-sub`, `#details-bill-elec-val`, `#details-bill-water-val`, `#details-bill-subtotal-val`, `#details-bill-advance-val`, `#details-bill-net-val`, `#details-bill-notes-text`).
  - Recent bills list rows invoke `renderBillDetails(bill)` on click to preview any invoice.
  - Added formatted WhatsApp invoice link generator and clipboard copier to `#btn-share-whatsapp-invoice`.

### 2. Universal Form Submit Hijacking & State Protection
- **The Defect**:
  - 6 form stacks (`#form-record-payment`, `#form-step1`, `#form-edit-tenancy`, `#form-revise-rent`, `#form-record-page`, `#form-generate-bill`) lacked submit handlers. Pressing 'Enter' or mobile virtual keyboard 'Done' caused browser form submissions that reloaded the page, wiping in-progress inputs.
- **The Architectural Fix**:
  - Implemented universal `form` submit interception in `initEventListeners()` with `e.preventDefault()`.

### 3. Step 1 & Step 2 to Step 3 Confirmation & Utility Cloud Persistence
- **The Defect**:
  - Navigating from Step 2 to Step 3 did not invoke `syncConfirmationScreen()`, causing Step 3 to show stale placeholder data.
  - Submitting Step 3 omitted the `utilities` payload from `createCloudTenancy()`, failing to save user-configured utility pricing to Supabase.
- **The Architectural Fix**:
  - Dynamically invokes `syncConfirmationScreen()` upon clicking `#btn-step2-next`.
  - Step 3 confirmation collects user-configured utilities (Electricity, Water, Garbage, Internet) into a structured array and persists them to `tenancy_utilities` via `createCloudTenancy()`.

### 4. Interactive 12-Month Calendar Cards & Action Routing
- **The Enhancement**:
  - Overdue month cards (`month-due`) now feature pointer actions opening `#screen-12` (`openRecordPaymentPage(t)`) directly for that tenancy.
  - Current/Next cycle cards (`month-upcoming`) feature pointer actions opening `#screen-13` (`setupGenerateBillScreen(t)`) to generate a bill for the tenancy.
  - Tenancy details "Generate New Bill" button invokes `setupGenerateBillScreen(currentActiveTenancy)`.

### 5. Recurring Billing Day Persistence on Edit Tenancy
- **The Defect**:
  - Editing a tenancy on Screen 11 updated name, rent, phone, and advance, but omitted `billing_day`, causing changes to the recurring billing day to be lost.
- **The Architectural Fix**:
  - `#btn-save-tenancy-changes` extracts `updatedDay` from the date picker and includes `billing_day` in `updateCloudTenancy()`.

### 6. Pre-Populated Date Pickers & Archived Metrics
- **The Fix**:
  - `#screen-12` (Record Payment) and `#screen-13` (Generate Bill) initialize with human-readable current cycle dates rather than empty text boxes.
  - `openArchivedDetails()` calculates and displays `#archdetails-total-amount`, `#archdetails-last-bill`, and `#archdetails-next-bill`.
  - Added `#btn-auth-back` on Screen 20 allowing authenticated users to return to Dashboard.

---

## 28. Comprehensive Full-App Autonomous Audit & Runtime Resiliency Hardening

### 1. Scope Hoisting: `getOrdinal` ReferenceError Eradication
- **The Root Cause**: `getOrdinal(n)` was scoped locally inside `initStep1Form()`. When `bindTenancyToDetails()` on Screen 10 executed lines 1173 (`${t.billing_day}${getOrdinal(...)}`), 1187, 1316, and Screen 11 executed line 1668, a silent runtime `ReferenceError: getOrdinal is not defined` crashed tenancy detail rendering.
- **The Architectural Fix**:
  - Exported and hoisted `getOrdinal(n)` to the module scope in `src/main.js`.
  - Completely restores dynamic ordinal billing date labels (`1st of next month`, `12th of every month`) across Tenancy Details, Month-wise calendar cards, and Edit Tenancy forms.

### 2. Tab Mutual Exclusivity: `viewHistory` Reference Resolution
- **The Root Cause**: In `bindTenancyToDetails()`, the element reference was declared as `historyList`, but the tab visibility switcher at lines 1378, 1383, and 1386 referenced an undeclared `viewHistory` variable, throwing a runtime `ReferenceError`.
- **The Architectural Fix**:
  - Standardized `const viewHistory = document.getElementById('view-bill-history');` and aliased `const historyList = viewHistory;`.
  - Guarantees seamless switching between Month-wise payment status cards and historical bill lists without silent catch block suppression.

### 3. Rent Revision Cancellation: Tenancy ID vs Revision ID Reconciliation
- **The Root Cause**: In `main.js`, clicking "Cancel Scheduled Revision" called `cancelCloudRentRevision(currentActiveTenancy.id)`, passing the tenancy's UUID. However, `supabase.js` executed `.eq('id', revisionId)`, which looked for a revision with that primary key, resulting in 0 rows updated in Supabase.
- **The Architectural Fix**:
  - Upgraded `cancelCloudRentRevision(idOrTenancyId)` in `src/supabase.js` to cancel scheduled records via `.or('id.eq.${idOrTenancyId},tenancy_id.eq.${idOrTenancyId}').eq('status', 'scheduled')`.
  - Ensures scheduled rent revisions can be safely and reliably cancelled by either revision ID or tenancy ID.

### 4. Supabase Bills Engine: Cloud Session Guard
- **The Root Cause**: `fetchCloudBills(tenancyId)` queried Supabase without preceding with `await ensureAuthenticated()`, risking unauthenticated queries or empty result returns under slow token refreshes.
- **The Architectural Fix**:
  - Added `await ensureAuthenticated();` at the beginning of `fetchCloudBills()` to match the hardened patterns in `fetchCloudTenancies()`, `fetchCloudPayments()`, and `fetchCloudFamilyMembers()`.

### 5. Zero-Demo Data Baseline & Form Hygiene (Section 25 Enforcement)
- **The Root Cause**: Residual prototype values and options were still embedded in `index.html` and fallback values in `src/main.js`:
  - Prototype tenancy names (`2nd Floor, Lalitpur`, `Ram's Flat`, `Apartment 11, Bhakatapur`) were hardcoded inside `#record-select-tenancy`.
  - Screen 8 utilities contained hardcoded `value="..."` attributes (`value="12"`, `value="12341.12"`, `value="500"`, `value="300"`, etc.).
  - Step 3 confirmation card displayed hardcoded mock values (`2nd Floor, Lalitpur`, `Rs. 12,000`).
  - Screen 11 edit inputs and Screen 13 subtitles had static prototype strings.
  - Step 1 date picker defaulted to prototype date `2026-04-12`.
- **The Architectural Fix**:
  - Purged all hardcoded `value="..."` attributes from Step 2 utility inputs, retaining clear placeholder hints.
  - Initialized `#record-select-tenancy` with a clean disabled `<option value="" disabled selected>Select a tenancy...</option>`.
  - Cleaned all Screen 9 confirmation card defaults to `--` and `Rs. 0`.
  - Updated `initStep1Form()` to dynamically default to the current billing cycle date.

### 6. Utility Pipeline Completion: Internet Utility Confirmation
- **The Enhancement**:
  - Added `#confirm-block-internet` and `#confirm-internet-amount` to Screen 9 in `index.html`.
  - Integrated Internet utility visibility and formatted price binding into `syncConfirmationScreen()` in `src/main.js`, completing the 4-utility confirmation pipeline (Electricity, Water, Garbage, Internet).

### 7. Navigation Flow: Contextual Back Navigation from Screens 12 & 13
- **The Enhancement**:
  - Implemented `state.previousScreen` tracking in `navigateToScreen()`.
---

## 29. Full-App Autonomous Sweep & Anti-Dead-Click Hardening

### 1. Create Tenancy Form Reset Protocol (`resetCreateTenancyForm`)
- **The Defect**:
  - After creating a tenancy or navigating to add a new property, previously inputted fields (`input-tenancy-name`, `input-rent-amount`, `input-advance-amount`, `input-phone-number`, and utility inputs) remained populated with the previous tenant's private data.
- **The Architectural Fix**:
  - Implemented `resetCreateTenancyForm()` in `src/main.js` and wired it into `#btn-empty-create`, `#btn-dashboard-add`, `#btn-create-tenancy`, and upon successful creation in `#btn-step3-confirm`.

### 2. Responsive Ledger Interaction (Anti-Dead-Click Enforcement)
- **The Defect**:
  - Recent payment items on the Dashboard (`listPayments`) and historical payment rows on Tenancy Details (`historyList`) possessed `role="button"`, `tabindex="0"`, and chevron icons, but lacked click listeners, leaving them unresponsive to user taps.
- **The Architectural Fix**:
  - Attached interactive click handlers:
    - Dashboard payment cards look up the associated property and navigate directly to its Tenancy Details (`#screen-10`), allowing instant inspection of the complete ledger.
    - Tenancy Details History items display a formatted receipt summary toast.

### 3. Dynamic Overdue Bill Calculation on Screen 12 (Dedicated Record Payment)
- **The Defect**:
  - On Screen 12, when a tenancy had overdue unpaid invoices, `#record-page-amount` defaulted to base rent rather than the actual overdue invoice balance. Toggling checkboxes in the overdue cycle list did not update the payment amount.
- **The Architectural Fix**:
  - In `setupRecordPaymentForm()`, when unpaid bills exist, the payment field initializes to the first overdue bill's `net_payable`.
  - Added dynamic `recalculateDueAmount()` that computes the exact sum of all checked overdue cycles in real-time as checkboxes are selected or unselected.

### 4. Universal Floating Action Menu & Modal Auto-Dismissal
- **The Defect**:
  - In `navigateToScreen()`, only `#details-menu-dropdown` was hidden, leaving `#archdetails-menu-dropdown` or any other action menus visible across screen transitions.
- **The Architectural Fix**:
  - Updated `navigateToScreen()` to dismiss all `.floating-action-menu` dropdowns simultaneously.

### 5. Archived Tenancies Automatic Cloud Synchronization
- **The Defect**:
  - Navigating to `#screen-17` via back buttons or routing did not automatically fetch the latest archived tenancies if state had changed.
- **The Architectural Fix**:
  - `navigateToScreen()` detects `targetScreenNumber === 17` and immediately triggers `loadArchivedTenancies()`.

### 6. Native `.rhb` Backup Cloud Restoration
- **The Defect**:
  - Selecting a `.rhb` backup file on Screen 19 verified JSON structure, but did not persist restored tenancies into Supabase.
- **The Architectural Fix**:
  - Integrated cloud persistence in `initBackupRestoreScreen()`: iterates through backup tenancies, safely inserts missing records into Supabase via `createCloudTenancy()`, and triggers a fresh dashboard sync.

### 7. Secure Signout State & DOM Clearance
- **The Defect**:
  - Signing out of Supabase kept in-memory arrays (`cloudTenanciesList`, `cloudBillsList`, `cloudPaymentsList`) and rendered card DOM elements populated until page refresh.
- **The Architectural Fix**:
  - Updated `#btn-settings-logout` listener to clear all in-memory lists, empty `#tenancies-list-wrapper`, and reset empty state indicators upon signout.

---

## 30. Deep Multi-Cycle Audit, Date Target Accessibility & Cloud Resiliency

### 1. Multi-Bill Settlement Ordering Resolution (`recordCloudPayment`)
- **The Defect**:
  - In `src/supabase.js`, `recordCloudPayment()` evaluated `if (paymentData.billId)` before `else if (paymentData.settledBillIds)`. When a tenant settled multiple overdue invoices at once, `billId` (`settledBillIds[0]`) was present, causing the code to take the first branch and settle only one bill while skipping the remaining invoices.
- **The Architectural Fix**:
  - Re-ordered the conditional checks to evaluate `paymentData.settledBillIds` first via `.in('id', paymentData.settledBillIds)`.
  - Guarantees all checked overdue months are completely marked `'paid'` in Supabase in a single atomic database operation.

### 2. Universal Date Picker Tap Target Expansion
- **The Defect**:
  - Across 4 distinct screens (Screen 7 Step 1, Screen 11 Edit Tenancy, Screen 12 Record Payment, Screen 13 Generate Bill), only the narrow trailing calendar icon buttons had click handlers attached. Tapping on the large date display box did not trigger the date picker.
- **The Architectural Fix**:
  - Standardized unified picker trigger handlers attached to both the text display box (`textDateInput`, `dateDisplay`, `startDisplay`, `endDisplay`) and the trailing icon buttons across all 4 forms.
  - Added `isNaN` validation in `initEditTenancy()` to guarantee clean date string formatting.

### 3. Automatic Past Due Carried Forward in Bill Generation
- **The Enhancement**:
  - In `setupGenerateBillScreen()`, the system scans `cloudBillsList` for any existing unpaid bills belonging to the target tenancy.
  - Automatically calculates total outstanding arrears and pre-populates `#input-bill-due` (Due Carried Forward), streamlining billing cycle workflows for landlords.

### 4. Archived Bill History Invoice Inspector
- **The Enhancement**:
  - Attached interactive click listeners to archived bill cards in `openArchivedDetails()`.
  - Tapping any archived bill immediately loads its breakdown in `#screen-15` (`renderBillDetails()`), allowing landlords to review historical line-item utility costs.
  - Configured `#btn-billdetails-back` to return contextually to Screen 18 when navigating from an archived property.

### 5. Resilient Family Sharing Counter & List Cleanup
- **The Defect**:
  - In `syncDashboardFromCloud()`, when family members reached 0 or all were revoked, `#family-members-list` dynamic rows were not cleared and `#badge-family-count` retained stale counts.
- **The Architectural Fix**:
  - Hardened `membersList` cleanup logic to remove dynamic rows and reset badge count to `"0 Shared"`.
  - Added instant counter decrement and error notifications when revoking family members.

### 6. Additional Notes Reset Hygiene
- **The Fix**:
  - Included `#input-additional-notes` in `resetCreateTenancyForm()`, ensuring Step 2 custom notes never persist across tenancy creation cycles.

---

## 31. Rent-Only Tenancy Architecture & Utility-Conditional UI Enforcement

### 1. The Architectural Problem
- In standard rental setups, landlords frequently rent out rooms or flats where rent is strictly all-inclusive (no separate electricity, water, or meter readings).
- Displaying "Generate Bill", meter reading prompts, or utility invoices for rent-only tenants adds unnecessary cognitive friction, creates user confusion, and exposes non-applicable features.

### 2. Utility Presence Detection (`tenancyHasUtilities`)
- **Deterministic Evaluation**:
  - A tenancy is classified as having utilities if and only if `t.tenancy_utilities` contains at least one utility with `is_enabled === true` (or active rate/flat amount).
  - If a landlord disables all utilities during Step 2 of Tenancy Creation or toggles off all utilities in Edit Tenancy, the tenancy is strictly classified as **Rent-Only**.

### 3. Dashboard UI Conditional Branching (Screen 6)
- **Tenancy Cards**:
  - **Tenancy With Utilities**:
    - Header badge: `Active • Utilities Included`.
    - Metric row: Displays "Billing Date".
    - Action row: Dual buttons (`dual-action-row`) showing `Generate Bill` (.peach-action) and `Record Payment` (.lavender-action).
  - **Rent-Only Tenancy**:
    - Header badge: `Active • Rent Only` (lavender background `#E8E7FB`, primary indigo text `#5452EC`).
    - Metric row: Displays "Rent Due Date".
    - Action row: Single full-width pill button (`Record Payment`, zero shrink, `height: 48px`).
    - The "Generate Bill" button is completely suppressed.

### 4. Tenancy Details Dynamic Adaptation (Screen 10)
- **Summary Metrics**:
  - Header sublabel switches dynamically between `Total Bill Paid` and `Total Rent Paid`.
  - Paid count badge reflects `X payments` rather than `X bills`.
  - Next billing metric column adapts label to `Next Rent Due`.
  - `Last Generated Bill` column remains permanently hidden for rent-only properties.
- **Sticky Bottom Action Button**:
  - For tenancies with utilities: Displays `Generate New Bill` and navigates to Screen 13.
  - For rent-only tenancies: Displays `Record Payment` and directly launches Screen 12 (`openRecordPaymentPage`), entirely bypassing bill generation.
- **Month-Wise 12-Month Ledger Stack**:
  - Current cycle card displays "Rent due • Click to pay" with pill `⏳ Due` (instead of "Next billing • Click to generate").
  - Past overdue months automatically detect unpaid rent after tenancy start and display "Rent overdue • Click to pay" with pill `⚠️ Due`.
  - Clicking any due month directly opens Screen 12 to settle rent.

### 5. Multi-Layer Screen 13 (Generate Bill) Access Guard
- If a user navigates to Screen 13 via direct deep-link or hash while an active rent-only tenancy is selected:
  - The navigator immediately halts bill generation.
  - Displays a toast: *"ℹ️ '{Property}' is a rent-only tenancy. Use 'Record Payment' to record rent."*
  - Automatically redirects the user to Screen 12 (Record Payment).

### 6. Dedicated Record Payment Support for Rent-Only Dues (Screen 12)
- For rent-only tenancies with past unpaid months, `blockPending` dynamically generates checkboxes for each overdue rent month (e.g. *August 2026 • Rs. 15,000*), enabling multi-month rent settlement without requiring invoice generation.

---

## 32. Tenancy Lifecycle Deletion/Archiving, Ordinal String Hygiene, Dynamic Financial Year Switching & Onboarding Tour Streamlining

### 1. Cascade Deletion & Instant UI Removal Resolution (`deleteCloudTenancy` & `archiveCloudTenancy`)
- **The Defect**:
  - In `src/supabase.js`, `deleteCloudTenancy()` attempted to delete directly from `tenancies`. If a tenancy had associated records in `payments`, `bills`, `tenancy_utilities`, or `rent_revisions`, PostgreSQL raised a foreign key constraint violation.
  - The UI caught the error but prematurely executed an unawaited `setTimeout(() => navigateToScreen(6), 600)`, leaving the tenancy active and visible on screen until hard page reload.
- **The Architectural Fix**:
  - `deleteCloudTenancy()` now cascades deletes through child foreign-key tables (`payments`, `bills`, `tenancy_utilities`, `rent_revisions`) before removing the tenancy from `tenancies`.
  - In `src/main.js`, `actionArchive` and `actionDelete` immediately remove the target tenancy from in-memory `cloudTenanciesList`, nullify `currentActiveTenancy`, await `syncDashboardFromCloud()`, and transition to Screen 6 only upon confirmed completion.

### 2. Ordinal String Concatenation Fix (`getOrdinal` vs `getOrdinalSuffix`)
- **The Defect**:
  - `getOrdinal(n)` returned the formatted string with the number already attached (e.g. `"10th"`).
  - Several templates throughout the app concatenated the day with `getOrdinal(day)` (e.g. `${day}${getOrdinal(day)}`), producing erroneous strings like `"1010th of every month"` and `"1010th of next month"`.
- **The Architectural Fix**:
  - Separated `getOrdinalSuffix(n)` (returning purely `'st'`, `'nd'`, `'rd'`, `'th'`) from `getOrdinal(n)` (returning `${n}${suffix}`).
  - Updated all template strings across Screen 10 (Tenancy Details), Screen 11 (Edit Tenancy), and Screen 7 (Step 1) to use `getOrdinal(day)` directly without duplicate day prefixes.

### 3. Dynamic Financial Year Ledger Switching
- **The Defect**:
  - Changing the year dropdown (`#details-year-select`) on Screen 10 between `Year 2026` and `Year 2025` only updated the text badge and displayed a toast; the 12-month stack was hardcoded to 2026 and did not re-render.
- **The Architectural Fix**:
  - Parameterized `bindTenancyToDetails(t, targetYear = null)`.
  - When `#details-year-select` changes, it immediately invokes `bindTenancyToDetails(currentActiveTenancy, selectedYear)`.
  - The 12-month card generator evaluates payment settlements and bill records specifically for the chosen calendar year, correctly displaying historical, overdue, or scheduled cycles.

### 4. Screen 5 Onboarding Tour Streamlining
- **The Enhancement**:
  - Removed the redundant `Replay Tour` button from Screen 5, leaving a single, full-width `Go to Dashboard` primary pill button for a crisp, frictionless onboarding completion experience.

---

## 33. Responsive Settings Layout Preservation, Yearly/Monthly Dynamic Dates, Utility-Scoping in Billing & Confirmation Placement

### 1. Settings Flex-Shrink Clipping Resolution (Screen 16)
- **The Defect**:
  - In `src/style.css`, `.settings-group-card` lacked `flex-shrink: 0;` and had `overflow: hidden;`.
  - When rendered in mobile screen containers with fixed or viewport height, flexbox squashed the cards, completely clipping and hiding "Family Sharing" in Card 1 and "Request Feature" in Card 2 under overlapping bottom cards.
- **The Architectural Fix**:
  - Added `flex-shrink: 0;` to `.settings-group-card` and `.settings-footer`.
  - Guarantees settings cards never collapse or clip child options, enabling smooth, unconstrained vertical scrolling across all mobile screen sizes.

### 2. Dynamic Billing Date Synchronization for Yearly vs Monthly Cycles
- **The Enhancement**:
  - In Screen 7 (Step 1) and Screen 11 (Edit Tenancy), selecting between **Monthly** and **Yearly** dynamically updates both the label and the formatted date string:
    - **Monthly**: Label is *"Recurring Billing Date (date of the month)"* and value displays *"15th of every month"*.
    - **Yearly**: Label adapts to *"Recurring Billing Date (day & month of every year)"* and value displays *"15th April of every year"*.
  - Fixed Edit Tenancy cycle options by replacing the invalid "Weekly" radio button with "Yearly", perfectly aligning with Step 1 tenancy creation.

### 3. Step 3 Confirmation "Utilities Information" Placement
- **The Fix**:
  - Attached `id="confirm-utilities-card"` to the Utilities Information confirmation section in `index.html`.
  - The *"✨ Rent-Only Tenancy • No utilities included (only rent needs to be paid)"* notification badge now renders directly inside the Utilities Information container rather than overflowing into General Information.

### 4. Tenancy Details Next Rent Due Month Name Resolution
- **The Fix**:
  - Replaced the static string *"15th of next month"* on Screen 10 with the dynamic calendar month name (e.g., *"15th November"*), dynamically calculating whether the upcoming billing falls into the current calendar month or next month.

### 5. Utility-Scoped Bill Generation & Breakdown (Screens 13, 14, 15)
- **The Enhancement**:
  - In Screen 13 (`setupGenerateBillScreen`), the app inspects the active tenancy's enabled utilities:
    - If Electricity is disabled, last/current electricity reading inputs are completely hidden and unrequired.
    - If Water is disabled or flat-rate, water meter reading inputs are hidden.
  - In Screen 14 (Review Bill) and Screen 15 (Bill Details / Invoice), line items for utilities (Electricity, Water, Internet, Sewage/Garbage) are displayed if and only if they are enabled for that specific tenancy and have non-zero amounts. Non-applicable utilities are completely hidden.

## 34. Payment Recording RLS Permission Resolution, Amount Clutter Removal & Advance Month Picker Architecture (Screen 12)

### 1. Supabase "Permission Denied for Table Users" Resolution
- **The Defect**:
  - When saving a payment (either via Screen 12 Dedicated Record Payment or the Dashboard Quick Modal), Supabase returned: `❌ Error saving payment: permission denied for table users`.
  - **Root Cause**:
    - In Supabase PostgreSQL, `auth.users` resides in the private `auth` schema. The `authenticated` role lacks `SELECT` privileges on `auth.users`.
    - The RLS policy `"Family managers can record payments"` on table `public.payments` contained an inline subquery: `((fs.member_email = ((SELECT users.email FROM auth.users WHERE users.id = auth.uid())))::text)`.
    - PostgreSQL evaluates all permissive `INSERT` `WITH CHECK` clauses whenever ANY user (including property owners) inserts a record into `payments`. Evaluating this subquery under the user's role triggered a permission denied violation.
  - **The Architectural Fix**:
    - Replaced the direct table query in both `payments` and `family_shares` policies with Supabase's native token helper `COALESCE(auth.email(), (auth.jwt() ->> 'email'))`.
    - Executed non-destructive policy alteration. Payments now record and sync instantaneously to Supabase without permission errors.

### 2. Removal of Unnecessary Amount Shortcut Chips (Clutter Elimination)
- **The Defect**:
  - The Record Payment screen rendered floating shortcut chips (`Base Rent (5,000)`, `Advance (35,000)`, `Round Rs. 5000`) beneath the amount field.
  - Users identified this row as redundant and space-consuming since the base rent is already pre-filled directly into the amount input and fully editable.
- **The Architectural Fix**:
  - Hidden and removed the shortcut chips row from `index.html` and disabled chip generation in `setupRecordPaymentForm()`, giving the screen a cleaner, more spacious layout.

### 3. Dynamic Advance & Custom Month Settlement Dropdown Restoration
- **The Defect**:
  - Toggling `+ Settle for another month / Advance` revealed an empty `<select id="select-custom-settle-month">` container with 0 options, rendering as a flat, clipped white bar with no selectable options ("Not showing").
- **The Architectural Fix**:
  - In `src/main.js`, `setupRecordPaymentForm()` now dynamically populates `#select-custom-settle-month` with:
    - The upcoming 12 calendar cycles for advance rent collection (e.g., `November 2026 (Advance)`, `December 2026 (Advance)`, etc.).
    - The past 3 months for retrospective cycle settlements.
  - Added clean container styling (`.custom-month-picker-row`) with distinct label and native select chevron styling.
  - Automatically selects the next upcoming advance cycle when opened and updates the settlement status pill in real-time.

## 35. Elderly-Friendly & Decluttered Month Settlement Architecture (Screen 12)

### 1. The UX Flaw & Trapped State Defect
- **The Defect**:
  - In Screen 12, tapping `+ Settle for another month / Advance` and selecting an advance cycle mutated the static headline pill to `"November 2026 (Advance)"` while retaining a green `"Current"` badge, creating an illogical oxymoron.
  - Furthermore, the user was trapped: there was no button or toggle to switch back to the actual current billing cycle (e.g. October 2026) without closing the page and reopening it.
  - The UI was visually congested with multiple nested alerts, text action toggles, and dropdown rows that confused non-tech-savvy and elderly landlords.

### 2. The Two-Option Radio Card Architecture (Foolproof & High Contrast)
- **The Architectural Fix**:
  - Replaced the clunky nested alerts and text links with two prominent, high-contrast radio choice cards:
    1. **Choice 1: Current Month (Default)**
       - Displays the exact calendar month (e.g., `October 2026`) with a green `Current` pill.
       - Subtitle explains: *"Regular monthly billing cycle"*.
    2. **Choice 2: Advance / Future Month**
       - Displays `Advance / Another Month` with a sky-blue `Advance` pill.
       - Subtitle explains: *"Pay ahead for upcoming or other months"*.
  - When **Choice 1** is selected:
    - The advance dropdown is smoothly hidden.
    - Payment is automatically locked to the current billing month.
  - When **Choice 2** is selected:
    - The advance dropdown panel (`#advance-dropdown-panel`) slides into view with clear, large typography.
    - Landlords can select any of the upcoming 12 months.
  - **Single-Tap Reversibility**:
    - Landlords can switch back to Current Month at any time simply by tapping Choice 1.
    - Zero trapped states, zero confusing text mutations, and 100% accessible touch targets for older users.

## 36. Smart Waterfall & Auto-Allocation Ledger Architecture (Screen 12)

### 1. The Multi-Payment & Partial-Rent Accounting Dilemma
- **The Problem**:
  - In real-world property management, tenants frequently:
    1. Pay **partial rent** (e.g. Rs. 2,000 on a Rs. 5,000 rent), leaving an unsettled balance to carry forward.
    2. Pay for **multiple months in a lump sum** (e.g. Rs. 15,000 covering current month + 2 future advance months).
    3. Pay a lump sum that clears **past overdue months + part/all of current rent**.
  - Traditional checkbox forms force landlords to perform mental arithmetic, figure out calendar math, and manually split payments across multiple receipts.

### 2. The FIFO Waterfall Engine & Live Real-Time Breakdown
- **The Architectural Solution**:
  - Implemented an automated **Waterfall (FIFO: First-In, First-Out)** engine (`computeWaterfallAllocations`):
    - **Step 1 (Oldest Arrears First)**: Automatically applies funds to clear past overdue bills/rent chronologically.
    - **Step 2 (Current Rent)**: Applies remaining funds to clear the current calendar billing cycle. If underpaid, flags the month as `⚠️ Partial Payment` with exact remaining due balance.
    - **Step 3 (Advance Credit)**: If a surplus remains, seamlessly pre-pays future cycles (`⏩ November 2026 (Advance)`, `⏩ December 2026 (Advance)`).
  - **Live Real-Time Re-calculation**:
    - Typing into `#record-page-amount` instantly recalculates and re-renders the breakdown cards right before the user's eyes without page reloads.
  - **Optional Single-Month Manual Override**:
    - Landlords who specifically wish to credit a custom month can open the manual assignment accordion (`#manual-override-panel`) with one tap, effortlessly overriding auto-split if desired.
  - **Persistent Transparency**:
    - `settledMonths` stores exact structured descriptions (e.g., `["October 2026 (Partial: Rs. 2,000 / Rs. 5,000)"]` or `["September 2026", "October 2026", "November 2026 (Advance)"]`), automatically displaying across the Dashboard and tenant WhatsApp receipts.

---

## 37. Decluttered Allocation Architecture & 2-Row Flex Alignment (Screen 12)

### 1. UX Simplification & Elimination of Overdescriptive Texts
- **Elimination of Wordy Headings**:
  - Replaced the bulky 2-line header (`Smart Settlement Allocation` + `Oldest dues cleared first, then current rent, then advance`) with a sleek, minimalist `.waterfall-header-clean`:
    - Clean title: `Allocation Breakdown` (`14px`, bold).
    - Compact status pill: `Auto-Split` (`#EDE9FE` background, `#6D28D9` text).
- **Concise Card Copy & 1-Word Badges**:
  - Removed multi-line verbose status phrases (`Partial advance credit • Balance to carry: Rs. 2,500`, `Current Month Cleared`, `Manual single-month assignment`).
  - Replaced with concise, scannable labels:
    - Current month: `Current cycle` with `Paid` chip.
    - Advance month: `Advance credit` with `Advance` chip.
    - Past due: `Past due cleared` with `Cleared` chip, or `Rs. X due` with `Partial` chip.

### 2. The 2-Row Card Layout (Zero-Truncation Guarantee)
- **The Squashing / Truncation Flaw**:
  - Previously, placing month titles, descriptions, amounts, and wide badges on a single flex row consumed >60% of card width on 360px mobile viewports, clipping amounts (`Rs. 2,5...`) and forcing awkward text wrapping.
- **The 2-Row Solution (`.waterfall-item-card`)**:
  - **Top Row (`.waterfall-card-top-row`)**:
    - Left: 22px status icon (`✓`, `⏩`, `⚠️`, `📅`) + Month Name (`October 2026`, `November 2026`).
    - Right: Bold amount applied (`Rs. 5,000`, `Rs. 2,500`) with `white-space: nowrap;`.
  - **Bottom Row (`.waterfall-card-bottom-row`)**:
    - Left: Short explanatory note with `padding-left: 30px;` (aligning directly beneath the month title, past the 22px icon + 8px gap).
    - Right: Compact 1-word pill badge (`Paid`, `Advance`, `Partial`, `Due`).
  - **Result**: Zero text collisions, zero card squashing, and perfect vertical alignment across all screen sizes down to 320px.

### 3. Removal of Confusing Manual Override Accordion ("7.5k for single month?" Resolution)
- **The Conflict**:
  - An optional manual override accordion allowed force-assigning 7,500 into a 5,000 rent cycle, leading to confusing states where a single month displayed 7.5k allocation.
- **The Resolution**:
  - Removed the confusing manual override accordion. The pure, automatic waterfall engine rigorously enforces financial rent limits: capping October at Rs. 5,000 (`Paid`) and immediately allocating the remaining Rs. 2,500 surplus to November (`Advance`), maintaining mathematical and accounting integrity.

### 4. Advance Month Zero-Debt & Balance-Due Isolation Rule
- **The Financial Logic Flaw**:
  - When a tenant paid a surplus (e.g. Rs. 5,600 on Rs. 5,000 rent), Rs. 600 was allocated as advance credit toward November 2026. However, because November's `base_rent` is Rs. 5,000, the system naively computed `balanceLeft = 5,000 - 600 = 4,400` and flagged a spurious red warning: `"Remaining Balance Due: Rs. 4,400"`.
- **The Resolution**:
  - **Advance is Credit, Not Debt**: Future cycles have not arrived or been billed yet. Any advance payment is purely an asset/credit.
  - Advance allocations (`type === 'advance'`) MUST always have `balanceLeft: 0`.
  - The `"Remaining Balance Due"` summary row strictly counts unfulfilled arrears from past overdue months (`type === 'past_due'`) and underpaid current rent (`type === 'current'`), and NEVER counts upcoming advance months.
  - In the Rs. 5,600 scenario, October is fully settled (`Paid`), November holds Rs. 600 (`Advance`), and Remaining Balance Due is Rs. 0 (row hidden).

---

## 38. Tenancy Start Date, Ledger Boundary & Partial Advance Month Architecture

### 1. Tenancy Start Date Field & Form Lifecycle
- **The Problem**: Previously, tenancies only tracked `billing_day` (e.g. 1st or 3rd) and `created_at`. When viewing the 12-month calendar ledger on Screen 10 (Tenancy Details), every month prior to tenancy creation (e.g., January through September) was cluttering the UI as `"Before tenancy started • Rs. 0.00 • Clear"`.
- **The Solution**:
  - Added explicit `start_date` (`DATE` column in Supabase `tenancies` table).
  - **Screen 7 (Create Tenancy - Step 1)**: Interactive date-picker `#input-tenancy-start-date` defaulting to the current date, with calendar icon trigger `#tenancyStartDateTrigger`.
  - **Screen 9 (Confirm Tenancy)**: Dedicated row in the General Information card displaying formatted `"Tenancy Start Date"` (e.g., `21 Oct 2026`).
  - **Screen 11 (Edit Tenancy)**: Interactive edit field `#edit-start-date-display` with calendar picker `#editStartDatePickerTrigger` allowing landlords to adjust historical tenancy start dates.

### 2. Month-Wise Ledger Boundary Rule (Zero Pre-Tenancy Clutter)
- **Strict Ledger Filtering Rule**:
  - In `renderTenancyDetails`, the 12-month loop (`MONTHS.forEach`) strictly skips all months prior to the tenancy start date:
    ```javascript
    const isBeforeTenancyStart = (activeYear < tenancyStart.getFullYear()) ||
      (activeYear === tenancyStart.getFullYear() && idx < tenancyStart.getMonth());
    if (isBeforeTenancyStart) return; // Completely hidden from the stack
    ```
  - The stack cleanly starts from the month the tenant actually moved in, eliminating all unnecessary placeholder cards.

### 3. Payment Allocation Breakdown & Advance Status Guarantee
- **The Problem**: When a tenant paid a lump sum covering multiple months (e.g., Rs. 6,000 for Rs. 5,000 rent: Rs. 5,000 October + Rs. 1,000 advance November), both October and November displayed the total payment (`Rs. 6,000.00`) and were marked as `✔ Settled`.
- **The Solution**:
  - **Exact Allocated Amount Display**: Each month card displays only its specific allocated portion (`Rs. 5,000.00` for October, `Rs. 1,000.00` for November).
  - **Status Fidelity**:
    - Underpaid current/past month (`monthAllocatedAmount < rentNum`): Displays amber `⚠️ Partial` badge.
    - Advance credit month (`monthAllocatedAmount < rentNum` in upcoming cycle): Displays blue `⏩ Advance` badge with subtext `"(Advance Credit)"`—NEVER falsely marked as `✔ Settled`.
    - Fully settled month (`monthAllocatedAmount >= rentNum`): Displays green `✔ Settled` badge.

---

## 39. Movie-Ticket Inspired Payment Receipt Voucher Architecture (Screen 21)

### 1. Aesthetic Inspiration & Rental Domain Adaptation
- **Design Origin**: Adapted faithfully from cinema/movie ticket voucher patterns (clean high-contrast white ticket card, direct 2-column key info block, crisp horizontal dashed perforation line, inward side ticket cutouts, and prominent barcode stub).
- **Rental Domain Translation**:
  - **Clean, Uncluttered Header**: Full-width header with brand micro-tag (`RENTAL BUDDY • DIGITAL VOUCHER`), bold property title (`Annachi`), tenant pill with user icon, and monthly rent rate pill with house icon. The top-right corner is kept completely clean without redundant badges.
  - **Direct Surface 2-Column Block (Strict Anti-Truncation Guarantee)**:
    - Sits directly on the clean white ticket card (`background: transparent; border: none; padding: 6px 16px 10px;`).
    - Eliminates redundant uppercase labels like `"PAYMENT DATE"` and `"PAYMENT CHANNEL"`.
    - Compact 34px icon container with 8px gap gives the text columns ample horizontal space.
    - **No Ellipsis / No `...` Truncation**: `.receipt-col-val` has `white-space: nowrap;` without `text-overflow: ellipsis;`.
    - Column 1: Calendar icon + Payment date (`Oct 21, 2026`) + Billing recurrence (`Billing Day: 3rd`).
    - Column 2: Cash banknote/card icon + Clean channel title (`Cash Payment` / `Online (UPI)`), completely visible without any `...` clipping.
  - **Direct Financial Hero (No Stamp Clutter)**:
    - Pure high-contrast amount display: `"TOTAL AMOUNT RECEIVED"` + large bold `"Rs. 6,000"` (or actual amount).
    - **No Trailing `.00` on Whole Numbers**: Whole rupee figures omit `.00` (e.g. `Rs. 6,000`, `Rs. 5,000`, `Rs. 1,000`). Only fractional payments display paise.
    - Stamp pills (like `[PAID (ADVANCE INCLUDED)]` / `[PAID IN FULL]`) are omitted to eliminate box-in-a-box clutter.
  - **Short Month Names in Settlement Breakdown**:
    - Every covered cycle renders with standard 3-letter short month format (`Oct 2026`, `Nov 2026`) preventing any horizontal overflow or text clipping.
    - Right side pairs a clean status tag (`Cleared`, `Advance`, `Partial`) with the clean currency amount (`Rs. 5,000`, `Rs. 1,000`).

### 2. Authentic Inward Ticket Cutouts & Perforation Geometry
- **True Physical Hole-Punch Cutouts**:
  - The ticket card `.receipt-ticket-card` has `overflow: hidden;`.
  - Left & Right Notches: Rendered via `.receipt-notch` as `28px × 28px` circular elements positioned at `left: -14px` and `right: -14px` with `background: var(--bg-canvas);`.
  - `overflow: hidden;` clips the outer half outside the card perimeter, so ONLY the inward semicircular punch-bite `(` on the left and `)` on the right is drawn inside the card.
  - Border Delineation: `box-shadow: inset -1.5px 0 0 rgba(226, 228, 242, 0.95);` (left) and `box-shadow: inset 1.5px 0 0 rgba(226, 228, 242, 0.95);` (right) provides a crisp outline along the curved bite matching the ticket card boundary.
  - Connecting Cutline: `border-top: 2px dashed #CBD5E1; margin: 0 18px;` runs seamlessly between the two punch bites.

### 3. Barcode Stub & Verification Architecture
- **Ticket Stub**:
  - Vector SVG barcode with realistic bar weights (`width: 82%; height: 52px; max-width: 270px; margin: 8px auto 14px;`).
  - Monospace receipt ID: `RB-PAY-XXXXXXXXXX` generated deterministically from the transaction ID (`font-size: 13.5px; letter-spacing: 0.08em; line-height: 1.4;`).
  - Caption: `"Show this digital receipt or share with tenant for verified proof of payment."` with relaxed line-height (`1.6`) for optimal readability.

### 4. Spacious Line Spacing & Full Vertical Utilization (Anti-Clutter Architecture)
- **Problem Resolved**: When packed tightly, the ticket voucher elements felt congested and left a dead ~150px blank void between the card and the bottom action bar.
- **Spacious Vertical Rhythm & Relaxed Line Heights**:
  - Header: `padding: 24px 22px 16px;`, title `font-size: 24px; line-height: 1.35; margin: 0 0 12px 0;`.
  - Meta Pills: `padding: 6px 13px; font-size: 13.5px; line-height: 1.4; gap: 7px;`.
  - Key Highlights: `padding: 10px 22px 14px; gap: 18px;`, icon `42px × 42px`, values `line-height: 1.4;`.
  - Dividers: `margin: 16px 22px; height: 1px; background: #ECEEF8;`.
  - Amount Hero: `padding: 6px 22px 8px;`, caption `line-height: 1.35;`, amount `clamp(26px, 7vw, 30px); line-height: 1.25;`.
  - Body Details: `padding: 0 22px; gap: 18px;`, detail body `line-height: 1.55;`, allocation rows `padding: 12px 16px; gap: 12px; border-radius: 14px; line-height: 1.4;`.
  - Perforation Zone: `height: 32px; margin: 20px 0 12px;` with `32px` inward notches (`left: -16px; right: -16px;`).
- **Complete Vertical Utilization Architecture**:
  - The ticket card `.receipt-ticket-card` uses `flex: 1 0 auto; display: flex; flex-direction: column; justify-content: space-between; margin-top: 6px; margin-bottom: 12px;`.
  - Content partitioned cleanly into `.receipt-card-upper` (growing financial details) and `.receipt-card-lower` (pinned perforation & barcode stub with `margin-top: auto;`).
  - Container `.receipt-screen-content` uses `padding: 16px 20px 14px;` without excessive inline bottom padding, allowing the voucher to gracefully fill the available vertical space directly above the bottom action bar.

### 5. Canonical Bottom Action Bar Architecture
- **Strict Anti-Collapse Compliance**:
  - Rendered as `<footer class="bottom-bar two-buttons">` strictly outside `.screen-content`.
  - Both buttons share `54px` min-height, pill geometry, zero flexbox squashing, and proper side-by-side flex allocation.
  - Secondary button: `"WhatsApp Receipt"` with green WhatsApp icon.
  - Primary button: `"Done"` returning directly to Tenancy Details or Dashboard.

### 6. WhatsApp Receipt Dual Sharing Workflow (Text vs High-Res PNG Image)
- **Modal Prompt Architecture**:
  - Clicking `"WhatsApp Receipt"` triggers the dedicated bottom sheet modal (`#modal-share-receipt-choice`) presenting two clear choices:
    1. **`Send as Text`** (`#btn-share-as-text`): Present text summary workflow.
    2. **`Send as Image (PNG)`** (`#btn-share-as-image`): Full visual voucher snapshot workflow.
- **Text Workflow & Phone Country Code (91) Normalization**:
  - **Country Code 91 Formatting**: Automatically normalizes 10-digit Indian phone numbers (e.g. `9455866595` -> `919455866595`) or 11-digit numbers starting with 0 (`09455866595` -> `919455866595`) so WhatsApp opens the direct chat immediately via `https://api.whatsapp.com/send?phone=91XXXXXXXXXX&text=...`.
  - **Vibrant Emojis Restored**: Includes standard emojis (🧾 `Payment Receipt`, 🏠 `Property`, 📅 `Date`, 💳 `Channel`, 📋 `Covered Cycles`, 💰 `Total Received`, ✅ `Verified & Settled`, ✨ `Thank you`), which render reliably without redirect corruption via `api.whatsapp.com/send`.
  - **Automatic Clipboard Synchronization**: Copies the complete emoji-rich receipt to the clipboard simultaneously.
- **Image Workflow (Exact Visible PNG Voucher)**:
  - Captures the exact `.receipt-ticket-card` element using client-side `html2canvas` at 3x retina scale.
  - Semicircular Cutout Fidelity: Background set to `backgroundColor: '#EFF0FA'` so the perforation bites render seamlessly.
  - Native Mobile Web Share: When supported (`navigator.canShare({ files: [file] })`), directly invokes the mobile OS share sheet with the PNG file attached for one-tap WhatsApp photo sharing.
  - Desktop Fallback: Automatically triggers download of `RentalBuddy-Receipt-${cleanId}.png` and opens WhatsApp (with tenant `phone=91XXXXXXXXXX`) with a concise caption and attachment guidance.

---

## 40. Universal Rupee Symbol Standard (`₹` Across All Surfaces)
- **Strict Rule**:
  - The standard Indian Rupee symbol **`₹`** MUST be used exclusively in place of legacy text representations like `Rs.` or `Rs` across all user-facing surfaces.
- **Affected Surfaces & Guidelines**:
  1. **Dashboard & Metric Cards**: e.g., `₹12,000 • Monthly`, `₹68,148.16`.
  2. **Month-Wise & Cycle Ledgers**: e.g., `₹5,000`, `₹1,000 due`.
  3. **Form Controls & Labels**: Input labels (`New Rent (₹)`, `Price Per Unit (₹)`), input trailing icons (`₹`), and placeholder helpers.
  4. **Bill Breakdown & Invoices**: `• Base Rent: ₹12,000`, `*Total Net Payable: ₹14,250*`.
  5. **Payment Vouchers (Screen 21)**: Total amount hero (`₹6,000`), tenant rent pill (`₹5,000 / mo`), breakdown rows (`₹5,000`, `₹1,000`).
  6. **WhatsApp Messages & Sharing Templates**: `💰 *TOTAL RECEIVED: ₹6,000*`, `💰 *Amount:* ₹6,000 (Verified & Settled ✅)`.
- **Backward Compatibility Guarantee**:
  - Allocation and settlement regex parsers MUST support extracting amounts matching both `₹` and historical `Rs.` data (e.g. `/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i`).

---

## 41. Clean Whole-Rupee Currency Display & Minimalist Dashboard Header
- **Zero Decimals on Whole Numbers (STRICT RULE)**:
  - All currency displays across cards, ledgers, breakdown tables, and recent activity MUST omit `.00` on whole numbers (e.g., `₹6,000`, `₹5,000`, `₹32,000`).
  - Decimals are strictly reserved for non-zero fractional paise (e.g., `₹306.12`).
  - Implemented universally via `formatCurrencyAmount(val)` ensuring consistent, uncluttered typography throughout the entire app.
- **Dashboard Cloud Status Banner Removal**:
  - The live cloud status banner (`#cloud-status-banner`) above `"Your Tenancy"` has been completely removed to provide a clean, distraction-free aesthetic.
  - The dashboard header transitions directly from the gear and add action icons to the primary `"Your Tenancy"` screen heading without visual clutter.

---

## 42. Multi-Payment Month Settlement & Advance-Aware Waterfall Engine

### 1. The Duplicate Payment Problem & Root Cause
- **Issue**: When a landlord recorded a payment settling the current month (e.g. October 2026) and opened the "Record Payment" screen again, the auto-split waterfall still proposed paying October 2026 as "Current cycle ₹5,000".
- **Root Cause**:
  1. The overdue queue assembly only inspected months *prior* to the current month (`iterDate < currentDateFirst`).
  2. Step 2 in `computeWaterfallAllocations` verified whether the current month was already in `overdueQueue`, but completely omitted checking the cloud payments ledger (`cloudPaymentsList`) to see if the current month was already settled.
  3. Consequently, the waterfall engine falsely assumed the current cycle was unpaid and allocated incoming funds to October a second time.
  4. Furthermore, prior advance allocations towards upcoming cycles (e.g. ₹1,000 advance credit towards November 2026) were not factored into the remaining cycle balance.

### 2. Multi-Payment Aggregation Architecture (`getTenancyPaidSummaryByMonth`)
- Scans all payments recorded for the property in `cloudPaymentsList`.
- Inspects `settled_months` arrays and regex-extracts allocated amounts (supporting `₹`, legacy `Rs.`, and comma-separated numeric entries).
- Aggregates cumulative paid amounts per cycle (`paidMap[cycleKey] = { totalPaid, hasAdvanceCredit }`), properly tracking partial payments, multiple installments, and advance balances.

### 3. Skip-Already-Settled & Advance-Aware Waterfall Rules
- **Cycle Net Due Formula**: `netDue = Math.max(0, cycleDue - alreadyPaid)`.
- **Zero-Balance Cycles**: If `netDue === 0`, the cycle is 100% cleared and takes **₹0** from the new payment. It is completely bypassed in the waterfall.
- **Advance-Credited Cycles**: If an upcoming cycle already has advance credit (e.g. November with ₹1,000 advance), its net requirement is reduced to `₹5,000 - ₹1,000 = ₹4,000`. A ₹4,000 payment clears the cycle balance with badge `Adv. Cleared` and note `₹1,000 adv. adjusted • Fully cleared`. Any surplus rolls into subsequent cycles (e.g. December 2026 as Advance credit).

### 4. Smart Default Amount & Due Hint (`getEarliestUnsettledCycle`)
- When opening the Record Payment screen (Screen 12), the form automatically identifies the earliest unsettled cycle.
- The `Amount Paid` input field defaults to the exact remaining net due for that cycle (e.g. `4000` instead of full `5000` when ₹1,000 advance was already credited).
- The `record-due-hint` dynamic label provides instant financial transparency (e.g. `Nov Due: ₹4,000 (₹1,000 Adv. applied)` or `Past Due: ₹5,000 (August 2026)`).

### 5. Prominent Reassurance Notice (`.waterfall-settled-notice`)
- When the current calendar cycle is already fully paid, a green checkmark pill is rendered above the breakdown:
  `✓ October 2026 is already fully settled (₹5,000 paid). Payment applies to upcoming cycle.`
- Eliminates any landlord ambiguity about why the current month is not being billed twice.

---

## 43. Intelligent Onboarding Bypass & User Data Presence Detection

### 1. The Repeated Onboarding Loop Problem
- **Issue**: Whenever an authenticated user logged in using their credentials (e.g., from a new session, refreshed browser, or incognito window), the app repeatedly redirected them to the Onboarding screens (Screen 2) instead of the Dashboard.
- **Root Cause**:
  1. The login handler checked `onboarding_completed` flag prior to dashboard data synchronization.
  2. Because `localStorage` is empty on new browser sessions or after cache clears, and Supabase `profiles` may not hold a populated `onboarding_completed` flag, `isCompleted` evaluated to `false`.
  3. The app did not check whether the user already had active tenancies, bills, or payment records in their account, resulting in unnecessary onboarding prompts for established landlords.

### 2. User Data Presence Architecture (`userHasExistingData`)
- **Comprehensive Data Verification**:
  ```javascript
  export function userHasExistingData(userId) {
    const hasTenancies = Array.isArray(cloudTenanciesList) && cloudTenanciesList.length > 0;
    const hasBills = Array.isArray(cloudBillsList) && cloudBillsList.length > 0;
    const hasPayments = Array.isArray(cloudPaymentsList) && cloudPaymentsList.length > 0;
    const isMarkedCompleted = Boolean(
      cloudSession.profile?.onboarding_completed ||
      (userId && localStorage.getItem(`rb_onboarding_completed_${userId}`) === 'true')
    );
    return hasTenancies || hasBills || hasPayments || isMarkedCompleted;
  }
  ```
- **Strict Data Priority**:
  - If a user has **any** tenancy (`cloudTenanciesList.length > 0`), **any** bill, or **any** payment, they are definitively recognized as an existing active user.
  - The app **immediately bypasses onboarding** and navigates directly to the Dashboard (`Screen 6`).
  - Automatically persists `onboarding_completed: true` in `localStorage` and updates the user's Supabase profile non-blockingly.

### 3. Pure First-Time Onboarding Constraint
- Onboarding (Screen 2) is **strictly reserved** for brand-new users who have:
  - 0 tenancies
  - 0 bills
  - 0 payments
  - No prior completed onboarding flag
- As soon as a user creates their first tenancy on Screen 9, `onboarding_completed` is permanently marked and synced, ensuring they never see the onboarding flow on future logins.

---

## 37. Dedicated Family Sharing Architecture, Selective Property Access & Role Enforcement (Screen 22)

### 1. Dedicated Family Sharing Page (`Screen 22`)
- **Structure**:
  - Full mobile screen with back navigation returning cleanly to Dashboard (`Screen 6`) or Settings (`Screen 16`).
  - Top action button `+` and bottom sticky bar button `+ Share New Tenancy` trigger the `#modal-selective-share` bottom sheet.
  - **Two-Count Segmented Tab Controller**:
    - **Tab 1: `Shared with Me` (`#badge-shared-with-me-count`)**: Displays incoming share invitations and active properties shared by other owners.
    - **Tab 2: `Sharing` (`#badge-sharing-count`)**: Displays outgoing share invitations issued by the current user to other family members or co-hosts.

### 2. Selective Property Sharing Architecture
- **Non-Blanket Access**: Owners explicitly choose which specific tenancies to share via interactive checkboxes in `#modal-selective-share`.
- **Database Schema**:
  - `public.family_shares` column `tenancy_ids jsonb DEFAULT '[]'::jsonb`: Stores the array of UUID strings for selected properties.
  - Postgres RLS function `has_family_access(target_tenancy_id, user_id)`:
    - Verifies accepted/approved status: `(fs.status = 'accepted' OR fs.status = 'approved')`.
    - Verifies selective containment: `(fs.tenancy_ids IS NULL OR jsonb_array_length(fs.tenancy_ids) = 0 OR fs.tenancy_ids ? target_tenancy_id::text)`.
    - Unapproved (`pending`) or denied requests evaluate strictly to `FALSE`, preventing any premature data leakage.

### 3. Manager vs Viewer Role Enforcement (Strict Read-Only Viewer)
- **Role Permissions**:
  - **`Manager`**: Full operational access — can record rent/utility payments, generate bills, share WhatsApp invoices, and view ledgers. Cannot delete or archive the property.
  - **`Viewer`**: Strictly read-only access — can view property details, monthly billing ledger, and transaction history.
- **Client UI Restrictions for Viewers**:
  - **Dashboard (`Screen 6`)**: Tenancy card shows `👁️ Shared • Viewer (Read Only)` badge. The operational buttons ("Generate Bill" & "Record Payment") are replaced with a single `View Details (Read Only)` button.
  - **Tenancy Details (`Screen 10`)**: 3-dots menu button is hidden (preventing editing, archiving, or deleting); sticky bottom "Generate New Bill" button is hidden.
  - **Record Payment (`Screen 12`) & Generate Bill (`Screen 13`)**: Access is strictly guarded with warning toasts redirecting viewers away from mutation forms.

### 4. Live Two-Way Approval / Denial & Zero-Premature Sync Protocol
- **Recipient Workflow**:
  - Incoming shares appear in `#stack-incoming-pending` with sender email, role badge, property scope summary, and action buttons (`✔ Approve & Sync` and `✕ Deny`).
  - A prominent incoming shares banner (`#incoming-shares-alert-banner`) alerts the user on their dashboard.
  - **Zero-Premature Sync**: The recipient's database and dashboard are **never** populated with the owner's properties until the recipient explicitly clicks **`Approve & Sync`**.
- **Owner Visibility**:
  - Outgoing shares stack displays live status badges:
    - `⏳ Pending Approval` (amber pill)
    - `✔ Approved & Synced` (emerald pill)
    - `🚫 Denied by Recipient` (rose pill)
  - Owners can revoke access at any time via `🗑️ Revoke Access`.

### 5. Selective Share Tenancy Stacked Cards Architecture
- **Vertical Stack Layout**:
  - Replaces raw browser checkboxes with elevated card components (`.share-check-item`) stacked vertically with `10px` gap inside `.share-tenancies-checklist`.
  - Geometry: `border-radius: 16px`, padding `12px 14px`, border `1.5px solid #E2E4F2`.
  - Visual Depth:
    - Default: White surface with subtle elevation shadow `0 2px 6px rgba(28, 33, 66, 0.03)`.
    - Active / Selected: Vibrant primary border `#5452EC`, soft lavender canvas background `#F7F7FE`, elevated glow `0 4px 14px rgba(84, 82, 236, 0.12)`.
  - Icon & Typography:
    - Left: Circular/rounded property icon container (`40px × 40px`, `#E8E7FB` background, switching to `#5452EC` when selected) with house SVG.
    - Information: Bold property name (`14.5px`, bold `#0E1326`) and rent subtitle (`12px`, `#7D849B`).
  - Interactive Custom Checkbox:
    - Right: `22px × 22px` rounded `6px` custom box with animated checkmark `✓` in `#5452EC`.
    - Entire card is an interactive label; tapping anywhere toggles selection and synchronizes the "Select All / Deselect All" trigger.

### 6. Live Role Switching Without Revocation (Manager ⇄ Viewer)
- **Problem Resolved**: Owners previously had to revoke an active or pending family share completely and recreate it from scratch if they wished to promote a Viewer to a Manager or downgrade a Manager to a read-only Viewer.
- **Card-Level Segmented Control**:
  - Each outgoing shared card in `Screen 22` includes an embedded `.share-role-switch-row` with a segmented pill toggle: `[ 🛠️ Manager | 👁️ Viewer ]`.
  - Also makes the top-right role badge interactive (`.role-badge-clickable`) as a quick one-tap toggle.
- **Non-Destructive Database Mutation**:
  - Tapping either role calls `updateFamilyShareRole(shareId, newRole)` which updates `public.family_shares.role` directly for that `admin_id`.
  - Does **NOT** alter the share's accepted/approved status or tenancy scope, preserving uninterrupted ledger access while immediately adjusting permissions.
  - Automatically updates local state and reactive UI without page reload.

---

## 38. Input Controls: Strict 10-Digit Phone Restriction & Universal Number Keypad Architecture

### 1. Strict 10-Digit Phone Number Policy
- **Universal Field Specification**:
  - All phone number inputs (`#input-phone-number`, `#edit-tenant-phone`) MUST enforce:
    - `type="tel"`
    - `inputmode="tel"`
    - `pattern="[0-9]*"`
    - `maxlength="10"`
    - Placeholder: `e.g. 9812345678`
- **Real-Time Input Sanitization**:
  - Real-time `input` and `paste` event listeners immediately strip any non-digit characters (`\D`) and slice string to a maximum of 10 characters: `e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);`.
- **Validation Guard**:
  - In tenancy creation (Step 1 Next button & Step 3 Confirm button) and tenancy editing (Save button), if phone number is provided, it must be verified to have **exactly 10 digits**. Incomplete phone entries prompt a clear warning toast: `"⚠️ Phone number must be exactly 10 digits"`.
- **Contact Picker Integration**:
  - Selecting contacts via the contact picker button automatically injects a verified 10-digit number (`9812345678`) and dispatches the input event for reactive syncing.

### 2. Universal Number Keypad Across the App
- **Problem Resolved**: Standard mobile browsers on Android and iOS often display the standard alphabetical keyboard for raw text or unconfigured numeric inputs, forcing users to manually switch keyboards when entering amounts, meter readings, or utility rates.
- **Strict Keypad Mapping**:
  - **Integer Quantities & Currency** (`inputmode="numeric" min="0"`):
    - Rent Amount (`#input-rent-amount`, `#edit-rent-amount`)
    - Advance Amount (`#input-advance-amount`, `#edit-advance-amount`)
    - Quick Record Amount (`#record-amount`)
    - Revise Rent (`#input-new-rent`)
    - Flat Utility Amounts (Electricity, Water, Garbage, Internet)
    - Bill Advance & Due Adjustments (`#input-bill-advance`, `#input-bill-due`)
  - **Decimals & Meter Readings** (`inputmode="decimal" step="0.01" min="0"`):
    - Dedicated Record Payment Amount (`#record-page-amount`)
    - Electricity Meter Reading (`#input-elec-reading`, `#input-curr-elec`)
    - Electricity Unit Price (`#input-elec-price`, `#edit-elec-price`)
    - Water Meter Reading (`#input-water-reading`, `#input-curr-water`)
    - Water Unit Price (`#input-water-price`)
- **Automated Lifecycle Enforcement (`initNumericAndPhoneInputs`)**:
  - Automatically executed on application boot (`DOMContentLoaded`) and re-evaluated dynamically on every screen navigation (`navigateToScreen`), guaranteeing that all present and future numerical inputs automatically open the numeric keypad without exception.








---

## 39. Settings Menu Workflows & Complete Relational Backup & Restore Architecture

### 1. Settings Menu Workflows
To eliminate dead placeholders and provide a production-ready user experience, all four information and support menus on the Settings screen are backed by functional workflows:
- **Report a Bug**:
  - Direct external link triggering `window.open('https://github.com/DoctorKishor/Rental-buddy/issues/new', '_blank')`.
  - Opens GitHub's issue creation portal directly in a new browser tab.
- **About The App**:
  - Triggers a rich, responsive bottom-sheet modal (`#modal-about-app`).
  - Displays product branding, current app version (`v1.0.0 Production`), author attribution (Dr. Kishor - `@DoctorKishor`), cloud backend provider (Supabase Cloud & Auth), core value summary, and direct GitHub repository links.
- **Contact Support**:
  - Triggers a dedicated support modal (`#modal-contact-support`).
  - Provides a 1-tap direct email mailto action to `kishoranbazhakan@gmail.com` pre-populated with subject and device metadata, alongside an alternate link to GitHub Community Discussions.
- **Request Feature**:
  - Direct external link to `https://github.com/DoctorKishor/Rental-buddy/issues/new?template=feature_request.md&title=%5BFeature%5D+`.
  - Encourages community feature requests with pre-formatted issue templates.

### 2. Complete Relational Backup & Restore Architecture (Screen 19)
- **Previous Limitation**: The initial prototype backup only exported in-memory cached tenancies with zero bills or payments, and the restore flow naively created empty tenancies without relational bills or payment records.
- **Authoritative Cloud-Backed Backup Engine**:
  - Exports a unified `.rhb` (Rental Buddy Backup) JSON file containing:
    - `metadata`: Export timestamp, schema version (2.0), source app, and user email.
    - `tenancies`: Complete tenancy definitions, tenant names, contact numbers, and utility configurations.
    - `bills`: Complete billing history, calculations, meter readings, and cycle periods.
    - `payments`: Comprehensive ledger payments, transaction modes, reference numbers, and settled month tags.
    - `preferences`: Currency token, haptics toggle, and notification settings.
  - Asynchronously pulls fresh records directly from Supabase (`fetchCloudTenancies`, `fetchCloudBills`, `fetchCloudPayments`) to ensure zero dropped data even if local state is cold.
- **Relational Integrity & Foreign Key Remapping**:
  - In Supabase, the `bills` and `payments` tables enforce strict foreign key constraints (`tenancy_id -> tenancies.id`).
  - When importing a `.rhb` backup, old UUIDs cannot simply be re-inserted if new tenancy records are created.
  - The restore engine introduces an in-memory **`tenancyIdMap`**:
    1. Checks if a tenancy already exists in the cloud by matching name. If found, uses its authoritative `id`.
    2. If absent, creates the tenancy record in Supabase and maps the backup `oldId -> newId`.
    3. Re-maps all foreign keys on `bills` and `payments` using the map before saving.
    4. Automatically skips duplicate bills and payments (matching by cycle period / timestamp) to avoid inflating ledger balances.
- **Reactivity & Synchronized Feedback**:
  - On restore completion, restores local preferences (`rb_currency`, `rb_haptics`), triggers `syncDashboardFromCloud()`, refreshes the dashboard UI, and presents a celebratory toast summary with the exact count of properties, bills, and payments recovered.

---

## 40. Dynamic Tenancy Payment Status Badges Architecture (Dashboard Cards)

### 1. Replacement of Static Badges
- **Previous Design**: Tenancy cards on the landlord dashboard displayed static operational labels: `Active • Rent Only` or `Active • Utilities Included`. These provided zero financial intelligence regarding rent collection.
- **Enhanced Design**: Every tenancy card header now dynamically evaluates authoritative ledger payments, generated utility bills, billing recurrence dates, and the calendar date to display real-time, actionable financial status badges with color-coded psychological cues.

### 2. Four Color-Coded Status Categories

| Category | CSS Class | Color Palette (Background / Text / Border) | Icon | Example Copy | Condition |
|---|---|---|:---:|---|---|
| **Overdue / Outstanding** | `.status-pill.status-overdue` | `#FEE2E2` / `#DC2626` / `1px solid #FECACA` | ⚠️ | `Outstanding 2 months`<br>`Outstanding 1 month`<br>`Outstanding • ₹500 due`<br>`Overdue 19 days` | Past unsettled months, unpaid utility invoices, or current month due date elapsed with remaining balance. |
| **Due Today / Due Soon** | `.status-pill.status-due-today` | `#FEF3C7` / `#B45309` / `1px solid #FDE68A` | ⏳ | `Due Today`<br>`Due tomorrow`<br>`Due in 2 days`<br>`Due in 3 days` | Current cycle payment due today or within a 3-day immediate window. |
| **Upcoming Cycle** | `.status-pill.status-upcoming` | `#E0F2FE` / `#0284C7` / `1px solid #BAE6FD` | 📅 | `Due in 5 days`<br>`Due in 12 days` | Current cycle payment due in 4 or more days. |
| **Paid / All Settled** | `.status-pill.status-paid` | `#DCFCE7` / `#16A34A` / `1px solid #BBF7D0` | ✔ | `Paid`<br>`Paid in Advance` | Current billing month completely paid and zero historical arrears. |

### 3. Shared Tenancies (Viewer & Manager Support)
- For shared properties, the dynamic financial status badge is preserved as the primary indicator so collaborators immediately see rent status. A secondary pill badge (`👁️ Viewer` or `🛠️ Manager`) is rendered adjacent to the status badge without layout breakage.

### 4. Implementation Details
- **Logic Engine**: `computeTenancyStatusBadge(tenancy, allBills, allPayments)` in `src/main.js`.
- **Parallel Data Fetching**: `syncDashboardFromCloud` initiates `Promise.all([fetchCloudTenancies('active'), fetchCloudBills(), fetchCloudPayments()])` ensuring badge computations are instantaneous and avoid redundant network roundtrips.

---

## 41. Tenancy Year Filtering, Archived Data Integrity, Viewer Role Protection & Rent Revision History

### 1. Dynamic Financial Year Dropdown Architecture (Screen 10: `#details-year-select`)
- **Problem Resolved**: The financial year dropdown previously hardcoded `Year 2026` and `Year 2025` statically. New tenancies created in 2026 erroneously presented `Year 2025` even though no earlier records existed, creating user confusion.
- **Dynamic Date-Bound Range Evaluation**:
  - The dropdown now evaluates the authoritative start date of the tenancy (`start_date` or `created_at`) alongside recorded historical payments and utility bills.
  - Generates options spanning strictly from `maxYear = Math.max(currentYear, ...yearsFromRecords)` down to `minYear = Math.min(currentYear, tenancyStartYear, ...yearsFromRecords)`.
  - If a tenancy started in 2026 with no past records, only `Year 2026` is displayed. If a tenancy started in 2025, `Year 2026` and `Year 2025` are displayed. If payments date back to 2024, `Year 2024` is included seamlessly.
  - Active selection is preserved or falls back cleanly to the current year.

### 2. Complete Archived Tenancies Data & Receipt History Restoration (Screen 18: `#screen-18`)
- **Problem Resolved**: Archived properties displayed `Total Bill Paid: ₹0`, `Last Generated Bill: ₹0`, and `No archived bill history` because `openArchivedDetails(tenancy)` only fetched from `bills` table, ignoring payments entirely for rent-only tenancies.
- **Unified Dual-Source Ledger Fetching**:
  - `openArchivedDetails(tenancy)` initiates `Promise.all([fetchCloudBills(tenancy.id), fetchCloudPayments(tenancy.id)])`.
  - Calculates authoritative cumulative collections: `total = totalPaidFromPayments > 0 ? totalPaidFromPayments : totalPaidFromBills`.
  - Dynamically updates summary labels based on utilities configuration:
    - With utilities: `"Total Bill Paid"` and `"Last Generated Bill"`.
    - Rent-only: `"Total Rent Paid"` and `"Last Payment"`.
  - Unifies payment vouchers and utility invoices into a combined, reverse-chronological history list. Tapping any payment opens the high-fidelity `Payment Voucher / Receipt` modal (`openPaymentReceipt`), and tapping any bill opens full billing breakdown (`renderBillDetails`).

### 3. Viewer Role Access Restriction (Archive, Unarchive & Delete)
- **Problem Resolved**: Viewers had access to archive, unarchive, or delete tenancies in certain views where action buttons were not strictly guarded.
- **Multi-Layer Permission Enforcement**:
  - **Screen 10 (Active Tenancy Details)**: 3-dots action menu (`#btn-details-menu`) is hidden for viewers; archive and delete click handlers explicitly verify `getTenancyUserRole(tenancy) !== 'viewer'`.
  - **Screen 18 (Archived Tenancy Details)**: 3-dots action menu (`#btn-archdetails-menu`) is hidden for viewers; unarchive (`#menu-action-unarchive`) and delete (`#menu-action-arch-delete`) handlers explicitly verify viewer role and reject mutations with explanatory toasts.
  - **Supabase Cloud Layer (`src/supabase.js`)**: `archiveCloudTenancy`, `unarchiveCloudTenancy`, and `deleteCloudTenancy` call `verifyWritePermission(tenancyId)`, verifying ownership or manager-level family shares before executing mutations.

### 4. Rent Revision History Drawer & Days-Elapsed Indicator (Screen 11 / `#modal-revise-rent`)
- **Live Elapsed Duration Indicator (`#revise-days-indicator-card`)**:
  - Displays a clean periwinkle chip inside the revision modal with real-time revision age:
    - With past revisions: `⏱️ Last revised: X days ago` with subtitle `₹{old} → ₹{new} on {date}`.
    - Without revisions: `⏱️ No revisions yet` with subtitle `Base rent unchanged (Active for X days)`.
- **Interactive Collapsible Revision Drawer (`#revise-history-drawer`)**:
  - Toggle button (`#btn-toggle-revision-history`) smoothly expands/collapses the revision history list.
  - Cards display revision date, status chip (`Applied`, `Scheduled`, or `Cancelled`), old vs new rent, increment/decrement delta (`+₹500 (+14%)`), and revision reason.
  - Re-evaluates and refreshes dynamically whenever a new revision is scheduled or cancelled.

### 5. Dynamic Effective Billing Cycle Calculator & Custom Date Support
- **Problem Resolved**: The revision modal's "Effective From Cycle" select previously had hardcoded static placeholder options (`Next Cycle (1 May 2026)`, `In 2 Months (1 June 2026)`, `In 3 Months (1 July 2026)`), and choosing custom date lacked an input field.
- **Real-Time Cycle Projections (`populateReviseCycleOptions`)**:
  - Evaluates the tenancy's authoritative `billing_day` (e.g. 4th of the month) relative to today's date.
  - Computes exact calendar dates for upcoming cycles:
    - If today is Oct 23 and billing day is 4: Cycle 1 is `Next Cycle (4 Nov 2026)`, Cycle 2 is `In 2 Months (4 Dec 2026)`, Cycle 3 is `In 3 Months (4 Jan 2027)`.
    - Supports yearly cycle projections if `billing_cycle === 'yearly'`.
  - **Custom Date Field (`#group-revise-custom-date`)**:
    - Selecting `Custom Date` reveals an interactive date picker (`#input-revise-custom-date`) with min date validation (cannot schedule in the past).
    - When scheduled, the exact chosen ISO date is persisted to Supabase `rent_revisions.effective_date`.

### 6. Edit Tenancy & Rent Revision Audit Enhancements
- **Billing Cycle Persistence (`billing_cycle`)**:
  - Previously, `billing_cycle` (`Monthly` vs `Yearly`) was selected in the form's radio cards, but was omitted from the `updateCloudTenancy` payload in `btnSave`. Now persisted to Supabase and synced with in-memory tenancy state.
- **Auto-Maturity Engine (`applyDueRentRevisions`)**:
  - Automatically evaluates scheduled rent revisions whenever tenancies are synced or bound (`effective_date <= today`). Updates `base_rent` in Supabase and marks the revision `status: 'applied'` without manual landlord intervention or breaking historical records.
- **Active Revision Pre-Fill & Cancellation Guard**:
  - Opening the revision modal with an already-scheduled revision automatically pre-fills the new rent and note fields.
  - Cancelling a revision prompts a confirmation dialogue (`confirm(...)`) to prevent accidental taps.
### 7. Edit Tenancy Full Utility Stack & Screen 10 Scheduled Chip Audit
- **Full 4-Utility Stack in Edit Tenancy (Screen 11)**:
  - Previously, Screen 11 only provided partial controls for Electricity (hardcoded meter reading) and Water (hardcoded flat rate).
  - Screen 11 now provides full parity with Screen 8 (Tenancy Creation Wizard):
    - **Electricity**: Toggle (`#edit-toggle-elec`), Bill Type selector (`Flat` vs `Meter Reading`), Price Per Unit (`#edit-elec-price`), and Flat Amount (`#edit-elec-flat-amount`).
    - **Water**: Toggle (`#edit-toggle-water`), Bill Type selector (`Flat` vs `Meter Reading`), Flat Amount (`#edit-water-amount`), and Price Per Unit (`#edit-water-price`).
    - **Garbage**: Toggle (`#edit-toggle-garbage`) and Flat Amount (`#edit-garbage-amount`).
    - **Internet**: Toggle (`#edit-toggle-internet`) and Flat Amount (`#edit-internet-amount`).
  - Swapping between `Flat` and `Meter Reading` dynamically toggles the subfield containers without page reload.
  - Saving on Screen 11 constructs all 4 utility objects with accurate `bill_type`, `price_per_unit`, and `flat_amount`, preserving Garbage and Internet configurations in Supabase Cloud without data loss.
- **Screen 10 Summary Card Scheduled Revision Indicator (`#details-scheduled-chip`)**:
  - Tying the rent revision loop directly into the main Tenancy Details card: when a scheduled revision is active, a prominent blue indicator (`📈 ₹{rent} scheduled ({date})`) is rendered beneath the rent rate line.
  - Dynamically updates upon scheduling a revision or cancelling via Screen 11's revision banner.

### 8. Single-Active Revision Integrity, WhatsApp Notice Dispatch & Role Guards Audit
- **Single-Active Revision Supersede Guarantee**:
  - Prior scheduled revisions are now automatically cancelled in Supabase (`status: 'cancelled'`) before scheduling a new revision for the same tenancy.
  - Prevents competing revision records and guarantees that the correct, intended rate applies when auto-maturity triggers.
- **Real WhatsApp Revision Dispatch**:
  - Toggling "Send WhatsApp notification to tenant" now formats a clean markdown notification and dispatches directly via `window.open` using `formatWhatsAppPhone`.
- **Viewer Role Multi-Layer Enforcement**:
  - `btnSave` (`#btn-save-tenancy-changes`), `btnOpenRevise` (`#btn-open-revise-modal`), `btnConfirmRevise`, and `btnCancelRevision` explicitly verify viewer access and reject mutations with explanatory toasts.
  - When viewing details of a read-only tenancy, the save and revise buttons are hidden from the DOM.
- **Input Sanitization & Anti-Negative Guards**:
  - Direct rent, advance, and all utility amounts/rates validate against negative entries before dispatching to Supabase Cloud.
  - Rent revision modal validates that the new rent is strictly positive, different from the current base rent, and that custom dates cannot be in the past.
- **Yearly Cycle Date Formatting**:
  - When `billing_cycle === 'yearly'`, the displayed recurring date incorporates the tenancy's start month (e.g. `4th April of every year`) rather than an ambiguous bare day string.

### 9. Full-App 22-Screen Autonomous Sweep Audit
- **Complete Route & Button Verification**:
  - Swept all 22 application screens (`#screen-1` through `#screen-22`).
  - Confirmed that all 91 button IDs in `index.html` have active event listeners and functional click handlers.
  - Confirmed all 8 modals (`modal-record-payment`, `modal-generate-bill`, `modal-revise-rent`, `modal-delete-account`, `modal-about-app`, `modal-contact-support`, `modal-share-receipt-choice`, `modal-selective-share`) have dedicated close triggers, backdrop dismissal, and global Escape key trapping.
  - Confirmed all forms have submit-prevention guards (`onsubmit="return false;"`) preventing full-page reloads on mobile keyboard Enter key taps.
- **Cross-Screen Origin Navigation Integrity**:
  - Payment Voucher Screen (`#screen-21`) back and done handlers (`#btn-receipt-back`, `#btn-receipt-done`) now dynamically check `state.previousScreen` to return to Screen 18 (Archived Tenancy Details) or Screen 19 (All Past Payments History) when launched from those flows, preventing accidental routing to the Dashboard.
- **DOM & Element Lookup Sanitization**:
  - Cleaned up obsolete element lookups (`cloud-status-banner`, `cloud-banner-user-email`, `display-owner-email`, `receipt-status-pill`, `receipt-stamp-pill`), leaving 0 unhandled lookups or runtime warnings.

### 10. Screen 13 Meter Reading Validation Parity
- **Validation Guard**:
  - Validates that current water meter reading cannot be less than the previous reading (`currWater < prevWater`), matching the existing electricity meter check (`currElec < prevElec`).
  - Displays a clear warning toast (`⚠️ Current water reading ({currWater}) cannot be less than previous reading ({prevWater})`) and halts bill calculation, preventing negative utility unit computations and corrupted ledger entries.

### 11. Hash Restoration Boundary, Viewer Screen 11 Guard & Supabase Password Reset Parity
- **Hash Restoration Boundary (`#screen-22`)**:
  - Fixed boot/reload URL hash check to allow screen numbers up to 22 (`screenNum <= 22`), ensuring direct links or browser refreshes on Screen 22 (Family Sharing) load cleanly without resetting to Dashboard.
- **Screen 11 Viewer Permission Defense-in-Depth**:
  - Added viewer access guard in `navigateToScreen(11)` to block direct transitions to Edit Tenancy when viewing a read-only shared property.
- **Functional Cloud Password Reset Dispatch**:
  - Implemented `resetUserPassword(email)` via Supabase Auth API (`supabase.auth.resetPasswordForEmail`).
  - Screen 20 Forgot Password trigger now validates the email input and dispatches the genuine Supabase reset email with immediate feedback.

---

## 44. PWA Installability Architecture, App Icons, Native Contact Picker & Settings Footer Cleanup

### 1. Settings Footer Branding Removal
- **Change**: Removed the obsolete footer (`Rental Buddy v1.0.0 Crafted using Vroxal Design`) from the bottom of Screen 16 (Settings), leaving a clean, spacious surface matching the fintech design guidelines.

### 2. Native Device Contact Picker Integration
- **Mobile Integration (`navigator.contacts.select`)**:
  - Tapping the contact picker icon `[ 👤+ ]` on Step 1 (`#btn-pick-contact`) or Edit Tenancy (`#btn-edit-pick-contact`) now invokes the device's native contacts sheet on supported mobile browsers (Chrome on Android, iOS Safari PWA).
  - Automatically extracts the selected contact's phone number, sanitizes to a 10-digit number (stripping country codes such as `+91` or leading `0`), and populates the field with reactive input event dispatch.
  - If the tenancy or tenant name field is empty, automatically populates the contact's name.
- **Desktop & Unsupported Browser Fallback**:
  - Replaced the previous mock `"John Doe (9812345678)"` toast with clear guidance: `"📱 Device Contact Picker is available on mobile browsers (Android Chrome & iOS PWA). Please enter the 10-digit number directly."`
  - Automatically focuses the phone number field with the numeric keypad ready.

### 3. PWA Installability & App Icon Architecture
- **Brand App Icon**:
  - Generated pixel-perfect app icons directly matching the About modal icon (vibrant `#5452EC` rounded squircle with white house outline):
    - `favicon.svg` (scalable vector icon)
    - `favicon.png` (48×48)
    - `icon-192.png` (192×192 standard PWA icon)
    - `icon-512.png` (512×512 standard PWA icon)
    - `icon-maskable-192.png` & `icon-maskable-512.png` (maskable adaptive icons with safe-zone margin for Android adaptive icon shapes)
    - `apple-touch-icon.png` (180×180 for iOS home screen bookmarking)
- **Web App Manifest (`/manifest.json`)**:
  - Full PWA compliance: `standalone` display mode, `portrait-primary` orientation, theme color `#5452EC`, background color `#EFF0FA`, and all icon declarations (`any` and `maskable`).
- **Service Worker (`/sw.js`)**:
  - Implements app shell precaching, stale-while-revalidate for static assets, network-first with cache fallback for dynamic resources, and automatic activation.
- **In-App PWA Install Trigger (Settings Screen)**:
  - Added an interactive `"Install App (PWA)"` item in Settings (`#item-install-pwa`) with dynamic status chip (`Install` / `Installed ✔`).
  - Automatically captures the `beforeinstallprompt` event and allows one-tap home-screen installation.
  - Detects standalone mode (`display-mode: standalone`) and gives platform-specific installation instructions for iOS Safari and desktop Chrome.

---

## 45. Offline Read-Only Access, Collision Prevention & Supabase Realtime Multi-User Sync Architecture

### 1. The Offline Collision Prevention Problem & Solution
- **The Financial Integrity Risk**: Blindly recording payments, bills, or rent changes while offline causes severe race conditions (the "Double-Payment" / "Phantom Advance" problem) when multiple landlords, co-hosts, or family members use the app simultaneously.
- **The Solution (Two-Tier Offline Architecture)**:
  1. **Tier 1 (Read-Only Offline Access)**: The app loads instantly offline. All tenancies, tenant contacts, monthly billing ledgers, and payment vouchers are cached locally in `localStorage` (`rb_cache_tenancies_*`, `rb_cache_bills_*`, `rb_cache_payments_*`) and remain fully inspectable without internet.
  2. **Tier 2 (Online-Mandatory Mutations)**: All balance-affecting operations (`Record Payment`, `Generate Bill`, `Create Tenancy`, `Edit Tenancy`, `Revise Rent`, and `Family Share invitations`) strictly require an active internet connection.

### 2. Offline Notice Modal & Top Status Banner
- **Persistent Sticky Status Banner (`#offline-indicator-banner`)**:
  - Automatically slides down at the top of the mobile frame when offline: `📡 Offline Mode • Read-Only (Cloud sync paused)`.
  - Disappears automatically upon reconnecting.
- **Offline Explanation Modal (`#modal-offline-notice`)**:
  - Displays when the app detects an offline state or when a user attempts a write action while offline.
  - Transparently explains why live transactions are paused: *"To protect your ledgers and prevent data collisions with other family members or co-hosts, recording transactions requires an active connection."*
  - Summarizes everything the user can still do offline (view cached ledgers, receipts, tenancy details).
  - Dismiss button: `"Got It • Browse Read-Only"`.
- **Auto-Recovery on Reconnect**:
  - Listening to `window.addEventListener('online')` automatically dismisses the offline banner and triggers an immediate background `syncDashboardFromCloud()` with a celebratory toast (`⚡ Back online! Reconnected & syncing with Supabase Cloud...`).

### 3. Supabase Realtime WebSockets for Multi-User Live Sync
- **Implementation**:
  - Built `initSupabaseRealtime(onDataChanged)` in `src/supabase.js` subscribing to live `postgres_changes` across `tenancies`, `payments`, `bills`, `rent_revisions`, and `family_shares`.
- **Zero-Stale-Screen Guarantee**:
  - When User A records a rent payment on their phone, User B's device receives the WebSocket event within milliseconds, automatically re-synchronizing the dashboard, ledger balances, and vouchers without requiring manual page reload.
  - Eliminates stale ledger calculations and prevents co-hosts from collecting rent for already-settled cycles.

---

## 46. Authentication Screen Clean Branding & Action Button Standardization

### 1. User-Facing Auth Copy Standardization
- **Problem Resolved**: Exposing underlying infrastructure provider branding (e.g. "Supabase") in user-facing buttons, badges, and system toasts creates user confusion and dilutes Rental Buddy's brand cohesion.
- **Action Buttons (`#btn-submit-auth`)**:
  - Sign-in Mode: Standardized to `"Sign In"`.
  - Sign-up Mode: Standardized to `"Create Account"`.
  - Pending/Loading States:
    - Sign-in: `"Signing In..."`.
    - Sign-up: `"Creating Account..."`.
  - Mode Switch Buttons (`#btn-toggle-auth-mode`):
    - When on Sign In: `"Create Account"`.
    - When on Sign Up: `"Sign In"`.
- **Top Badge (`.auth-badge-cloud`)**:
  - Updated from `"⚡ Cloud First • Supabase Auth"` to `"⚡ Cloud Synced & Secure"`.
- **Toast Notifications**:
  - Cleaned to natural product language (e.g. `"Account created successfully!"` and `"🔑 Password reset link dispatched to user@example.com"`).

---

## 47. Profile Full Name Propagation & UI Display Architecture

### 1. The Discarded Full Name Issue & Resolution
- **Problem**: When a user registered with a full name during sign up, Supabase Auth stored it in `user_metadata.full_name`. However, subsequent profile synchronization logic in `syncUserProfile` defaulted fallback profiles to `email.split('@')[0]`. This caused family sharing invitation cards and alert banners to render raw email prefixes (e.g., `user` instead of `Ramesh Sharma`).
- **Resolution**:
  - `syncUserProfile` now extracts `user_metadata.full_name || user_metadata.name` and ensures `profiles.full_name` is backfilled and kept in sync with the user's authentic name.
  - `signUpUser` passes `cleanFullName` into both `auth.options.data` and the immediate profile record.

### 2. Settings Screen User Account Banner Hierarchy
- **Layout Specification (`#item-user-account`)**:
  - **Full Name (`#current-user-name-display`)**: Displayed as the primary bold headline (`15px`, bold `#0E1326`).
  - **Email Address (`#current-user-email-display`)**: Displayed directly below in smaller font (`12px`, `#52586E`).
  - **Role Badge (`#current-user-role-badge`)**: Positioned neatly below (`👑 Admin (Owner)` or `👨‍👩‍👧 Family Member (Viewer)`).
  - **Sign Out Action (`#btn-settings-logout`)**: Maintained on the right with danger red accent (`#DC2626`).

### 3. Family Sharing Requests & Collaboration Cards
- **Incoming Shared Requests & Active Shares**:
  - Resolves `admin_name` by querying the property owner's profile (`profiles.full_name`), replacing stale email username tags with their real display name.
  - Card displays:
    - Primary bold title: `${ownerName}` (e.g. `Ramesh Sharma`).
    - Subtitle: `${ownerEmail}` (e.g. `ramesh@example.com` in `11.5px` muted slate).
- **Dashboard Incoming Share Alert Banner**:
  - Greets the user naturally: `<strong>Ramesh Sharma</strong> invited you to view their properties!`.
- **Outgoing Shares**:
  - Displays recipient's full name (`share.member_name || share.member_email`) with secondary email label.

---

## 48. Payment Receipt Ticket Voucher — WhatsApp Brand Button Architecture

### 1. Dedicated WhatsApp Action Button (`.btn-whatsapp`)
- **Problem Resolved**: The voucher screen's secondary action button previously displayed `"WhatsApp Receipt"` with standard muted gray-lavender styling. This was redundant and lacked the recognizable instant-share affordance of WhatsApp.
- **Button Styling & Visual Identity**:
  - **Label**: Simplified cleanly to `"WhatsApp"`.
  - **Background**: Authentic WhatsApp emerald green gradient (`linear-gradient(180deg, #25D366 0%, #1EBE5D 100%)`).
  - **Typography & Icon**: Crisp pure white text (`#FFFFFF`, weight `700`) with matching white stroke WhatsApp icon (`19px × 19px`).
  - **Tactile Elevation**: Soft green ambient shadow (`0 6px 20px rgba(37, 211, 102, 0.38), 0 2px 4px rgba(30, 190, 93, 0.25)`), elevating on hover/focus.
- **Responsive Sizing in Two-Button Action Bar**:
  - Proportional flex ratio (`flex: 1.1; min-width: 115px; padding: 0 14px;`).
  - Narrow 360px viewport: `min-width: 100px; padding: 0 10px; font-size: 13.5px;` ensuring zero wrap next to the `Done` button.




