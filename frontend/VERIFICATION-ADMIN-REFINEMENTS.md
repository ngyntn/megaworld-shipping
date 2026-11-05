# Admin refinements verification

- `npm run build`, `npm run typecheck`, and all four existing `npm test` checks pass.
- Browser checks used `scripts/qa-session.py` with an isolated temporary PocketBase database; existing demo/production records were not changed.
- Opening and closing the new-rate and import dialogs preserves the exact underlying table DOM node. The backdrop is translucent and blurred.
- A 1,215px editor body scrolls inside its 743px available region at a 907px viewport height; the document remains 907px high. Editor actions stay visible.
- Direct URL entry to the new-rate dialog also renders the rates screen underneath.
- Switching to Dashboard retains a window marker and performance time origin, confirming client navigation without a document reload.
- Selecting a month and POL updates the URL and table with the same document marker. Computed table scrollbar width is `none`.
- Selecting a custom cargo option writes the correct value into FormData.
- Updating a temporary 40HC rate from $1,100.50 to $1,325.50 updates the list after saving. History shows both revisions and the actual $225 increase.
- Production build validates the intercepted new/edit/import/history routes and direct-entry fallbacks.

Not exhaustively checked: every small-screen size, all schedule/settings write operations, and Excel import completion (existing backend behavior remains in place).

## Shared admin controls follow-up

- Added shared pagination, confirmation dialogs, and toast notifications. Page size is centralized at 8 for rates, schedules, history and import preview.
- Production build, TypeScript and the four frontend tests pass. Full backend verification passes, including added schedule tests for 8-item pages, exact totals, filtered totals and tenant isolation.
- Browser QA: schedule page 1 shows 8 of 10 rows; page 2 shows 2. Filtering to cancelled resets to page 1 with one matching row. All three filter controls measure 54px tall with one label each.
- Cancelling the confirmation leaves a schedule unchanged; confirming updates its status and shows the new toast. Saving catalog data shows a toast instead of an inline success banner.
- History with 10 revisions shows 8 rows then 2. Switching history pages preserves the exact underlying rates table DOM node. Its modal is centered on both axes at 1920px and 1280px viewport widths. New price, cost/margin and internal notes have separate columns.
- Catalog viewport measures 524px: a 44px header and eight 60px rows. Extra records scroll inside it with scrollbar width `none`, without pagination.
- All browser mutations used temporary QA databases. Production/demo data was untouched.
