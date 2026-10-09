# SME Financial Health and Early Warning System

Know your bankruptcy risk before the bank does. Enter plain rupee values from your P and L and balance sheet. Get a risk score, the reasons in simple words, and warnings like liquidity crunch. Track it every quarter and watch the trend.

## What it does

* Risk scoring: calibrated bankruptcy probability with green, yellow, orange, red bands
* Plain words: every score explained as out of 100 companies like yours, plus what to do next
* Early warning: trend line across quarterly checkups, rule based alerts on top of the model
* Honest inputs: you type raw money values, the backend derives all model features. Nothing silently guessed
* History: every assessment saved to Postgres with full audit of what you entered

## Model performance (test set, 1,364 companies)

| Metric | Score |
|---|---|
| ROC AUC | 0.947 |
| PR AUC | 0.44 (random baseline 0.03) |
| Accuracy at threshold 0.35 | 96.4% |
| Recall at operating threshold 0.18 | 68% |

Model: XGBoost, 800 trees, depth 4, isotonic calibration. 40 features: 22 base ratios plus 8 engineered interactions plus 10 one hot band and flag columns. Full training notebooks in `ml-notebooks/`.

## How it works

Colab trains the model. FastAPI loads it once and serves predictions. Next.js collects raw inputs and visualizes results. Neon Postgres stores users, companies and assessments. No queues, no cache, no background jobs. One request does derive, predict, explain and save.

## Tech stack

| Layer | Choice |
|---|---|
| Model | scikit-learn, XGBoost, SHAP |
| API | FastAPI, SQLAlchemy, JWT |
| UI | Next.js 16, Tailwind, Recharts |
| Data | Neon Postgres (pooled) |
| Training | Google Colab (free) |

## Project structure

```text
api/            serverless entrypoint (Mangum wrapper)
backend/app/    FastAPI: routes, derive, model service, db models
frontend/       Next.js app router UI
ml-notebooks/   01 EDA and preprocess, 02 train and evaluate
docs/           contracts, specs, findings
```

## Quickstart

Backend:

```bash
cd backend
cp .env.example .env   # add your Neon pooled DATABASE_URL
uv sync
uv run python create_tables.py
uv run uvicorn app.main:app
```

Frontend:

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```

Open `http://localhost:3000`, sign up, add a company, assess with values from `frontend/public/sample.csv`.

## API

```text
POST /api/auth/signup | /api/auth/login
POST /api/companies
GET  /api/companies
POST /api/companies/{id}/predict
GET  /api/companies/{id}/assessments
GET  /health
```

## CSV upload

One row is one period. Headers are raw field names, all values plain numbers in Rs. Six columns required: revenue, total_income, total_expenses, total_assets, equity, paid_in_capital. Fill the optional cash, debt and interest columns for the best score. Template: `frontend/public/sample.csv`. The UI shows the full field guide on the assessment page.

## Risk bands

Green below 20%. Yellow 20 to 50%. Orange 50 to 75%. Red above 75%. Health equals 100 minus risk percent.

## Roadmap

Real SME data recalibration, what if simulator, Excel import, forgot password endpoint, free deployment.

## Disclaimer

The model learned from Taiwanese listed companies 1999 to 2009. Treat scores as an early signal, not financial advice. Validate on your own SME data before business use.
