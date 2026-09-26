# CentraLog UI design instruction

## Role and objective

Act as a senior product designer and frontend engineer for CentraLog. Improve the existing React interface so it feels like a coherent, professional asset management application and works comfortably on desktop, tablet, and phone. Start by examining the actual screens and code, then make specific, evidence-based improvements to layout, visual hierarchy, navigation, readability, forms, tables, feedback, and accessibility. Treat the current product behavior as working and authoritative.

## Source of truth and scope

- Work on the presentation layer in `centralog-ui/src`: component markup, display-only state needed for navigation, styling, and accessible interaction. Reuse the existing React and CSS setup unless a change has a clear benefit.
- Preserve procurement and asset workflows exactly: form data and validation, submissions, API calls and payloads, lifecycle transitions, transfer, maintenance, disposal, import, sticker queue, verification, ledger, audit, authentication, role checks, and permissions. Keep working actions discoverable at every supported screen size.
- Do not change API endpoints or contracts in `centralog-ui/src/services/api.ts`, or business logic in `CentraLog.API`, `CentraLog.Core`, or `CentraLog.Infrastructure` as part of a design pass. Do not change database migrations or schema.
- `centralog-ui/src/App.tsx` mixes layout with workflow handlers. Rearrange its rendered structure carefully while preserving handler behavior, conditions, field names, values, and role-based visibility. Existing print views and `centralog-ui/src/styles/print.css` must continue to work.
- Respect existing user changes. Keep the design refactor focused; do not use it as a reason to rewrite unrelated logic.

## Design approach

Before choosing a visual direction, compare at least two plausible approaches against the product's users, school context, existing workflows, small-screen behavior, accessibility, and implementation cost. Argue against the preferred approach: identify where it could mislead users, hide an action, add clutter, or weaken readability. Choose the stronger direction based on observable tradeoffs, record the reasoning briefly, and revisit the choice after seeing the rendered result. Do not treat taste alone as evidence.

1. Audit each major view before editing: login, dashboard, procurement form, inventory/search, asset details, transfer modal, financial ledger, audit report, and sticker queue. Identify concrete issues such as misplaced content, crowded controls, inconsistent spacing, weak hierarchy, overflow, inaccessible labels, or hidden actions. Prioritize issues by user impact.
2. Establish a consistent visual system for typography, spacing, surfaces, borders, states, and responsive layout. Use existing theme tokens or update them consistently across Obsidian, Light, and DMC. Avoid decorative changes that reduce clarity or contrast.
3. Give the app a clear structure: recognizable header and navigation, meaningful page headings, grouped related controls, and a primary action that is easy to find. Use semantic HTML and avoid extra wrapper elements when layout or semantics do not require them.
4. Design for narrow screens deliberately. Navigation and account actions must remain reachable and understandable by touch and keyboard. Do not rely on hover or tiny icon-only controls. Forms should reflow without clipped labels or inputs. Data-dense views should retain context and actions through an intentional compact layout or accessible horizontal scrolling.
5. Preserve legibility and accessibility: visible focus states, useful labels and button names, logical tab order, sufficient contrast in all themes, clear loading/empty/error states, and motion that respects reduced-motion preferences. Dialogs and menus should have usable dismissal and focus behavior.
6. Keep print and report presentation suitable for audit use. Screen-only navigation must not intrude into printed output, and ledger data must remain readable.

## Verification for future UI work

- Compare behavior before and after at desktop, tablet, and phone widths, including touch navigation, long text, empty/loading states, and every role-specific view available for testing.
- Check that procurement and other existing actions still call the same handlers with the same data and respect the same permission gates. Run the frontend build, lint, and relevant existing tests after implementation; investigate failures rather than masking them.
- Review the rendered result, not just the code. Report the design issues found, what changed, and any unverified states or remaining risks.
