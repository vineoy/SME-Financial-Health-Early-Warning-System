# Phase 1 - SME 20-field contract (locked)

Source: `data.csv` 6819x96, target `Bankrupt?` (0=6599, 1=220, 3.2% positive, 0 NaNs).
Full 95 feature names have leading spaces in CSV - strip on load.

## API input (backend/app/schemas.py -> SMEInput)
User enters 20 fields. Backend expands to 95 via `feature_medians.json` (Phase 3).

| API key | CSV column | Notes |
|---|---|---|
| roa_c | ROA(C) before interest and depreciation before interest | required |
| roa_a | ROA(A) before interest and % after tax | required |
| operating_gross_margin | Operating Gross Margin | |
| operating_profit_rate | Operating Profit Rate | |
| after_tax_net_interest_rate | After-tax net Interest Rate | |
| operating_expense_rate | Operating Expense Rate | |
| current_ratio | Current Ratio | |
| quick_ratio | Quick Ratio | |
| cash_to_total_assets | Cash/Total Assets | |
| working_capital_to_total_assets | Working Capital to Total Assets | |
| cash_flow_rate | Cash flow rate | CFO / Current Liability |
| debt_ratio_pct | Debt ratio % | required, Liability/Assets |
| net_worth_to_assets | Net worth/Assets | |
| borrowing_dependency | Borrowing dependency | |
| liability_to_equity | Liability to Equity | |
| current_liability_to_assets | Current Liability to Assets | |
| cash_flow_to_total_assets | Cash Flow to Total Assets | |
| cash_flow_to_liability | Cash Flow to Liability | |
| net_income_to_total_assets | Net Income to Total Assets | |
| net_income_flag | Net Income Flag | 0/1 |
| interest_coverage_ratio | Interest Coverage Ratio (Interest expense to EBIT) | |

Risk bands: green <0.2, yellow 0.2-0.5, orange 0.5-0.75, red >0.75. health_score = 100*(1-risk).
