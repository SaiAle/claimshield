# ClaimShield: Intelligent Insurance Claims & Fraud Case Manager

**ClaimShield** is an end-to-end agentic case management solution designed for **Track 1 (UiPath Maestro Case)** of the UiPath AgentHack. It showcases the integration of autonomous AI agents, automated RPA workforces, and human claim adjusters to handle exception-heavy travel insurance claims.

ClaimShield triages claims, detects pattern-based fraud risk, and handles approvals dynamically, using **UiPath Automation Cloud** as the central execution, orchestration, and governance plane.

---

## 🌟 Solution Overview & Business Value
Processing insurance claims is traditionally slow, repetitive, and prone to fraud. Simple rules-based automation fails when faced with messy descriptions, high-value claims, or subtle fraud patterns.

**ClaimShield solves this by introducing a multi-agent dynamic workflow:**
1. **Intake Stage:** Webhooks capture claim data (claims submitted via email, portal, or API) and initiate a UiPath Case instance.
2. **AI Triage Stage:** The **Triage Agent** parses claims, checks document completeness (receipt validity), and cross-references claim details against standard travel insurance coverage limits.
3. **Investigation Stage:** If anomalies are flagged (e.g., medical claims above thresholds, flight delays under limits, or suspect keywords), the case transitions to the **Fraud Detection Agent**. It performs historical audits to calculate a fraud risk score (0-100%).
4. **Human-in-the-Loop Review:** Low-risk, fully compliant claims are automatically approved. Medium/High-risk claims are routed to the **ClaimShield Adjunct Agent Portal** where a human claims adjuster audits the reasoning, logs, and evidence to make the final decision.
5. **Settlement Stage:** Approved claims trigger a UiPath RPA robot to dispatch payouts immediately.

---

## 🛠️ UiPath Components & Architecture
ClaimShield is built to run on the **UiPath Automation Cloud** and integrates the following tools:

- **UiPath Case Service (Maestro Case):** Manages the case object state (Intake ➔ Triage ➔ Investigation ➔ Review ➔ Settlement) and handles routing based on agent evaluation.
- **UiPath Studio Web:** Hosts integration workflows, connecting webhooks and API calls to the ClaimShield Agent API.
- **UiPath Integration Service:** Interfaces with email notification triggers and payment webhooks.
- **UiPath RPA Payout Robots:** Simulates the automated financial transaction executing once a claim transitions to `Settlement`.

---

## 🤖 Agent Type Statement
This solution utilizes a **hybrid agentic approach**:
- **Coded Agents:** Python/FastAPI backend hosting the Triage Agent and Fraud Detection Agent. These agents handle unstructured text parsing, policy mathematical checks, and mathematical anomaly matching.
- **Low-code Agents (Agent Builder):** Configured in the UiPath Automation Cloud to manage the overall case transitions, triggers, and notification steps.

---

## ⚙️ Setup & Local Testing Instructions
The repository contains a high-fidelity developer testbed in `C:/Users/saiku/.gemini/antigravity-ide/scratch/claimshield`. Follow these steps to spin up the local server and interface for testing.

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Launch Agent Core Backend (FastAPI)
Navigate to `/backend` and install dependencies within the virtual environment:
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. You can inspect the API docs at `http://localhost:8000/docs`.

### 2. Launch Adjunct Portal Dashboard (React + Vite)
Navigate to `/portal`, install npm packages, and run the developer server:
```bash
cd portal
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🎁 BONUS: Coding Agent Verification & AI-Assisted Build Log
ClaimShield was built with the active assistance of **Antigravity (a Gemini-based Advanced Agentic Coding Assistant)**. 

### AI Contribution Details
- **Scaffolding:** Antigravity generated the React + Vite structure, incorporating modern glassmorphism CSS designs.
- **Agent Code Scaffolding:** Designed the rules engine inside `agents.py` for Triage and Fraud checking.
- **Mock State Seeding:** Structured high-fidelity initial entries to simulate real-world exception flows for the judging panel.

### Verifiable Chat Session Prompt Log
```
[User Request] Have a look at the rules and let's choose option 1 (UiPath Maestro Case). Let's design a claims case manager.
[AI Agent Plan] Proposed "ClaimShield" architecture:
 - Backend service (FastAPI) running Triage Agent (rules evaluation) + Fraud Detection Agent (pattern auditing).
 - Frontend Portal (React/Vite + Vanilla CSS dark mode) for human claims adjuster audit workspace.
[AI Execution] Created backend/main.py, backend/agents.py, portal/src/App.jsx, and portal/src/index.css using direct file generation tools.
```
*For reviewer verification, the agent prompt logs and session details are preserved inside the workspace's metadata registry.*
