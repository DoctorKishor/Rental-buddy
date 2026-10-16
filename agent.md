# Rental Buddy — AI Agent Instructions & Design Baseline

Please refer to the comprehensive design system and engineering specifications defined in [AGENTS.md](./AGENTS.md).

### Quick Summary & Strict Agent Directives:
- **Brand**: Rental Buddy
- **Design Tokens**:
  - Background Canvas: `#EFF0FA`
  - Cards: `#FFFFFF`, `border-radius: 20px`, padding `18px 20px` (or `14px 16px` on 360px)
  - Primary Color: `#5452EC` (Active: `#4340D8`)
  - Typography: `'Plus Jakarta Sans'`, sans-serif
  - Headings: Deep Navy `#0E1326`
  - Body Text: Slate `#52586E`
- **Strict Anti-Collapse Button Architecture**:
  - All buttons (`.btn`) MUST have `height: 54px; min-height: 54px; flex-shrink: 0;`.
  - All bottom action bars (`.bottom-bar`) MUST have `flex-shrink: 0;`.
  - Buttons must pop up with elevated shadows (`0 8px 24px rgba(84, 82, 236, 0.35)`).
  - Two-button rows must share the exact same height (`54px`) and never look awkwardly sized or disproportionate.
- **360px Minimum Viewport Guarantee**:
  - The app must support down to `360px` width without any text, button, or card component wrapping awkwardly or feeling congested.
  - Screen content must have `overflow-y: auto` so that the bottom bar is never crushed regardless of device height.
- **Native OS System Bars (Status & Gesture Bar) Exclusion**:
  - Never simulate the bottom center black gesture bar or top status bar (time, wifi, battery, punchhole) in DOM. These belong to the native mobile OS.
- **Form Controls & Date Picker**:
  - Inputs: White 16px radius, 54px height, 1.5px subtle border `#E2E4F2`, focus `#5452EC`.
  - Date Picker: Recurring billing date MUST be an interactive calendar date picker, NOT a static text box.
  - Dual split fields (Rent Amount & Advance Amount) on a 2-column grid.
- **Dynamic Utility Bill Type Switching**:
  - Switching between `Flat` and `Meter Reading` must dynamically reconfigure the input fields (Flat shows Bill Amount; Meter Reading shows Price Per Unit + Current Meter Reading).
- **Typographic Widow/Orphan Prevention**:
  - Apply `text-wrap: balance;` to eliminate single-word orphan line wraps (e.g. "it.").
- **Dashboard & Empty State**:
  - Top header with gear (settings) and plus (add tenancy).
  - "No Tenancy" empty state card with house icon and "Create Tenancy" CTA.
- **Git Commit & Push Protocol (Strict)**:
  - Every change must be committed and saved locally to Git.
  - MUST PUSH ONLY when the user gives an explicit command to push. Never push automatically.
- **Self-Learning / Non-Destructive Update Rule**:
  - Whenever new user preferences, UI elements, or architecture rules are learned, agents MUST automatically add them to `AGENTS.md` non-destructively without removing or overwriting previous lines.
- **Home Dashboard & Multi-Tenancy Cards**:
  - Dynamic Screen Title: "Your Tenancy" (single/empty) vs "Your Tenancies" (multiple).
  - Status Badges: Rose (Overdue), Amber (Due today/Billing today), Blue (Upcoming), Green check (No Past Dues).
  - Action Buttons: Single lavender pill for Record Payment / Generate Bill; Dual side-by-side peach ("Generate Bill & Share") and lavender ("Record") with zero-wrap down to 360px.
  - Recent Activity Ledger: Segmented toggle between `[ Payments | Bills ]` resolving the Figma mismatch and providing landlords complete visibility over cashflow and invoices.
  - Fixed Figma empty state typo: "see them here" instead of "see the here".
  - Interactive bottom sheets for "Record Payment" and "Generate Bill & Share" (with WhatsApp share link simulation).
- **Tenancy Details & Month-Wise / Year-Wise Status (Screen 10)**:
  - Top header with back arrow, centered property title, and 3-dots action menu (`Edit`, `Archive`, `Delete`).
  - Total Summary Card: `Total Bill Paid` with count badge, big amount, monthly rent rate, and 2-column metrics.
  - Landlord Month-Wise Status Grid: Replaces rigid flat history with a high-clarity 12-month visual payment tracker with year picker (`2082 BS (2025/26)`), summary chips (`Paid`, `Due`, `Upcoming`), and month cards with settlement details.
  - Segmented toggle between `[ Month-wise | History ]` to support both monthly status and granular transaction logs.
  - Fixed Figma empty state typo: "see them here once they are generated" instead of "see the here".
  - Sticky bottom action bar with `Generate New Bill` button (`54px` min height).
- **Edit Tenancy & Future Cycle Rent Revision (Screen 11)**:
  - Navigation via "Edit" in 3-dots menu or review widget.
  - Revise Rent Action: Button placed directly beside Rent Amount label.
  - Preserves Historical Ledger: Rent revisions are scheduled to take effect from a specific upcoming cycle (e.g. Next Cycle / 1 Baisakh 2083), protecting past billing records from corruption.
  - Scheduled Revision Banner: Displays scheduled increment amount, effective cycle, and instant cancel action.
  - Sticky bottom action bar with `Save Changes` button (`54px` min height).
- **Dedicated Record Payment Page & Month Settlement (Screen 12)**:
  - Opens dedicated full-page screen instead of simple modal.
  - Dynamic Month Settlement Logic:
    - *Pending Months Present*: Displays amber warning banner and selectable month checkboxes allowing landlord to manually select which overdue month(s) are settled.
    - *No Past Dues*: Defaults to current billing cycle with green confirmation badge, plus `+ Settle for another month / Advance` expansion for upcoming cycles.
  - Split Payment Mode: Cash vs Online, with dynamic online sub-channels (`GPay / UPI`, `Bank / NEFT`, `Other App`) and reference input.
  - Interactive Date Picker: Native calendar integration with formatted human-readable date.
  - Amount shortcuts (`Full Due`, `Base Rent`, `Round amount`), WhatsApp receipt toggle, and instant synchronization to dashboard recent payments ledger.
  - Sticky bottom action bar with `Confirm & Save Receipt` pill button (`54px` min height, zero shrink).
- **Modal Lifecycle, Scoping & Universal Overlay Visibility Protocol (Rule 20)**:
  - Strict CSS: `.hidden` and `.modal-overlay.hidden` MUST have `display: none !important; pointer-events: none !important; visibility: hidden !important;`.
  - DOM Scoping: Every modal sheet MUST be nested inside its parent `<section class="screen">` rather than loose in `.screens-slider`.
  - 4 Dismissal Vectors: Close button (36px tap target), backdrop tap, handle click, and Escape key.
  - Screen transitions automatically dismiss all modals and menus to prevent orphaned overlays.




