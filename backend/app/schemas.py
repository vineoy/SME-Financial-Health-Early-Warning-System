"""SME 20-field input contract.
Maps to full 95-col Taiwanese dataset. Missing 75 cols filled with training medians in Phase 3/4.
Dataset: Bankrupt? = target. All other cols have leading spaces in CSV - stripped here.
"""
from pydantic import BaseModel, Field

class SMEInput(BaseModel):
    # Profitability (6)
    roa_c: float = Field(..., description="ROA(C) before interest and depreciation")
    roa_a: float = Field(..., description="ROA(A) before interest and % after tax")
    operating_gross_margin: float = 0.0
    operating_profit_rate: float = 0.0
    after_tax_net_interest_rate: float = 0.0
    operating_expense_rate: float = 0.0
    # Liquidity (5)
    current_ratio: float = 0.0
    quick_ratio: float = 0.0
    cash_to_total_assets: float = 0.0
    working_capital_to_total_assets: float = 0.0
    cash_flow_rate: float = Field(0.0, description="Cash Flow from Operating / Current Liabilities")
    # Leverage (5)
    debt_ratio_pct: float = Field(..., description="Debt ratio % = Liability/Assets")
    net_worth_to_assets: float = 0.0
    borrowing_dependency: float = 0.0
    liability_to_equity: float = 0.0
    current_liability_to_assets: float = 0.0
    # Cash-flow & efficiency (3)
    cash_flow_to_total_assets: float = 0.0
    cash_flow_to_liability: float = 0.0
    net_income_to_total_assets: float = 0.0
    # Flags (1)
    net_income_flag: int = Field(1, description="1 if net income positive last period else 0")
    interest_coverage_ratio: float = 0.0

class PredictResponse(BaseModel):
    risk_score: float
    risk_band: str
    health_score: float
    top_factors: list = []
    warnings: list = []
    model_version: str = "v0"
