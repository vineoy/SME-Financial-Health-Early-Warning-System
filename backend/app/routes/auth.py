from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.schemas import SignupIn
from app.auth import hash_pw, verify_pw, make_token

router = APIRouter()

@router.post("/signup")
def signup(body: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "email exists")
    u = User(email=body.email, password_hash=hash_pw(body.password))
    db.add(u); db.commit(); db.refresh(u)
    return {"access_token": make_token(u.id), "user_id": u.id}

@router.post("/login")
def login(body: SignupIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == body.email).first()
    if not u or not verify_pw(body.password, u.password_hash):
        raise HTTPException(401, "bad credentials")
    return {"access_token": make_token(u.id), "user_id": u.id}
