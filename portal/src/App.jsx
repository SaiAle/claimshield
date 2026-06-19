import React, { useState, useEffect } from 'react';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state for submitting a new claim
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjusterNotes, setAdjusterNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // New Claim Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    policy_number: '',
    claim_type: 'Flight Delay',
    claim_amount: '',
    flight_number: '',
    delay_hours: '',
    description: '',
    has_receipt: true
  });

  // Fetch Cases from API
  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/cases`);
      if (!res.ok) throw new Error('API server returned an error');
      const data = await res.json();
      setCases(data);
      setError(null);
      
      // Auto-select first case if none is selected
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      } else if (selectedCase) {
        // Keep selected case updated
        const updated = data.find(c => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.warn('Backend not running, using mock memory state');
      setError('Backend offline. Running in local demo mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Poll cases every 8 seconds to capture "live" updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCases();
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedCase]);

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit New Claim Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      claim_amount: parseFloat(formData.claim_amount) || 0.0,
      delay_hours: formData.claim_type === 'Flight Delay' ? parseInt(formData.delay_hours) || 0 : 0
    };

    try {
      const res = await fetch(`${API_BASE_URL}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit claim');
      
      const newClaim = await res.json();
      setCases(prev => [newClaim, ...prev]);
      setSelectedCase(newClaim);
      setIsModalOpen(false);
      
      // Reset Form
      setFormData({
        customer_name: '',
        policy_number: '',
        claim_type: 'Flight Delay',
        claim_amount: '',
        flight_number: '',
        delay_hours: '',
        description: '',
        has_receipt: true
      });
      fetchCases();
    } catch (err) {
      alert('Could not submit claim. Make sure the FastAPI backend is running!');
    }
  };

  // Handle Human-in-the-loop decisions (Approve / Reject)
  const handleCaseAction = async (actionType) => {
    if (!selectedCase) return;
    if (!adjusterNotes.trim()) {
      alert('Please add adjuster notes before deciding.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${selectedCase.id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjuster_notes: adjusterNotes })
      });
      
      if (!res.ok) throw new Error(`Failed to ${actionType} case`);
      
      const updatedCase = await res.json();
      setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
      setSelectedCase(updatedCase);
      setAdjusterNotes('');
      fetchCases();
    } catch (err) {
      alert(`Error trying to ${actionType} case. Ensure backend is online.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helper Stats Counters
  const totalCases = cases.length;
  const activeCasesCount = cases.filter(c => c.stage === 'Intake' || c.stage === 'Triage' || c.stage === 'Review').length;
  const approvedCount = cases.filter(c => c.stage === 'Settlement').length;
  const flaggedCount = cases.filter(c => c.stage === 'Review' && c.fraud_risk_score > 30).length;

  return (
    <div className="app-container">
      {/* Top Banner */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-icon">CS</div>
          <div className="brand-title">
            <h1>ClaimShield</h1>
            <p>Maestro Case Triage Dashboard</p>
          </div>
        </div>
        <div className="status-badge-live">
          <div className="pulse-dot"></div>
          {error ? 'DEMO MODE (BACKEND OFFLINE)' : 'LIVE AGENT LINK ONLINE'}
        </div>
      </header>

      {/* Stats row */}
      <section className="stats-grid">
        <div className="stat-card primary">
          <span className="stat-label">Total Claims Recieved</span>
          <span className="stat-value">{totalCases}</span>
        </div>
        <div className="stat-card triage">
          <span className="stat-label">Active Orchestrations</span>
          <span className="stat-value">{activeCasesCount}</span>
        </div>
        <div className="stat-card success">
          <span className="stat-label">Settled Payments</span>
          <span className="stat-value">{approvedCount}</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-label">Flagged Anomalies</span>
          <span className="stat-value">{flaggedCount}</span>
        </div>
      </section>

      {/* Split Pane Work Area */}
      <section className="workspace-grid">
        
        {/* Left Side: Cases List Table */}
        <div className="list-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Cases &amp; Orchestrations</h2>
            </div>
            <button className="quick-submit-btn" onClick={() => setIsModalOpen(true)}>
              + Trigger Claims Intake
            </button>
          </div>

          <div className="claims-table-wrapper">
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Claimant</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className={selectedCase && selectedCase.id === claim.id ? 'active' : ''}
                    onClick={() => setSelectedCase(claim)}
                  >
                    <td><strong>{claim.id}</strong></td>
                    <td>{claim.customer_name}</td>
                    <td>{claim.claim_type}</td>
                    <td>${claim.claim_amount.toFixed(2)}</td>
                    <td>
                      <span style={{ 
                        color: claim.fraud_risk_score >= 60 ? '#ef4444' : claim.fraud_risk_score >= 25 ? '#f59e0b' : '#10b981',
                        fontWeight: '600'
                      }}>
                        {claim.fraud_risk_score}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge stage-${claim.stage.toLowerCase()}`}>
                        {claim.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Case Detail Inspector */}
        <div className="details-panel">
          {selectedCase ? (
            <div className="details-card">
              <div className="details-header">
                <div className="claimant-info">
                  <h3>{selectedCase.customer_name}</h3>
                  <div className="policy-sub">Policy: {selectedCase.policy_number} | ID: {selectedCase.id}</div>
                </div>
                <div className="claim-val">
                  <div className="amount-label">Claimed Value</div>
                  <div className="amount-num">${selectedCase.claim_amount.toFixed(2)}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="details-section-title">Claim Narrative</div>
                <p style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>{selectedCase.description}</p>
                {selectedCase.flight_number && (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                    Flight Number: {selectedCase.flight_number} {selectedCase.delay_hours > 0 && `| Delay: ${selectedCase.delay_hours} hrs`}
                  </p>
                )}
              </div>

              {/* Risk Analyzer Component */}
              <div className="risk-analyzer">
                <div className="risk-header-row">
                  <div className="details-section-title" style={{ margin: 0 }}>AI Fraud Detection</div>
                  <div className={`risk-level-display ${
                    selectedCase.fraud_risk_score >= 60 ? 'high' : selectedCase.fraud_risk_score >= 25 ? 'medium' : 'low'
                  }`}>
                    {selectedCase.fraud_risk_score >= 60 ? 'High Risk' : selectedCase.fraud_risk_score >= 25 ? 'Medium Risk' : 'Low Risk'}
                  </div>
                </div>

                <div className="risk-bar-bg">
                  <div 
                    className={`risk-bar-fill ${
                      selectedCase.fraud_risk_score >= 60 ? 'high' : selectedCase.fraud_risk_score >= 25 ? 'medium' : 'low'
                    }`} 
                    style={{ width: `${selectedCase.fraud_risk_score}%` }}
                  ></div>
                </div>

                {selectedCase.anomalies && selectedCase.anomalies.length > 0 ? (
                  <div className="anomalies-list">
                    {selectedCase.anomalies.map((anomaly, idx) => (
                      <div key={idx} className="anomaly-item">
                        <span>⚠️</span> {anomaly}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#10b981' }}>No anomaly patterns detected by the agent.</p>
                )}
              </div>

              {/* Case Stage Audit log */}
              <div>
                <div className="details-section-title">Case Stage Tracker</div>
                <div className="timeline">
                  {selectedCase.logs && selectedCase.logs.map((log, index) => (
                    <div key={index} className="timeline-item active">
                      <div className="timeline-dot"></div>
                      <div className="timeline-stage">{log.stage}</div>
                      <div className="timeline-content">{log.message}</div>
                      <div className="timeline-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-Loop Actions */}
              {selectedCase.stage === 'Review' && (
                <div className="action-box">
                  <div className="details-section-title" style={{ color: '#fbbf24' }}>Human Adjuster Audit</div>
                  <textarea 
                    placeholder="Provide justification notes for decision (e.g. verified documents or approved outlier)..."
                    value={adjusterNotes}
                    onChange={(e) => setAdjusterNotes(e.target.value)}
                  />
                  <div className="action-buttons-row">
                    <button 
                      className="btn-approve" 
                      onClick={() => handleCaseAction('approve')}
                      disabled={submittingAction}
                    >
                      Approve &amp; Settle
                    </button>
                    <button 
                      className="btn-reject" 
                      onClick={() => handleCaseAction('reject')}
                      disabled={submittingAction}
                    >
                      Reject Claim
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="details-card">
              <div className="empty-state">
                <span className="empty-state-icon">📋</span>
                <p>Select a claim from the table to inspect details and run actions.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Intake Modal Form */}
      {isModalOpen && (
        <div className="form-overlay">
          <form className="claim-form-card" onSubmit={handleFormSubmit}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Simulate Claim Intake Webhook
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  name="customer_name" 
                  required
                  placeholder="e.g. Alice Smith"
                  value={formData.customer_name} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="form-group">
                <label>Policy Number</label>
                <input 
                  type="text" 
                  name="policy_number" 
                  required
                  placeholder="e.g. POL-1082-TRV"
                  value={formData.policy_number} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Claim Type</label>
                <select 
                  name="claim_type" 
                  value={formData.claim_type} 
                  onChange={handleInputChange}
                >
                  <option value="Flight Delay">Flight Delay</option>
                  <option value="Lost Baggage">Lost Baggage</option>
                  <option value="Medical Expense">Medical Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Claim Amount ($)</label>
                <input 
                  type="number" 
                  name="claim_amount" 
                  required
                  step="0.01"
                  placeholder="e.g. 250.00"
                  value={formData.claim_amount} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            {formData.claim_type === 'Flight Delay' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Flight Number</label>
                  <input 
                    type="text" 
                    name="flight_number" 
                    placeholder="e.g. UA-102"
                    value={formData.flight_number} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Delay Hours</label>
                  <input 
                    type="number" 
                    name="delay_hours" 
                    placeholder="e.g. 5"
                    value={formData.delay_hours} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            )}

            <div className="form-group full-width">
              <label>Claim Description / Notes</label>
              <textarea 
                name="description" 
                rows="3"
                required
                placeholder="Details of the event..."
                value={formData.description} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-group full-width" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                name="has_receipt" 
                id="has_receipt"
                checked={formData.has_receipt} 
                onChange={handleInputChange} 
              />
              <label htmlFor="has_receipt" style={{ cursor: 'pointer' }}>Receipt is attached with claim documents</label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="quick-submit-btn">
                Intake Claim
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
