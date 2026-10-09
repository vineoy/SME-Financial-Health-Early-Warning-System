# Phase 2 Findings - EDA + Honest Modeling Decision

Dataset: `data.csv` 6819 rows x 96 cols. Target `Bankrupt?`: 6599x0 / 220x1 (3.23%). 0 NaNs.
Columns have leading spaces - always `df.columns.str.strip()`.

## 1. Key EDA facts (verified locally, reproduce in Colab)
- Imbalance 30:1 -> optimize PR-AUC + Recall, never accuracy.
- Duplicates (corr >= 0.88, drop one):
  - `Debt ratio %` == `Net worth/Assets` (1.00) -> keep Debt ratio %
  - `Net Value Per Share A/B/C` identical (1.00) -> keep A only
  - `ROA A/B/C` + `Net Income to Total Assets` all corr 0.89-0.96 -> keep ONE
  - `Borrowing dependency` vs `Current Liabilities/Equity` (0.89) -> keep Borrowing dependency
  - `Persistent EPS` vs `Operating Profit Per Share` (0.88) -> keep Persistent EPS
- Zero-importance (safe drop): `Net Income Flag`, `Liability-Assets Flag`, `Current Liability to Current Assets`
- Weak alone but SME-friendly: `Current Ratio` rank ~85, `Operating Gross Margin` ~76, `Cash/Total Assets` ~64. Still keep 2-3 for UX trust + liquidity story, model uses stronger ones for signal.

## 2. YOUR NOTE #2 IS CORRECT - old plan was misleading
Filling 75 unseen ratios with training medians = model scores a "median company", not YOUR company.
Silent median-fill can flip a Red company to Green. Unacceptable for early-warning.

## 3. Revised decision (locked): RAW-INPUT + DERIVE, NO median-fill
- Train final XGBoost ONLY on ~22 de-duplicated features (list below), all derivable from 12 RAW numbers the SME actually knows.
- Frontend asks for RAW money values, never ratios:
  `revenue, total_expenses, total_income, operating_income, net_income, continuous_net_income,
   total_assets, current_assets, cash, total_liability, current_liability, equity,
   paid_in_capital, interest_expense, retained_earnings, contingent_liability`
  (12-16 fields, all in P&L / Balance Sheet)
- Backend `derive_ratios(raw)` computes every model feature deterministically:
  e.g. `debt_ratio = total_liability/total_assets`, `interest_expense_ratio = interest_expense/revenue`
- If a raw field is missing -> REJECT with "incomplete data, confidence low", do NOT silently median-fill. Show coverage %.
- Result: 100% of model inputs trace to real company numbers. Honest score + honest SHAP.

## 4. Locked final 22 model features (all derivable, de-duplicated)
1. Continuous interest rate (after tax) 2. Borrowing dependency 3. Persistent EPS proxy*
4. Total income/Total expense 5. Total debt/Total net worth 6. Net profit before tax/Paid-in capital
7. Debt ratio % 8. Interest Expense Ratio 9. Degree of Financial Leverage (DFL)
10. Net Value Per Share (A) proxy* 11. Retained Earnings to Total Assets 12. Contingent liabilities/Net worth
13. Operating Profit Rate 14. ROA(A) (single ROA rep) 15. Inventory and accounts receivable/Net value
16. Non-industry income and expenditure/revenue 17. Accounts Receivable Turnover 18. Quick Ratio
19. Current Liability to Assets 20. Working Capital to Total Assets 21. Cash Flow to Total Assets proxy*
22. Interest Coverage Ratio (EBIT/interest)
*proxy = derived from raw (e.g. per-share -> per-rupee equity, cash-flow from net_income+depreciation estimate). Exact formulas in `derive.py` Phase 4. No medians.
