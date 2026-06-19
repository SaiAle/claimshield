import re
from typing import Dict, Any, List

class TriageAgent:
    """
    TriageAgent is responsible for evaluating claim details against policy limits and conditions.
    It parses claim inputs, cross-references with travel insurance coverage rules, and outputs 
    a structured recommendation for approval, rejection, info requests, or escalation.
    """
    
    POLICY_RULES = {
        "Flight Delay": {
            "min_hours": 4,
            "compensation_per_hour": 50.0,
            "max_limit": 500.0,
            "description": "Covered if delay is at least 4 hours. $50/hour compensation, capped at $500."
        },
        "Lost Baggage": {
            "max_limit": 1000.0,
            "required_fields": ["baggage_tag"],
            "description": "Covered up to $1,000. Baggage receipt and reference tag required."
        },
        "Medical Expense": {
            "max_limit": 5000.0,
            "description": "Emergency medical cover up to $5,000. Requires medical receipt and justification."
        }
    }

    def evaluate_claim(self, claim: Dict[str, Any]) -> Dict[str, Any]:
        claim_type = claim.get("claim_type")
        claim_amount = claim.get("claim_amount", 0.0)
        
        if claim_type not in self.POLICY_RULES:
            return {
                "policy_satisfied": False,
                "recommendation": "Reject",
                "assessed_value": 0.0,
                "reason": f"Unknown claim type: {claim_type}. Not covered under standard policy."
            }

        rule = self.POLICY_RULES[claim_type]
        
        # Verify basic document presence
        if not claim.get("has_receipt"):
            return {
                "policy_satisfied": False,
                "recommendation": "Request Information",
                "assessed_value": 0.0,
                "reason": "Missing receipt. A valid invoice/receipt is required to process all claims."
            }

        if claim_type == "Flight Delay":
            delay_hours = claim.get("delay_hours", 0)
            min_hours = rule["min_hours"]
            if delay_hours < min_hours:
                return {
                    "policy_satisfied": False,
                    "recommendation": "Reject",
                    "assessed_value": 0.0,
                    "reason": f"Flight delay of {delay_hours} hours is less than the policy minimum of {min_hours} hours."
                }
            
            # Calculate compensation
            calculated = float(delay_hours * rule["compensation_per_hour"])
            assessed_value = min(calculated, rule["max_limit"])
            
            # If claimed amount is higher than rule limit, cap it. If it is within calculate, approve it.
            return {
                "policy_satisfied": True,
                "recommendation": "Auto-Approve",
                "assessed_value": assessed_value,
                "reason": f"Flight delay policy satisfied. Delayed by {delay_hours} hours. Compensation assessed at ${assessed_value:.2f}."
            }

        elif claim_type == "Lost Baggage":
            # Check for baggage tag reference
            description = claim.get("description", "").lower()
            tag_match = re.search(r"[a-z0-9]{8,12}", description) or claim.get("baggage_tag")
            
            if not tag_match:
                return {
                    "policy_satisfied": False,
                    "recommendation": "Request Information",
                    "assessed_value": 0.0,
                    "reason": "Missing baggage tag identifier. Please provide a valid airline baggage receipt/tag."
                }
                
            assessed_value = min(claim_amount, rule["max_limit"])
            return {
                "policy_satisfied": True,
                "recommendation": "Auto-Approve" if claim_amount <= 400.0 else "Escalate to Fraud Investigation",
                "assessed_value": assessed_value,
                "reason": f"Baggage claim tags checked. Assessed value capped at ${assessed_value:.2f}. " + 
                          ("Escalating large baggage claim for verification." if claim_amount > 400.0 else "Auto-approving standard claim.")
            }

        elif claim_type == "Medical Expense":
            # Medical expenses are highly regulated and always escalate to manual or deep check if high
            assessed_value = min(claim_amount, rule["max_limit"])
            
            if claim_amount > 1500.0:
                return {
                    "policy_satisfied": True,
                    "recommendation": "Escalate to Fraud Investigation",
                    "assessed_value": assessed_value,
                    "reason": f"Medical claim exceeds $1,500. Escalating to deep fraud and medical review check."
                }
                
            return {
                "policy_satisfied": True,
                "recommendation": "Auto-Approve",
                "assessed_value": assessed_value,
                "reason": f"Medical expense of ${claim_amount:.2f} is within auto-approval limits. Assessed at ${assessed_value:.2f}."
            }
            
        return {
            "policy_satisfied": False,
            "recommendation": "Reject",
            "assessed_value": 0.0,
            "reason": "Policy evaluation failed due to an unexpected exception."
        }


class FraudDetectionAgent:
    """
    FraudDetectionAgent checks claims for anomalies, historical patterns, and suspicious behavior.
    Returns a score from 0 to 100, flagged anomalies, and a recommended routing decision.
    """
    def check_fraud(self, claim: Dict[str, Any], existing_claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        risk_score = 0
        anomalies = []
        
        claim_amount = claim.get("claim_amount", 0.0)
        policy_number = claim.get("policy_number", "")
        claim_type = claim.get("claim_type", "")
        flight_number = claim.get("flight_number", "")
        description = claim.get("description", "").lower()

        # 1. Duplicate Claim Check: Check if there's an existing claim with the same policy number and claim type
        duplicates = [
            c for c in existing_claims 
            if c.get("policy_number") == policy_number and c.get("claim_type") == claim_type and c.get("id") != claim.get("id")
        ]
        if len(duplicates) > 0:
            risk_score += 40
            anomalies.append("Duplicate Claim: Another claim of this type has already been submitted under this policy.")

        # 2. Flight Delay Verification Check
        if claim_type == "Flight Delay":
            # Anomaly: Rounded claim amount that doesn't match standard hours (e.g. $425 or random values instead of multiples of $50)
            delay_hours = claim.get("delay_hours", 0)
            expected_amount = delay_hours * 50.0
            if claim_amount > expected_amount:
                risk_score += 25
                anomalies.append(f"Claim Mismatch: Claimed amount (${claim_amount:.2f}) exceeds the flight delay rate of $50/hour.")

        # 3. High Claim Value relative to limit
        if claim_type == "Lost Baggage" and claim_amount >= 950.0:
            risk_score += 30
            anomalies.append("Limit Exhaustion: Baggage claim amount is extremely close to the max limit ($1,000).")

        # 4. Keyword / Suspicious Text analysis
        suspicious_keywords = ["urgent cash", "immediate payout", "compensation guarantee", "lost iphone 15 pro max", "designer luggage"]
        matched_words = [w for w in suspicious_keywords if w in description]
        if len(matched_words) > 0:
            risk_score += 15 * len(matched_words)
            anomalies.append(f"Suspicious Content: Flagged high-risk items/keywords: {', '.join(matched_words)}")

        # Calculate routing decision based on score
        if risk_score >= 60:
            decision = "High Risk"
        elif risk_score >= 25:
            decision = "Medium Risk"
        else:
            decision = "Low Risk"

        return {
            "fraud_risk_score": min(risk_score, 100),
            "anomalies": anomalies,
            "decision": decision
        }
