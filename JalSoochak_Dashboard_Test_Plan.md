# JalSoochak Dashboard

## Master Test Plan

Version 1.0  |  Status: Draft for review  |  Prepared: 09 October 2026

Basis: User-provided Dashboard Test Scenario document (TS-001 through TS-035). This plan defines execution strategy; it does not assert that tests have been executed.

## 1. Purpose and objectives

Validate that the JalSoochak dashboard displays reliable information and provides correct navigation, filtering, visualization, links, and failure handling. Confirm consistency of KPI, map, table, and chart results when geographic scope and date filters change.

## 2. Scope

In scope: dashboard header and language selection; date filters; administrative (State, District, Block, Gram Panchayat, Village) and departmental (Zone, Circle) selectors; top KPIs and previous-day comparisons; map and drill-down; Performance Summary; Regularity and Quantity Performance charts; Reading Submission Status and Rate; footer links and information; responsive/browser compatibility; dashboard load and network-error handling. Out of scope unless separately approved: user login workflows behind footer links, data ingestion and backend calculation algorithms, security penetration testing, and mobile-native applications.

## 3. Test approach

Execute manual functional and visual verification against the approved design and business requirements. Use positive, negative, boundary, and cross-filter combinations. Validate displayed figures against an approved reference dataset or trusted API/database extracts where access is provided. Repeat key checks across hierarchy levels, date ranges, languages, and supported browsers. Use browser developer tools to inspect failing network requests and loading/error states. Automate stable regression scenarios if an automation framework is available.

## 4. Coverage and traceability

| Feature / module | Scenario IDs |
| --- | --- |
| Header, language and filters | TS-001–TS-008 |
| Top KPIs | TS-009–TS-011 |
| Map visualization and navigation | TS-012–TS-016 |
| Performance Summary | TS-017–TS-019 |
| Regularity Performance | TS-020–TS-022 |
| Quantity Performance | TS-023–TS-025 |
| Reading Submission Status and Rate | TS-026–TS-029 |
| Footer | TS-030–TS-033 |
| Compatibility and resilience | TS-034–TS-035 |

## 5. Test environment and prerequisites

Environment URL/build: TBD. QA access: public dashboard and any required test accounts. Supported browsers, operating systems, viewport sizes, language list, and performance SLA: confirm with product team. Prerequisites: deployed stable build; working APIs and geographic data; agreed UI design; reference data with known hierarchy mappings; issue tracker; test evidence repository.

## 6. Test data requirements

Prepare valid and invalid date ranges, single-day and multi-day ranges, data-rich and empty periods; administrative and departmental selections at each supported level; regions with zero, normal, and anomalous readings; reference KPI values and previous-day values; search text with exact, partial, and no matches; multiple languages; slow/failed network conditions. Expected business rules and numerical tolerances require product confirmation.

## 7. Execution sequence

Smoke test dashboard access and header → validate filters and scope selection → verify KPIs and comparisons → validate map hierarchy and toggles → verify summary and charts → test footer links → run cross-browser/responsive checks → simulate slow and failed requests → perform regression after defect fixes.

## 8. Entry criteria

Test environment accessible; release candidate deployed; core APIs operational; scenarios reviewed; test data and expected outcomes available; test owners and defect workflow agreed.

## 9. Exit criteria

All 35 scenarios executed or formally deferred; no unresolved blocker/critical defects; high-priority defects accepted by stakeholders or fixed and retested; key data consistency checks pass; evidence and defect references recorded; test summary approved. Exact pass-rate threshold: TBD.

## 10. Defect management

Log each defect with title, environment/build, scenario ID, steps, expected versus actual result, severity, screenshots or network evidence, and reproducibility. Proposed severity: Blocker (dashboard unusable), Critical (major data integrity or navigation failure), Major (feature broken), Minor (limited impact), Cosmetic (presentation only). Retest fixes and run impact-based regression.

