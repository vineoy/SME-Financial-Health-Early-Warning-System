"""Phase 4 contract: RAW money inputs -> backend derives 40 features. No ratio typing."""
from pydantic import BaseModel, Field

class RawSMEInput(BaseModel):
    revenue: float = Field(..., gt=0)
    total_income: float = ...
    total_expenses: float = Field(..., gt=0)
    operating_income: float = 0.0
    operating_expenses: float = 0.0
    net_income: float = 0.0
    continuous_net_income: float = 0.0
    pretax_income: float = 0.0
    ebit: float = 0.0
    operating_cash_flow: float = 0.0
    total_assets: float = Field(..., gt=0)
    current_assets: float = 0.0
    quick_assets: float = 0.0
    cash: float = 0.0
    inventory: float = 0.0
    receivables: float = 0.0
    total_liability: float = 0.0
    current_liability: float = 0.0
    interest_bearing_debt: float | None = None
    equity: float = Field(..., description="Assets minus liabilities")
    paid_in_capital: float = Field(..., gt=0)
    retained_earnings: float = 0.0
    interest_expense: float = 0.0
    contingent_liability: float = 0.0

class SignupIn(BaseModel):
    email: str
    password: str = Field(min_length=6)

class CompanyIn(BaseModel):
    name: str
    sector: str = "general"
    employee_count: int = 0

class PredictResponse(BaseModel):
    risk_score: float
    risk_band: str
    health_score: float
    top_factors: list = []
    warnings: list = []
    model_version: str = "v1"
    assessment_id: str | None = None
