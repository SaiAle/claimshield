import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents import TriageAgent, FraudDetectionAgent

app = FastAPI(
    title="ClaimShield Agent Core API",
    description="Backend service hosting the Triage and Fraud agents for UiPath AgentHack."
)

# Enable CORS for frontend dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents
triage_agent = TriageAgent()
fraud_agent = FraudDetectionAgent()

# In-Memory Database
CLAIMS_DB: List[Dict[str, Any]] = []
CASE_LOGS: Dict[str, List[Dict[str, Any]]] = {}

# Pydantic Schemas
class ClaimSubmission(BaseModel):
    customer_name: str = Field(..., example="Alice Smith")
    policy_number: str = Field(..., example="POL-2026-9872")
    claim_type: str = Field(..., example="Flight Delay")
    claim_amount: float = Field(..., example=250.0)
    flight_number: Optional[str] = Field(None, example="UA-102")
    delay_hours: Optional[int] = Field(None, example=5)
    description: str = Field(..., example="Flight UA-102 was delayed for 5 hours due to weather.")
    has_receipt: bool = Field(True, example=True)

class CaseAction(BaseModel):
    adjuster_notes: str = Field(..., example="Approved after confirming baggage tag receipt manually.")

# Initialize premium initial claims to seed the dashboard
def seed_data():
    initial_claims = [
        {
            "id": "claim-001",
            "customer_name": "Sarah Jenkins",
            "policy_number": "POL-9981-TRV",
            "claim_type": "Flight Delay",
            "claim_amount": 150.0,
            "flight_number": "LH-430",
            "delay_hours": 3,
            "description": "My flight from Frankfurt was delayed by 3 hours. Requesting standard reimbursement.",
            "has_receipt": True,
            "stage": "Rejected",
            "status": "Auto-Rejected",
            "assessed_value": 0.0,
            "fraud_risk_score": 10,
            "anomalies": [],
            "logs": [
                {"timestamp": datetime.now().isoformat(), "stage": "Intake", "message": "Claim received via Webhook."},
                {"timestamp": datetime.now().isoformat(), "stage": "Triage", "message": "Triage Agent evaluated policy. Delay is under 4-hour threshold. Claim automatically rejected."}
            ]
        },
        {
            "id": "claim-002",
            "customer_name": "David Chen",
            "policy_number": "POL-1082-TRV",
            "claim_type": "Flight Delay",
            "claim_amount": 300.0,
            "flight_number": "SQ-022",
            "delay_hours": 6,
            "description": "Singapore Airlines flight SQ-022 was delayed 6 hours. Included airport delay certificate.",
            "has_receipt": True,
            "stage": "Settlement",
            "status": "Auto-Approved",
            "assessed_value": 300.0,
            "fraud_risk_score": 0,
            "anomalies": [],
            "logs": [
                {"timestamp": datetime.now().isoformat(), "stage": "Intake", "message": "Claim received via Webhook."},
                {"timestamp": datetime.now().isoformat(), "stage": "Triage", "message": "Triage Agent verified flight delay details. Limit checks satisfied."},
                {"timestamp": datetime.now().isoformat(), "stage": "Settlement", "message": "UiPath Robot triggered electronic settlement. Payout of $300.00 completed successfully."}
            ]
        },
        {
            "id": "claim-003",
            "customer_name": "Emily Rodriguez",
            "policy_number": "POL-5540-TRV",
            "claim_type": "Lost Baggage",
            "claim_amount": 950.0,
            "flight_number": "IB-316",
            "delay_hours": 0,
            "description": "Baggage lost during transfer. Contains designer clothing and personal items near limit.",
            "has_receipt": True,
            "stage": "Review",
            "status": "Pending Adjuster Review",
            "assessed_value": 950.0,
            "fraud_risk_score": 45,
            "anomalies": ["Limit Exhaustion: Baggage claim amount is extremely close to the max limit ($1,000).", "Suspicious Content: Flagged high-risk items/keywords: designer luggage"],
            "logs": [
                {"timestamp": datetime.now().isoformat(), "stage": "Intake", "message": "Claim received via Webhook."},
                {"timestamp": datetime.now().isoformat(), "stage": "Triage", "message": "Triage Agent verified baggage tag presence. Capped at $950. Escalated to Fraud Agent due to amount threshold."},
                {"timestamp": datetime.now().isoformat(), "stage": "Investigation", "message": "Fraud Detection Agent flagged two anomalies: Limit Exhaustion and keyword 'designer luggage'. Case routed to Human Triage queue."}
            ]
        },
        {
            "id": "claim-004",
            "customer_name": "Marcus Vance",
            "policy_number": "POL-1082-TRV",  # Same policy as David Chen (suspicious!)
            "claim_type": "Medical Expense",
            "claim_amount": 4200.0,
            "flight_number": "SQ-022",
            "delay_hours": 0,
            "description": "Claiming emergency hospital visit cost due to food poisoning during Singapore flight.",
            "has_receipt": True,
            "stage": "Review",
            "status": "Pending Adjuster Review",
            "assessed_value": 4200.0,
            "fraud_risk_score": 75,
            "anomalies": ["Duplicate Claim: Another claim of this type has already been submitted under this policy.", "Limit Exhaustion: High medical cost claims require manual document auditing."],
            "logs": [
                {"timestamp": datetime.now().isoformat(), "stage": "Intake", "message": "Claim received via Webhook."},
                {"timestamp": datetime.now().isoformat(), "stage": "Triage", "message": "Triage Agent flagged high medical expense ($4,200.00). Routed to Investigation Stage."},
                {"timestamp": datetime.now().isoformat(), "stage": "Investigation", "message": "Fraud Detection Agent detected active duplicate policy claim pattern (POL-1082-TRV). Risk score assessed at 75%. Case escalated to Manual Adjuster Audit."}
            ]
        }
    ]
    CLAIMS_DB.extend(initial_claims)

