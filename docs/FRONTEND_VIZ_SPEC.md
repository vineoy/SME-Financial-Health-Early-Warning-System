# Frontend Visualization Spec (locked for Phase 5, per your note #1)
Goal: detailed yet simple/meaningful, consistent everywhere.

## Design tokens (never change per page)
- Bands: green `#16a34a` Healthy <20%, yellow `#eab308` Watch 20-50%, orange `#f97316` At-Risk 50-75%, red `#dc2626` Critical >75%
- One gauge component reused on dashboard + detail. Same thresholds, same labels.
- Numbers: risk as % (1 decimal), money in INR lakhs with 2 decimals, ratios 3 decimals. Same formatting utils.
- Language: every ratio gets plain-English subtitle. e.g. "Interest Expense Ratio 0.42 - Rs 42 of every Rs 100 revenue goes to interest".

## Required views
1. Dashboard cards: company name, band badge, risk %, sparkline of last 5 assessments, "updated x ago".
2. Company detail: hero gauge + health_score (100-risk), trend line (all assessments), SHAP top-5 as horizontal bars with +/- direction + one-line why ("High borrowing pushed risk UP by 12pts"), warning cards (rule-based: liquidity crunch, deteriorating trend, negative equity), raw-input table (what user entered, auditable).
3. New assessment wizard: 3 steps (Revenue & Profit / Assets & Cash / Liabilities & Debt), live derived-ratio preview, coverage % bar (blocks submit if <90% raw fields), no ratio typing.
4. Consistency rules: same band colors, same gauge, same factor-card layout, same empty states ("No assessments yet - add first"). No ad-hoc charts.
