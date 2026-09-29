# CentraLog UI polish roadmap

This roadmap follows `../AGENTS.md` and the three palettes in `DESIGN_PALETTE.md`. The login page is the first completed design pass. The remaining work follows the user's chosen file-by-file approach, while preserving procurement, asset lifecycle, authentication, role checks, API requests, and print behavior.

## How the direction was chosen

**Option A: polish files one at a time.** This makes ownership and review clear. `App.tsx` contains several screens, so finish it in two focused passes: dashboard and shell first, then procurement and inventory. The risk is inconsistent shared controls while later files wait; establish reusable styles in the first pass and check each subsequent file against them. **Use Option A, as chosen by the project owner.**

**Option B: polish the user journey in stages.** This could keep cross-screen journeys coherent sooner, but it spreads one design pass across several large components and makes procurement behavior harder to review in isolation. Keep it as a comparison, and reconsider only if file-by-file work produces repeated layout changes.

### Dashboard design decision

A permanent sidebar would make sections easy to scan, but it would narrow the existing inventory table and procurement form. The selected layout uses a compact header, a separate view row on wide screens, and one expandable menu on small screens. Its weakness is that account and utility actions become less visible on phones; check that the menu clearly exposes the role-appropriate views, sticker queue, refresh, theme choice, and sign-out whenever the dashboard is reviewed.

### Procurement and inventory design decision

Mobile cards could show each asset without sideways scrolling, but they would repeat the status, maintenance actions, selection control, and role conditions in a second layout. The selected table keeps one source of row behavior, adds a visible scroll cue and keyboard-focusable region, and makes the asset name a direct detail action. Its weakness is that later columns require a swipe on phones. The rendered phone review showed the first visible columns identify the asset and selection, while the cue and scrollbar make the remaining details discoverable. Revisit cards if real users routinely miss actions at the far edge.

## Phase sequence

**Current progress:** Phases 1–6 have received design and integration passes. The first follow-up priority, narrow phone and enlarged-layout resilience, now has a focused pass: 320–360px phone review plus a 240px CSS-viewport stress check found and corrected overflow and cramped content in the navigation, login, property toolbar, reports, sticker queue, and asset drawer. True 200% browser text zoom remains unverified because the available in-app browser did not change zoom when requested; the 240px check is only a stress proxy. Next is short or landscape screen review, followed by long-data/table checks and physical print preview. The inventory-staff row-shortcut role-label mismatch remains a separate functional issue. Details are in `UI_POLISH_PROGRESS.md`.

| Phase | Main `.tsx` files | Design outcome | Workflow boundary |
| --- | --- | --- | --- |
| 0. Baseline and shared rules | `App.tsx` and its styles | Capture its current desktop, tablet, and phone layouts in all three palettes. Establish reusable page width, spacing, type, buttons, focus, and navigation behavior. | Record current role-visible actions and their handlers before moving markup. Do not alter service contracts. |
| 1. Application shell and dashboard | `App.tsx` | Make header, page identity, role-aware navigation, theme control, account actions, dashboard metrics, and feedback clear and touch-friendly. Replace the crowded wrapping header with a deliberate compact navigation pattern. | Preserve sign-out, view switching, refresh, roles, and dashboard data loading. |
| 2. Finish `App.tsx`: procurement and inventory | `App.tsx` | Give the new-asset form a clear section and field groups; improve labels, image-upload affordance, validation feedback, search, selection, table hierarchy, and the bulk-transfer dialog. Keep inventory readable on phones without losing row actions. | Preserve field names, values, validation, submissions, selection, upload, transfer payloads, and permission gates. |
| 3. Asset inspection and property work | `AssetDetailSidebar.tsx`, `PropertyOverview.tsx` | Make the drawer fit narrow screens; distinguish facts, history, valuation, and dangerous actions. Reflow the fixed two-column property page, tabs, edit form, custodian dialog, and action feedback. | Preserve lifecycle actions, disposal confirmation data, edit payloads, verification, sticker queue, and role visibility. |
| 4. Reports and audit | `FinancialLedgerReport.tsx`, `AuditLogReport.tsx` | Align headings, filters, summaries, dense tables, dates, currency, loading/error/empty views, and print controls with the shared system. Keep columns understandable when scrolling on small screens. | Preserve calculations and report data, filtering, export, audit access, and printed content. |
| 5. Sticker queue and print review | `StickerQueueModal.tsx`, plus print styles | Make queue controls and item previews usable on phones; keep a stable print sheet with readable asset identifiers and QR symbols. Audit institution-specific text before changing it. | Preserve queue membership, remove/print actions, sticker data, and print layout behavior. |
| 6. Cross-screen integration | All active views; `LoginPortal.tsx` | Check transitions from sign-in through each role's reachable screens; make navigation, language, contrast, focus, loading, and feedback consistent. Revisit the completed login page only where the shared system requires it. | Compare behavior against the baseline and check every role-specific action remains reachable. |

