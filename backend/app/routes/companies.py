from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Company, Assessment
from app.schemas import CompanyIn, RawSMEInput
from app.auth import user_from_token
from app.derive import derive
from app.model_service import predict, warnings

router = APIRouter()

def uid(authorization: str = Header("")) -> str:
    u = user_from_token(authorization.replace("Bearer ", "")) if authorization else None
    if not u: raise HTTPException(401, "login required")
    return u

@router.get("")
def list_companies(db: Session = Depends(get_db), user_id: str = Depends(uid)):
    comps = db.query(Company).filter(Company.user_id == user_id).order_by(Company.created_at.desc()).all()
    out = []
    for c in comps:
        last = db.query(Assessment).filter(Assessment.company_id == c.id).order_by(Assessment.created_at.desc()).first()
        out.append({"id": c.id, "name": c.name, "sector": c.sector,
                    "latest": {"risk_score": last.risk_score, "risk_band": last.risk_band,
                               "created_at": last.created_at.isoformat()} if last else None})
    return out

@router.post("")
def create_company(body: CompanyIn, db: Session = Depends(get_db), user_id: str = Depends(uid)):
    c = Company(user_id=user_id, name=body.name, sector=body.sector, employee_count=body.employee_count)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name}

@router.post("/{cid}/predict")
def predict_company(cid: str, body: RawSMEInput, db: Session = Depends(get_db), user_id: str = Depends(uid)):
    c = db.query(Company).filter(Company.id == cid).first()
    if not c: raise HTTPException(404, "company not found")
    raw = body.model_dump()
    if raw.get("interest_bearing_debt") is None:
        raw["interest_bearing_debt"] = raw["total_liability"]  # conservative
    feat = derive(raw)
    res = predict(feat)
    w = warnings(raw, res["risk_score"])
    a = Assessment(company_id=cid, input_json=raw, risk_score=res["risk_score"],
                   risk_band=res["risk_band"], model_version="v1", top_factors=res["top_factors"])
    db.add(a); db.commit(); db.refresh(a)
    res["warnings"] = w; res["assessment_id"] = a.id
    return res

@router.get("/{cid}/assessments")
def history(cid: str, db: Session = Depends(get_db), user_id: str = Depends(uid)):
    rows = db.query(Assessment).filter(Assessment.company_id == cid).order_by(Assessment.created_at).all()
    return [{"id": r.id, "risk_score": r.risk_score, "risk_band": r.risk_band,
             "health_score": round(100 - round(r.risk_score * 100, 1), 1),
             "created_at": r.created_at.isoformat(), "top_factors": r.top_factors} for r in rows]
