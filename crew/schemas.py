from pydantic import BaseModel


class PlanRequest(BaseModel):
    label: str
    target: str
    triggerDescription: str
    evidence: list[str]
    needsResearch: bool = False


class PlanResponse(BaseModel):
    shouldBuild: bool
    title: str
    reasoning: str
    externalFindName: str | None = None
    externalFindPrice: float | None = None
    externalFindUrl: str | None = None
    traceUrl: str | None = None


class BuildRequest(BaseModel):
    label: str
    propsContract: str
    buildInstructions: str
    reasoning: str


class BuildResponse(BaseModel):
    code: str
    traceUrl: str | None = None


class VerifyRequest(BaseModel):
    code: str
    propsContract: str


class VerifyResponse(BaseModel):
    ok: bool
    output: str


class ReviewRequest(BaseModel):
    title: str
    reasoning: str
    code: str
    propsContract: str
    verificationOutput: str


class ReviewResponse(BaseModel):
    approved: bool
    comment: str
    traceUrl: str | None = None