## 11. Risks and dependencies

Risks: missing reference dataset may prevent numerical validation; unstable APIs or inconsistent geography mappings may affect multiple widgets; unspecified browser support, performance thresholds, language persistence rules, and filter precedence may block definitive pass/fail. Mitigate through requirement sign-off, seeded test data, build freeze, and documented assumptions.

## 12. Roles and responsibilities

QA owner: plan, execute, document evidence and defects (TBD). Developer: investigate and resolve issues (TBD). Product/BA: approve expected behavior, labels, calculations and tolerances (TBD). Release owner: accept exit report and residual risks (TBD).

## 13. Deliverables and reporting

Deliverables: approved test plan, scenario/test case execution sheet, evidence, defect log, regression results, and test closure report. Track planned/executed/passed/failed/blocked/not-run counts by module, open defects by severity, and unresolved requirement questions.

## 14. Approval

QA Lead: __________________  Date: __________
Product/BA: _________________  Date: __________
Release Owner: ______________  Date: __________

## Appendix A. Scenario inventory

TS-001 — Verify the dashboard header, JalSoochak logo, and dashboard title.

Expected: Dashboard header, JalSoochak logo, and title are displayed correctly and aligned as per the design.

TS-002 — Verify language selector, language switching, persistence, and accessibility

Expected: Language selector works correctly, selected language is applied and persists after refresh, and all language options are accessible.

TS-003 — Verify filter options, including quick ranges, start date, end date, Clear, and Apply.

Expected: Filters should allow users to select date ranges, clear selections, and apply the selected filters correctly to update the dashboard data.

TS-004 — Verify Administrative search and hierarchical dropdown selection.

Expected: User can search and select State, District, Block, Gram Panchayat, and Village, with relevant options displayed correctly.

TS-005 — Verify Departmental search and hierarchical dropdown selection.

Expected: User can search and select Zone and Circle, with relevant options displayed correctly.

TS-006 — Verify switching between Administrative and Departmental filters.

Expected: User can switch between both options and the corresponding search/dropdown fields are displayed correctly.

TS-007 — Verify search functionality for Administrative and Departmental filters.

Expected: Search returns relevant matching results and handles no-result searches correctly.

TS-008 — Verify clearing/closing the filter selection.

Expected: Selected filters are cleared or the dropdown closes correctly as per the expected behavior.

TS-009 — Verify the top KPIs: Schemes Supplying Water, Quantity in MLD, Quantity in LPCD, Regularity, and Critical Schemes, including values, units, and info icons.

Expected: All top KPIs are displayed correctly with appropriate labels, values, units, and information icons.

TS-010 — Verify previous-day comparison and indicators for the KPIs(Schemes Supplying Water, Quantity in MLD, Quantity in LPCD, Regularity).

Expected: Previous-day comparison values and increase/decrease indicators are displayed correctly.

TS-011 — Verify top KPIs (Schemes Supplying Water, Quantity in MLD, Quantity in LPCD, Regularity, and Critical Schemes) data updates based on applied filters.

Expected: All applicable KPI values and comparisons are updated correctly based on the selected filters.

TS-012 — Verify map visualization, geographical boundaries, labels, legend, color coding, and expand full screen.

Expected: Map is displayed correctly with appropriate boundaries, labels, legend ranges, and color coding based on the data.

TS-013 — Verify map drill-down hierarchy from State → District → Block → Gram Panchayat → Village.

Expected: User can drill down through each administrative level, and the map displays the corresponding geographical area and data correctly.

TS-014 — Verify Quantity/Regularity toggle on the map.

Expected: User can switch between Quantity and Regularity, and the map data, color coding, and legend update accordingly.

TS-015 — Verify map data updates based on applied dashboard filters.

Expected: Map visualization and values update correctly according to the selected filters.

TS-016 — Verify map interaction and drill-up/navigation.

