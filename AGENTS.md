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



