"""Load model once, predict sync (no workers). Explain via importance-weighted deviation."""
import json, os, pickle
import numpy as np

BASE = os.path.dirname(__file__)
ML = os.path.join(BASE, "ml")

with open(os.path.join(ML, "features_v1.json")) as f:
    FEATS = json.load(f)
with open(os.path.join(ML, "threshold_v1.json")) as f:
    TH = json.load(f)
with open(os.path.join(ML, "medians_v1.json")) as f:
    MEDIANS = json.load(f)
with open(os.path.join(ML, "model_xgb_v1.pkl"), "rb") as f:
    MODEL = pickle.load(f)

# base estimator importances for explanation (calibrated wrapper -> calibrated_classifiers_[0].base_estimator_)
try:
    _est = MODEL.calibrated_classifiers_[0].estimator
    IMPORTANCE = dict(zip(FEATS, [float(x) for x in _est.feature_importances_]))
except Exception:
    IMPORTANCE = {k: 1.0 for k in FEATS}

THRESHOLD = TH.get("threshold", 0.18)

def band(score: float) -> str:
    if score < 0.2: return "green"
    if score < 0.5: return "yellow"
    if score < 0.75: return "orange"
    return "red"

RISKY_HIGH = {"Debt ratio %", "Interest Expense Ratio", "Borrowing dependency",
              "ENG_distress_leverage", "ENG_coverage_burden", "Contingent liabilities/Net worth",
              "Current Liability to Assets", "Total debt/Total net worth"}
RISKY_LOW = {"Quick Ratio", "ENG_equity_cushion", "ENG_cash_to_debt",
             "Retained Earnings to Total Assets", "Operating Profit Rate",
             "Total income/Total expense", "ENG_cash_coverage",
             "Interest Coverage Ratio (Interest expense to EBIT)"}

def explain(feat: dict, top_n=5):
    rows = []
    for k in FEATS:
        v, m = feat.get(k, 0.0), MEDIANS.get(k, 0.0)
        dev = v - m
        if k in RISKY_HIGH and dev > 0: direction = +1
        elif k in RISKY_LOW and dev < 0: direction = +1
        elif k in RISKY_HIGH and dev < 0: direction = -1
        elif k in RISKY_LOW and dev > 0: direction = -1
        else: direction = 0
        rows.append((k, direction * abs(dev) * IMPORTANCE.get(k, 0.0), dev))
    rows.sort(key=lambda x: -x[1])
    out = []
    for k, s, dev in rows[:top_n]:
        from app.derive import PLAIN
        out.append({"feature": k, "plain": PLAIN.get(k, k),
                    "value": round(feat.get(k, 0.0), 4),
                    "pushes_risk_up": bool(s > 0)})
    return out

def predict(feat: dict):
    import pandas as pd
    X = pd.DataFrame([{k: feat.get(k, 0.0) for k in FEATS}])
    score = float(MODEL.predict_proba(X)[0, 1])
    return {"risk_score": round(score, 4), "risk_band": band(score),
            "health_score": round(100 * (1 - score), 1),
            "top_factors": explain(feat), "model_version": "v1"}

def warnings(raw: dict, score: float):
    w = []
    ta = max(raw.get("total_assets", 1), 1)
    if raw.get("total_liability", 0) / ta > 0.7 and raw.get("cash", 0) / ta < 0.05:
        w.append("Liquidity crunch: high debt with very low cash.")
    if raw.get("total_liability", 0) > raw.get("total_assets", 0):
        w.append("Negative equity: liabilities exceed assets.")
    if raw.get("interest_expense", 0) > 0 and raw.get("ebit", 0) / max(raw["interest_expense"], 1e-6) < 1.5:
        w.append("Interest burden: profits barely cover interest.")
    if score >= 0.5:
        w.append("At-risk score: review borrowing and cash position this month.")
    return w
