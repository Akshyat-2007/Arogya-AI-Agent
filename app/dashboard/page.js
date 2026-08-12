'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

import { Suspense } from 'react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');

  const queryMemberId = searchParams.get('member_id');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      let member = members.find(m => m.id === parseInt(queryMemberId));
      if (!member) {
        member = members[0];
      }
      setSelectedMember(member);
      setWeightInput(member.weight_kg);
      fetchWeightHistory(member.id);
    }
  }, [members, queryMemberId]);

  useEffect(() => {
    if (selectedMember && weightLogs.length > 0) {
      renderChart();
    }
  }, [selectedMember, weightLogs]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightHistory = async (memberId) => {
    try {
      const res = await fetch(`/api/members/${memberId}/weight-history`);
      if (res.ok) {
        const data = await res.json();
        setWeightLogs(data);
      }
    } catch (e) {
      console.error('Failed to load weight logs:', e);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weightInput || isNaN(parseFloat(weightInput)) || !selectedMember) return;

    try {
      const res = await fetch(`/api/members/${selectedMember.id}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: parseFloat(weightInput) })
      });

      if (res.ok) {
        // Refetch members and weight logs to update stats on dashboard
        const membersRes = await fetch('/api/members');
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
          const updatedMember = membersData.find(m => m.id === selectedMember.id);
          if (updatedMember) {
            setSelectedMember(updatedMember);
            setWeightInput(updatedMember.weight_kg);
          }
        }
        fetchWeightHistory(selectedMember.id);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log weight.');
    }
  };

  const switchMember = (id) => {
    router.push(`/dashboard?member_id=${id}`);
  };

  const renderChart = () => {
    if (!canvasRef.current) return;

    // Destroy existing chart to prevent canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const labels = weightLogs.map(l => {
      const date = new Date(l.logged_date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const weights = weightLogs.map(l => l.weight_kg);

    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#9ca3af' : '#475569';
    const accentColor = isDark ? '#a78bfa' : '#7c3aed';
    const accentSecondary = isDark ? '#f472b6' : '#db2777';

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, isDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.3)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weight (kg)',
          data: weights,
          borderColor: accentColor,
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: accentSecondary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#0d1527' : '#ffffff',
            titleColor: isDark ? '#f3f4f6' : '#0f172a',
            bodyColor: isDark ? '#9ca3af' : '#475569',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="glass-card-static text-center p-5 my-5">
        <i className="fas fa-users-cog fa-4x text-grad-primary mb-3"></i>
        <h3 className="fw-bold mb-2">Setup Your Profiles First</h3>
        <p className="text-secondary max-width-500 mx-auto mb-4">
          No family profiles exist yet. Please create a member profile to start viewing the calorie tracker, macro progress, and weight charts.
        </p>
        <Link href="/profiles" className="btn btn-grad px-4 py-2">
          <i className="fas fa-plus me-2"></i>Create Profile
        </Link>
      </div>
    );
  }

  const activeMember = selectedMember || members[0];
  const macros = activeMember.target_macros || { protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="row g-4">
      {/* Sidebar: Family Members Switcher */}
      <div className="col-lg-3 col-md-4">
        <h5 className="fw-bold mb-3">
          <i className="fas fa-users me-2 text-grad-primary"></i>Switch Profile
        </h5>
        <div className="d-flex flex-column gap-2 mb-4">
          {members.map(m => (
            <div
              key={m.id}
              className={`glass-card-static member-switch-card p-3 rounded-4 d-flex align-items-center gap-3 ${
                m.id === activeMember.id ? 'active' : ''
              }`}
              onClick={() => switchMember(m.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="avatar-circle">
                {m.name[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h6 className="mb-0 fw-bold text-truncate">{m.name}</h6>
                <span className="small text-secondary">{m.health_goals}</span>
              </div>
            </div>
          ))}
        </div>

        <Link href="/profiles" className="btn btn-outline-glass btn-sm w-100 py-2">
          <i className="fas fa-cog me-1"></i>Manage Profiles
        </Link>
      </div>

      {/* Main Dashboard Body */}
      <div className="col-lg-9 col-md-8">
        {/* Dashboard Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
          <div>
            <h1 className="font-heading fw-bold mb-0">
              Dashboard: <span className="text-grad-primary">{activeMember.name}</span>
            </h1>
            <p className="text-secondary mb-0">Health summaries and targets tailored for {activeMember.name}.</p>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/chat?member_id=${activeMember.id}`} className="btn btn-outline-glass py-2">
              <i className="fas fa-comment-dots me-2"></i>Chat AI
            </Link>
            <Link href={`/meal-planner?member_id=${activeMember.id}`} className="btn btn-grad py-2">
              <i className="fas fa-utensils me-2"></i>Meal Planner
            </Link>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="row g-3 mb-4">
          {/* Calorie Card */}
          <div className="col-md-4">
            <div className="glass-card p-3 h-100">
              <span className="small text-secondary text-uppercase fw-bold letter-spacing">Daily Target</span>
              <h2 className="fw-bold mt-2 mb-1 text-grad-primary">
                {activeMember.target_calories} <span className="fs-6 text-secondary">kcal</span>
              </h2>
              <div className="d-flex align-items-center gap-1 mt-3 text-secondary small">
                <i className="fas fa-calculator"></i>
                <span>Estimated TDEE: <strong>{activeMember.tdee} kcal</strong></span>
              </div>
            </div>
          </div>

          {/* BMI Card */}
          <div className="col-md-4">
            <div className="glass-card p-3 h-100">
              <span className="small text-secondary text-uppercase fw-bold letter-spacing">Current BMI</span>
              <h2 className={`fw-bold mt-2 mb-1 text-${activeMember.bmi_category.color}`}>
                {activeMember.bmi}
              </h2>
              <span className={`badge bg-${activeMember.bmi_category.color} badge-pill-grad my-1`}>
                {activeMember.bmi_category.label}
              </span>
            </div>
          </div>

          {/* Diet Preference Card */}
          <div className="col-md-4">
            <div className="glass-card p-3 h-100">
              <span className="small text-secondary text-uppercase fw-bold letter-spacing">Diet & Region</span>
              <h3 className="fw-bold mt-2 mb-1 text-truncate">{activeMember.dietary_type}</h3>
              <div className="d-flex align-items-center gap-2 mt-3 text-secondary small">
                <i className="fas fa-map-marker-alt text-danger"></i>
                <span>Staple: <strong>{activeMember.regional_preference}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Macros Breakdown & Weight Tracker */}
        <div className="row g-4 mb-4">
          {/* Macro Goals */}
          <div className="col-lg-5">
            <div className="glass-card p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-drumstick-bite me-2 text-grad-primary"></i>Daily Macro Targets
              </h5>
              <p className="text-secondary small mb-4">
                Target nutrient budgets computed for health goal: <strong>{activeMember.health_goals}</strong>.
              </p>

              {/* Protein */}
              <div className="macro-box">
                <div className="macro-label">
                  <span className="dot-indicator" style={{ backgroundColor: '#10b981', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span className="ms-1">Protein</span>
                </div>
                <strong className="text-success">{macros.protein}g</strong>
              </div>
              <div className="macro-bar-container mb-3">
                <div className="macro-bar-fill bg-success" style={{ width: '100%' }}></div>
              </div>

              {/* Carbs */}
              <div className="macro-box">
                <div className="macro-label">
                  <span className="dot-indicator" style={{ backgroundColor: '#06b6d4', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span className="ms-1">Carbohydrates</span>
                </div>
                <strong className="text-info">{macros.carbs}g</strong>
              </div>
              <div className="macro-bar-container mb-3">
                <div className="macro-bar-fill bg-info" style={{ width: '100%' }}></div>
              </div>

              {/* Fat */}
              <div className="macro-box">
                <div className="macro-label">
                  <span className="dot-indicator" style={{ backgroundColor: '#f59e0b', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span className="ms-1">Healthy Fats</span>
                </div>
                <strong className="text-warning">{macros.fat}g</strong>
              </div>
              <div className="macro-bar-container">
                <div className="macro-bar-fill bg-warning" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Weight Log and Chart */}
          <div className="col-lg-7">
            <div className="glass-card p-4 h-100">
              <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                <h5 className="fw-bold mb-0">
                  <i className="fas fa-chart-line me-2 text-grad-primary"></i>Weight Tracker Timeline
                </h5>
                {/* Direct Weight Logger form inside dashboard */}
                <form onSubmit={handleWeightSubmit} className="d-flex gap-2 align-items-center">
                  <div className="input-group input-group-sm max-width-150">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      id="logWeightInput"
                      required
                      placeholder="Weight"
                      min="10"
                      max="300"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                    />
                    <span className="input-group-text bg-secondary-subtle border-0 text-secondary">kg</span>
                  </div>
                  <button type="submit" className="btn btn-grad btn-sm py-2 px-3">Log</button>
                </form>
              </div>

              <div className="chart-container mt-4" style={{ position: 'relative', height: '260px', width: '100%' }}>
                {weightLogs.length === 0 ? (
                  <div className="text-center py-5 opacity-75">
                    <i className="fas fa-chart-line fa-3x mb-3 text-secondary"></i>
                    <p className="small text-secondary">No weight history logged yet. Log current weight to start tracking progress.</p>
                  </div>
                ) : (
                  <canvas ref={canvasRef} id="weightHistoryChart"></canvas>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