seed_data()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ClaimShield Agent Core API",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/cases", response_model=List[Dict[str, Any]])
def get_all_cases():
    return CLAIMS_DB

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    for claim in CLAIMS_DB:
        if claim["id"] == case_id:
            return claim
    raise HTTPException(status_code=404, detail="Case not found.")

@app.post("/api/claims")
def submit_claim(claim_in: ClaimSubmission):
    claim_id = f"claim-{uuid.uuid4().hex[:6]}"
    
    # 1. Initialize Claim Object
    claim_dict = {
        "id": claim_id,
        "customer_name": claim_in.customer_name,
        "policy_number": claim_in.policy_number,
        "claim_type": claim_in.claim_type,
        "claim_amount": claim_in.claim_amount,
        "flight_number": claim_in.flight_number,
        "delay_hours": claim_in.delay_hours,
        "description": claim_in.description,
        "has_receipt": claim_in.has_receipt,
        "stage": "Intake",
        "status": "Intake Triggered",
        "assessed_value": 0.0,
        "fraud_risk_score": 0,
        "anomalies": [],
        "logs": [
            {"timestamp": datetime.now().isoformat(), "stage": "Intake", "message": "Claim successfully received. Spawning Case lifecycle."}
        ]
    }

    # 2. Run Triage Agent
    triage_result = triage_agent.evaluate_claim(claim_dict)
    claim_dict["assessed_value"] = triage_result["assessed_value"]
    
    claim_dict["logs"].append({
        "timestamp": datetime.now().isoformat(),
        "stage": "Triage",
        "message": f"Triage Agent recommendation: {triage_result['recommendation']}. Details: {triage_result['reason']}"
    })

    if triage_result["recommendation"] == "Reject":
        claim_dict["stage"] = "Rejected"
        claim_dict["status"] = "Auto-Rejected"
        CLAIMS_DB.append(claim_dict)
        return claim_dict

    elif triage_result["recommendation"] == "Request Information":
        claim_dict["stage"] = "Triage"
        claim_dict["status"] = "Pending Documents"
        CLAIMS_DB.append(claim_dict)
        return claim_dict

    # 3. Run Fraud Anomaly check
    fraud_result = fraud_agent.check_fraud(claim_dict, CLAIMS_DB)
    claim_dict["fraud_risk_score"] = fraud_result["fraud_risk_score"]
    claim_dict["anomalies"] = fraud_result["anomalies"]
    
    claim_dict["logs"].append({
        "timestamp": datetime.now().isoformat(),
        "stage": "Investigation",
        "message": f"Fraud Detection Agent assessed risk: {fraud_result['decision']} (Score: {fraud_result['fraud_risk_score']}%). Anomalies flagged: {len(fraud_result['anomalies'])}."
    })

    # 4. Route Case to final stage based on risk
    if triage_result["recommendation"] == "Escalate to Fraud Investigation" or fraud_result["decision"] in ["Medium Risk", "High Risk"]:
        claim_dict["stage"] = "Review"
        claim_dict["status"] = "Pending Adjuster Review"
    else:
        # Standard auto-approve case
        claim_dict["stage"] = "Settlement"
        claim_dict["status"] = "Auto-Approved"
        claim_dict["logs"].append({
            "timestamp": datetime.now().isoformat(),
            "stage": "Settlement",
            "message": f"UiPath RPA Payout robot triggered. Disbursed ${claim_dict['assessed_value']:.2f} electronically."
        })

    CLAIMS_DB.append(claim_dict)
    return claim_dict

@app.post("/api/cases/{case_id}/approve")
def approve_case(case_id: str, action: CaseAction):
    for claim in CLAIMS_DB:
        if claim["id"] == case_id:
            if claim["stage"] != "Review":
                raise HTTPException(status_code=400, detail=f"Cannot approve case in stage {claim['stage']}.")
            
            claim["stage"] = "Settlement"
            claim["status"] = "Manually Approved"
            claim["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "stage": "Review",
                "message": f"Human Claims Adjuster approved case. Notes: {action.adjuster_notes}"
            })
            claim["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "stage": "Settlement",
                "message": f"UiPath RPA Payout robot triggered. Disbursed ${claim['assessed_value']:.2f} electronically."
            })
            return claim
            
    raise HTTPException(status_code=404, detail="Case not found.")

@app.post("/api/cases/{case_id}/reject")
def reject_case(case_id: str, action: CaseAction):
    for claim in CLAIMS_DB:
        if claim["id"] == case_id:
            if claim["stage"] != "Review":
                raise HTTPException(status_code=400, detail=f"Cannot reject case in stage {claim['stage']}.")
            
            claim["stage"] = "Rejected"
            claim["status"] = "Manually Rejected"
            claim["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "stage": "Review",
                "message": f"Human Claims Adjuster rejected case. Notes: {action.adjuster_notes}"
            })
            claim["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "stage": "Rejected",
                "message": "Rejection notice generated and emailed to the policy holder."
            })
            return claim
            
    raise HTTPException(status_code=404, detail="Case not found.")