Expected: User can select map regions, navigate between hierarchy levels, and return to the previous/higher level correctly.

TS-017 — Verify Performance Summary KPIs – Regularity (%), Quantity (MLD), Quantity (LPCD), and Household for each administrative area.

Expected: Performance Summary displays the correct administrative areas with corresponding KPI values, units, and formatting.

TS-018 — Verify Performance Summary data based on applied filters and drill-down level.

Expected: Performance Summary updates correctly based on selected filters and administrative hierarchy level (State → District → Block → Gram Panchayat → Village).

TS-019 — Verify sorting, scrolling, and display of Performance Summary records.

Expected: User can sort applicable columns and scroll through all records correctly, with data remaining properly displayed and aligned.

TS-020 — Verify Regularity Performance chart, including geographical data, percentage values, labels, and chart display.

Expected: Chart displays the correct geographical areas with corresponding Regularity (%) values, labels, and proper formatting.

TS-021 — Verify Geography/Time selection and chart behavior, including scrolling.

Expected: User can switch between Geography and Time views, and the chart updates correctly with relevant data; scrolling works correctly when additional data is available.

TS-022 — Verify Regularity Performance data based on applied filters and drill-down level.

Expected: Chart data updates correctly based on selected filters and the applicable administrative hierarchy level.

TS-023 — Verify Quantity Performance chart, including geographical data, Quantity (LPCD), Demand, labels, and chart display.

Expected: Chart displays the correct geographical areas with corresponding Quantity (LPCD) and Demand data, labels, and proper formatting.

TS-024 — Verify Geography/Time selection and chart behavior, including scrolling.

Expected: User can switch between Geography and Time views, and the chart updates correctly with relevant data; scrolling works correctly when additional data is available.

TS-025 — Verify Quantity Performance data based on applied filters and drill-down level.

Expected: Chart data updates correctly based on selected filters and the applicable administrative hierarchy level.

TS-026 — Verify Reading Submission Status chart, including Compliant Submissions and Anomalous Submissions, chart values, legend, and info icon.

Expected: Chart displays the correct submission status data with appropriate segments, legend, and information details.

TS-027 — Verify Reading Submission Status data based on applied filters and drill-down level.

Expected: Chart updates correctly based on selected filters and the applicable administrative hierarchy level.

TS-028 — Verify Reading Submission Rate chart, including percentage values, geographical labels, chart display, scrolling, and info icon.

Expected: Chart displays the correct Reading Submission Rate (%) for each geographical area with proper labels, formatting, scrolling, and information details.

TS-029 — Verify Reading Submission Rate data based on applied filters and drill-down level.

Expected: Chart updates correctly based on selected filters and the applicable administrative hierarchy level.

TS-030 — Verify footer Quick Links – Sub-Divisional Officer Login, Section Officer Login, System Users Login, JalSoochak Website, PHED Assam, JJM Assam, and Dashboard Glossary.

Expected: All Quick Links are displayed correctly and navigate to the appropriate page/website when clicked.

TS-031 — Verify footer social media links/icons (X and LinkedIn) and email icon.

Expected: All social/email icons are displayed correctly and redirect/open the appropriate destination when clicked.

TS-032 — Verify footer Contact Us details and applicable links.

Expected: Email, contact number, and organization/address details are displayed correctly, and applicable links work as expected.

TS-033 — Verify footer copyright, PHED Assam, Arghyam, and visitor count section.

Expected: section.Copyright and organization/developer information are displayed correctly, applicable links navigate to the correct destination, and visitor count is displayed correctly.

TS-034 — Verify dashboard responsiveness and browser compatibility

Expected: Dashboard should display and function correctly across supported screen sizes, resolutions, and browsers without UI distortion or functionality issues.

TS-035 — Verify dashboard load performance and network failure handling

Expected: Dashboard should load within the expected time and handle slow/failed network requests gracefully with appropriate loader, error message, or retry behavior.
