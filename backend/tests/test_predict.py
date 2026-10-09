from fastapi.testclient import TestClient
from app.main import app
from app.derive import derive

RAW = {"revenue": 100.0, "total_income": 110.0, "total_expenses": 90.0, "operating_income": 15.0,
 "operating_expenses": 10.0, "net_income": 12.0, "continuous_net_income": 11.0, "pretax_income": 14.0,
 "ebit": 16.0, "operating_cash_flow": 8.0, "total_assets": 200.0, "current_assets": 80.0,
 "quick_assets": 40.0, "cash": 15.0, "inventory": 20.0, "receivables": 20.0, "total_liability": 90.0,
 "current_liability": 50.0, "interest_bearing_debt": 60.0, "equity": 110.0, "paid_in_capital": 50.0,
 "retained_earnings": 30.0, "interest_expense": 5.0, "contingent_liability": 2.0}

def test_health():
    assert TestClient(app).get("/health").json()["model_version"] == "v1"

def test_derive_40():
    assert len(derive(RAW)) == 40

def test_predict_live():
    from app.model_service import predict
    r = predict(derive(RAW))
    assert 0 <= r["risk_score"] <= 1 and len(r["top_factors"]) == 5
