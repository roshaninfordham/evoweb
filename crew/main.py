from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

load_dotenv()

from pipeline import run_build, run_plan, run_review, run_verify  # noqa: E402
from schemas import BuildRequest, PlanRequest, ReviewRequest, VerifyRequest  # noqa: E402

app = FastAPI(title="evoweb-crew")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/plan")
def plan(req: PlanRequest):
    try:
        return run_plan(req)
    except Exception as err:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.post("/build")
def build(req: BuildRequest):
    try:
        return run_build(req)
    except Exception as err:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.post("/verify")
def verify(req: VerifyRequest):
    try:
        return run_verify(req)
    except Exception as err:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.post("/review")
def review(req: ReviewRequest):
    try:
        return run_review(req)
    except Exception as err:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(err)) from err
