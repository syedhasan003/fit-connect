Quick start:
1) Activate venv: source .venv/bin/activate
2) Install deps: pip install fastapi uvicorn[standard] pydantic sqlalchemy python-dotenv passlib[bcrypt] python-jose[cryptography]
3) Run: uvicorn app.main:app --reload
Endpoints:
- POST /auth/register  {email,password,full_name}
- POST /auth/login     {email,password} -> returns access_token
- POST /gyms/          create gym (auth required: Bearer token)
- GET  /gyms/          list gyms
- POST /analytics/visit   record visit (auth required)
- GET  /analytics/gym/{id}/visits