## Inventory of every current `.tsx` file

| File | Roadmap disposition |
| --- | --- |
| `src/App.tsx` | Primary design work in phases 1 and 2; integration in phase 6. It contains most navigation, dashboard, procurement, inventory, and transfer UI. |
| `src/components/LoginPortal.tsx` | Phase-one login polish is complete; review again in phase 6 for shared navigation and palette consistency. Keep its authentication request unchanged. |
| `src/components/AssetDetailSidebar.tsx` | Phase 3 drawer and lifecycle-action presentation. Its fixed 460px width is a likely phone overflow risk. |
| `src/components/PropertyOverview.tsx` | Phase 3 property page, tabs, edit and reassignment dialogs. Its fixed `320px 1fr` content grid needs a small-screen layout. |
| `src/components/FinancialLedgerReport.tsx` | Phase 4 financial filters, dense ledger, export actions, and print layout. |
| `src/components/AuditLogReport.tsx` | Phase 4 read-only history and responsive table. |
| `src/components/StickerQueueModal.tsx` | Phase 5 queue dialog, sticker previews, empty state, and printable sheet. |
| `src/components/LoginModal.tsx` | No active import was found. Review whether this legacy alternate login should remain before doing visual work on it; do not alter or activate its authentication behavior as part of the design pass. |
| `src/context/AuthContext.tsx` | Support file, not a visual screen. Keep authentication and clearance logic unchanged; use its role states when checking designs. |
| `src/main.tsx` | Bootstrap file, not a visual screen. Review only if a presentation-level provider or style import needs integration. |
| `src/components/__tests__/AssetWorkflowBoundary.spec.tsx` | Verification file, not a visual screen. Use its role and lifecycle expectations as safeguards; update tests only when needed to verify a real UI behavior change. |

## Checks at the end of each phase

1. Compare the rendered result in signature green, white, and night at representative phone, tablet, and desktop widths, plus keyboard navigation and enlarged text. Watch for clipping, horizontal page overflow, hidden actions, and dialogs that cannot be dismissed.
2. Verify each affected role's available actions, empty/loading/error states, and the before/after handler, field-name, payload, and permission boundaries. Confirm printable pages separately where the phase touches reports or stickers.
3. Run the frontend build, targeted lint, and relevant existing tests. Report any pre-existing lint or test-harness failures separately from new issues. Record specific visual findings and unresolved risks before starting the next phase.

## Known content questions to resolve during the relevant phase

- Some interface copy uses technical terms where plain asset-management language would be clearer. Change display copy only after checking that it does not convey a required business distinction.
- Sticker content follow-up resolved the old `PROPERTY OF DENR / PENRO` line with `DMCCFI ASSET TAG`. This identifies the project without asserting legal ownership that the asset record does not establish.
- The sticker sheet displays `Not recorded` when property or serial identifiers are absent and uses the real asset ID for identification. Phase 6 applied the same truthful display rule to the property page and kept missing edit-form fields blank; a workflow test checks that an unchanged submission sends blank values instead of invented identifiers.
- Review strong legal/compliance wording against project requirements before changing it; visual polish must not silently turn display placeholders into asserted facts.
