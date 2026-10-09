"""Derive 40 model features from RAW SME money values. No median-fill.
Every output traces to real inputs. Division guarded with eps/caps."""
import json, os

BASE = os.path.dirname(__file__)
FEATS = json.load(open(os.path.join(BASE, "ml", "features_v1.json")))

EPS = 1e-6

def _div(a, b, cap=10.0):
    if b is None or abs(b) < EPS:
        return 0.0
    v = a / b
    return max(min(v, cap), -cap)

def derive(raw: dict) -> dict:
    r = raw
    rev = max(r["revenue"], EPS)
    ta = max(r["total_assets"], EPS)
    eq = r["equity"] if abs(r["equity"]) > EPS else EPS
    f = {}
    f["Continuous interest rate (after tax)"] = _div(r["continuous_net_income"], rev)
    f["Borrowing dependency"] = _div(r.get("interest_bearing_debt", r["total_liability"]), ta)
    f["Persistent EPS in the Last Four Seasons"] = _div(r["net_income"], r["paid_in_capital"])
    f["Total income/Total expense"] = _div(r["total_income"], max(r["total_expenses"], EPS))
    f["Total debt/Total net worth"] = _div(r["total_liability"], eq)
    f["Net profit before tax/Paid-in capital"] = _div(r["pretax_income"], r["paid_in_capital"])
    f["Debt ratio %"] = _div(r["total_liability"], ta)
    f["Interest Expense Ratio"] = _div(r["interest_expense"], rev)
    op = r["operating_income"]
    f["Degree of Financial Leverage (DFL)"] = _div(op, op - r["interest_expense"])
    f["Net Value Per Share (A)"] = _div(r["equity"], r["paid_in_capital"])
    f["Retained Earnings to Total Assets"] = _div(r["retained_earnings"], ta)
    f["Contingent liabilities/Net worth"] = _div(r.get("contingent_liability", 0.0), eq)
    f["Operating Profit Rate"] = _div(op, rev)
    f["ROA(A) before interest and % after tax"] = _div(r["net_income"], ta)
    f["Inventory and accounts receivable/Net value"] = _div(r.get("inventory", 0.0) + r.get("receivables", 0.0), eq)
    f["Non-industry income and expenditure/revenue"] = _div(r["total_income"] - rev, rev)
    f["Accounts Receivable Turnover"] = _div(rev, r.get("receivables", 0.0) + EPS)
    f["Quick Ratio"] = _div(r["quick_assets"], r["current_liability"])
    f["Current Liability to Assets"] = _div(r["current_liability"], ta)
    f["Working Capital to Total Assets"] = _div(r["current_assets"] - r["current_liability"], ta)
    f["Cash Flow to Total Assets"] = _div(r["operating_cash_flow"], ta)
    f["Interest Coverage Ratio (Interest expense to EBIT)"] = _div(r["ebit"], r["interest_expense"]) if r["interest_expense"] > EPS else 10.0
    # engineered
    f["ENG_distress_leverage"] = f["Debt ratio %"] * f["Interest Expense Ratio"]
    f["ENG_equity_cushion"] = 1.0 - f["Debt ratio %"]
    f["ENG_cash_to_debt"] = _div(r["cash"], ta) / (f["Debt ratio %"] + EPS)
    f["ENG_profit_stress"] = f["Operating Profit Rate"] - _div(r["operating_expenses"], rev)
    f["ENG_coverage_burden"] = f["Interest Expense Ratio"] / (abs(f["ROA(A) before interest and % after tax"]) + EPS)
    f["ENG_cash_coverage"] = _div(r["operating_cash_flow"], r["total_liability"]) * _div(r["cash"], ta)
    f["ENG_retained_strength"] = f["Retained Earnings to Total Assets"] * f["Total income/Total expense"]
    f["ENG_quick_x_wc"] = f["Quick Ratio"] * f["Working Capital to Total Assets"]
    # one-hot bins (same edges as training)
    dr, qr = f["Debt ratio %"], f["Quick Ratio"]
    f["DEBT_low"] = 1.0 if dr < 0.3 else 0.0
    f["DEBT_med"] = 1.0 if 0.3 <= dr < 0.5 else 0.0
    f["DEBT_high"] = 1.0 if 0.5 <= dr < 0.7 else 0.0
    f["DEBT_crit"] = 1.0 if dr >= 0.7 else 0.0
    f["LIQ_illiquid"] = 1.0 if qr < 0.2 else 0.0
    f["LIQ_tight"] = 1.0 if 0.2 <= qr < 0.5 else 0.0
    f["LIQ_ok"] = 1.0 if 0.5 <= qr < 1.0 else 0.0
    f["LIQ_strong"] = 1.0 if qr >= 1.0 else 0.0
    flag = 1 if r["total_liability"] > r["total_assets"] else 0
    f["LIAFLAG_0"] = 1.0 if flag == 0 else 0.0
    f["LIAFLAG_1"] = 1.0 if flag == 1 else 0.0
    return {k: float(f.get(k, 0.0)) for k in FEATS}

PLAIN = {
    "Debt ratio %": "Share of assets funded by debt",
    "Interest Expense Ratio": "Rs of every Rs 100 revenue eaten by interest",
    "Borrowing dependency": "Dependence on borrowed money",
    "Quick Ratio": "Emergency cash-like cover for short bills",
    "Interest Coverage Ratio (Interest expense to EBIT)": "Can profits pay interest?",
    "ENG_distress_leverage": "Debt x interest burden combined",
    "ENG_cash_to_debt": "Cash cover against debt load",
    "Total income/Total expense": "Overall income vs expense",
    "Operating Profit Rate": "Core business profitability",
    "Retained Earnings to Total Assets": "Saved-up profits cushion",
}
