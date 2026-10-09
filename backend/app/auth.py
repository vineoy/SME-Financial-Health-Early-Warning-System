import os
from datetime import datetime, timedelta
from jose import jwt
import bcrypt

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALG = "HS256"

def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode()[:72], bcrypt.gensalt()).decode()
def verify_pw(p: str, h: str) -> bool:
    try: return bcrypt.checkpw(p.encode()[:72], h.encode())
    except Exception: return False
def make_token(uid: str) -> str:
    return jwt.encode({"sub": uid, "exp": datetime.utcnow() + timedelta(minutes=60*24)}, SECRET, algorithm=ALG)
def user_from_token(t: str) -> str | None:
    try: return jwt.decode(t, SECRET, algorithms=[ALG]).get("sub")
    except Exception: return None
