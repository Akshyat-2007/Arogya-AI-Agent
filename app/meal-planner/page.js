'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function MealPlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [latestPlan, setLatestPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [planType, setPlanType] = useState('Daily');
  const [activeWeekDay, setActiveWeekDay] = useState('Monday');

  const queryMemberId = searchParams.get('member_id');

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      let member = members.find(m => m.id === parseInt(queryMemberId));
      if (!member) {
        member = members[0];
      }
      setSelectedMember(member);
      fetchMealPlans(member.id);
    }
  }, [members, queryMemberId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealPlans = async (memberId) => {
    try {
      const res = await fetch(`/api/members/${memberId}/meal-plans`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setLatestPlan(data[0]); // Fetch the most recent plan
        } else {
          setLatestPlan(null);
        }
      }
    } catch (e) {
      console.error('Failed to load meal plans:', e);
    }
  };

  const switchMember = (id) => {
    router.push(`/meal-planner?member_id=${id}`);
  };

  const handleGeneratePlan = async () => {
    if (!selectedMember || generating) return;

    setGenerating(true);
    try {
      const res = await fetch(`/api/members/${selectedMember.id}/meal-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: planType })
      });

      if (res.ok) {
        const data = await res.json();
        setLatestPlan(data);
        fetchMealPlans(selectedMember.id);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to generate meal plan'}`);
      }
    } catch (err) {
      console.error('Failed to generate plan:', err);
      alert('Failed to generate plan due to server communication error.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
        <i className="fas fa-utensils fa-4x text-grad-primary mb-3"></i>
        <h3 className="fw-bold mb-2">Setup Your Profiles First</h3>
        <p className="text-secondary max-width-500 mx-auto mb-4">
          No family profiles exist yet. Please create a member profile to start generating customized daily and weekly meal plans.
        </p>
        <Link href="/profiles" className="btn btn-grad px-4 py-2">
          <i className="fas fa-plus me-2"></i>Create Profile
        </Link>
      </div>
    );
  }

  const activeMember = selectedMember || members[0];
  const plan = latestPlan ? latestPlan.plan : null;

  return (
    <div className="row g-4">
      {/* Header control bar */}
      <div className="col-12" id="generatePlanSection">
        <div className="glass-card-static p-4 rounded-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-secondary">Family Member:</span>
              <select
                className="form-select border-secondary-subtle"
                value={activeMember.id}
                onChange={e => switchMember(e.target.value)}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-secondary">Plan Type:</span>
              <select
                className="form-select border-secondary-subtle"
                value={planType}
                onChange={e => setPlanType(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="Daily">Daily Meal Plan</option>
                <option value="Weekly">Weekly Diet Planner</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2">
            {latestPlan && (
              <button className="btn btn-outline-glass px-4" onClick={handlePrint}>
                <i className="fas fa-print me-2"></i>Print/Save
              </button>
            )}
            <button className="btn btn-grad px-4" onClick={handleGeneratePlan} disabled={generating}>
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>Crafting Plan...
                </>
              ) : (
                <>
                  <i className="fas fa-magic me-2"></i>Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main plan display container */}
      <div className="col-12" id="planContainer" style={{ opacity: generating ? 0.5 : 1 }}>
        {!latestPlan ? (
          <div className="glass-card text-center p-5">
            <i className="fas fa-magic fa-4x text-grad-primary mb-3"></i>
            <h3 className="fw-bold mb-2">No Active Meal Plan</h3>
            <p className="text-secondary max-width-600 mx-auto mb-4">
              Craft a customized meal plan for {activeMember.name} based on their calorie targets (
              <strong>{activeMember.target_calories} kcal</strong>) and preferred <strong>{activeMember.dietary_type}</strong> diet.
            </p>
            <button className="btn btn-grad px-4 py-2" onClick={handleGeneratePlan} disabled={generating}>
              <i className="fas fa-magic me-2"></i>Create New Plan
            </button>
          </div>
        ) : (
          <>
            {/* Daily Plan Layout */}
            {latestPlan.plan_type === 'Daily' ? (
              <div className="row g-4">
                {/* Left panel: Calorie / Macro summary */}
                <div className="col-lg-4">
                  <div className="glass-card-static p-4 h-100">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">Daily Plan Summary</span>
                    <h3 className="fw-bold mb-3 font-heading">{activeMember.name}'s Plan</h3>
                    <hr className="opacity-10" />

                    <div className="mb-4">
                      <span className="text-secondary small text-uppercase fw-bold d-block mb-1">Target Caloric Goal</span>
                      <h2 className="fw-bold text-grad-primary mb-0">
                        {plan.calories || activeMember.target_calories} <span className="fs-5 text-secondary">kcal</span>
                      </h2>
                    </div>

                    {/* Macro percentages and levels */}
                    <h6 className="fw-bold mb-3">
                      <i className="fas fa-chart-pie me-2 text-grad-primary"></i>Macros Breakdown
                    </h6>
                    {(() => {
                      const macros = plan.macros || activeMember.target_macros;
                      return (
                        <>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="small text-secondary">
                              <i className="fas fa-dot-circle text-success me-1"></i>Protein:
                            </span>
                            <strong className="text-success">{macros.protein || 0}g</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="small text-secondary">
                              <i className="fas fa-dot-circle text-info me-1"></i>Carbohydrates:
                            </span>
                            <strong className="text-info">{macros.carbs || 0}g</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-3">
                            <span className="small text-secondary">
                              <i className="fas fa-dot-circle text-warning me-1"></i>Fats:
                            </span>
                            <strong className="text-warning">{macros.fat || 0}g</strong>
                          </div>
                        </>
                      );
                    })()}

                    {plan.recommendations && plan.recommendations.length > 0 && (
                      <>
                        <hr className="opacity-10 my-3" />
                        <h6 className="fw-bold mb-2">
                          <i className="fas fa-lightbulb me-2 text-warning"></i>Coach Guidelines:
                        </h6>
                        <ul className="small text-secondary ps-3">
                          {plan.recommendations.map((rec, idx) => (
                            <li key={idx} className="mb-2">{rec}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {/* Right panel: Meals list */}
                <div className="col-lg-8">
                  <div className="d-flex flex-column gap-3">
                    {/* Breakfast */}
                    {plan.meals?.breakfast && (
                      <div className="glass-card-static p-4 rounded-4 border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="meal-type-badge meal-breakfast">Breakfast</span>
                            <h4 className="fw-bold mb-1">{plan.meals.breakfast.title}</h4>
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary py-1 px-2">
                            {plan.meals.breakfast.calories} kcal
                          </span>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Preparation & Portion Size:</strong> {plan.meals.breakfast.ingredients}
                        </p>
                        <div className="d-flex gap-3 text-secondary small opacity-75">
                          <span>Protein: <strong>{plan.meals.breakfast.protein ?? 'N/A'}g</strong></span>
                          <span>Carbs: <strong>{plan.meals.breakfast.carbs ?? 'N/A'}g</strong></span>
                          <span>Fats: <strong>{plan.meals.breakfast.fat ?? 'N/A'}g</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Lunch */}
                    {plan.meals?.lunch && (
                      <div className="glass-card-static p-4 rounded-4 border-start border-4 border-success">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="meal-type-badge meal-lunch">Lunch</span>
                            <h4 className="fw-bold mb-1">{plan.meals.lunch.title}</h4>
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary py-1 px-2">
                            {plan.meals.lunch.calories} kcal
                          </span>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Preparation & Portion Size:</strong> {plan.meals.lunch.ingredients}
                        </p>
                        <div className="d-flex gap-3 text-secondary small opacity-75">
                          <span>Protein: <strong>{plan.meals.lunch.protein ?? 'N/A'}g</strong></span>
                          <span>Carbs: <strong>{plan.meals.lunch.carbs ?? 'N/A'}g</strong></span>
                          <span>Fats: <strong>{plan.meals.lunch.fat ?? 'N/A'}g</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Snacks */}
                    {plan.meals?.snacks && (
                      <div className="glass-card-static p-4 rounded-4 border-start border-4 border-warning">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="meal-type-badge meal-snacks">Snacks</span>
                            <h4 className="fw-bold mb-1">{plan.meals.snacks.title}</h4>
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary py-1 px-2">
                            {plan.meals.snacks.calories} kcal
                          </span>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Preparation & Portion Size:</strong> {plan.meals.snacks.ingredients}
                        </p>
                        <div className="d-flex gap-3 text-secondary small opacity-75">
                          <span>Protein: <strong>{plan.meals.snacks.protein ?? 'N/A'}g</strong></span>
                          <span>Carbs: <strong>{plan.meals.snacks.carbs ?? 'N/A'}g</strong></span>
                          <span>Fats: <strong>{plan.meals.snacks.fat ?? 'N/A'}g</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Dinner */}
                    {plan.meals?.dinner && (
                      <div className="glass-card-static p-4 rounded-4 border-start border-4 border-primary">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="meal-type-badge meal-dinner">Dinner</span>
                            <h4 className="fw-bold mb-1">{plan.meals.dinner.title}</h4>
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary py-1 px-2">
                            {plan.meals.dinner.calories} kcal
                          </span>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Preparation & Portion Size:</strong> {plan.meals.dinner.ingredients}
                        </p>
                        <div className="d-flex gap-3 text-secondary small opacity-75">
                          <span>Protein: <strong>{plan.meals.dinner.protein ?? 'N/A'}g</strong></span>
                          <span>Carbs: <strong>{plan.meals.dinner.carbs ?? 'N/A'}g</strong></span>
                          <span>Fats: <strong>{plan.meals.dinner.fat ?? 'N/A'}g</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Weekly Plan Layout */
              <div className="glass-card-static p-4 rounded-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle mb-2">
                      Weekly Diet Schedule
                    </span>
                    <h3 className="fw-bold mb-1 font-heading">{activeMember.name}'s Weekly Plan</h3>
                  </div>
                </div>

                {/* Days Navigation Tabs */}
                <ul className="nav nav-tabs border-secondary-subtle mb-4" id="weeklyPlanTab" role="tablist">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <li className="nav-item" role="presentation" key={day}>
                      <button
                        className={`nav-link border-0 px-3 py-2 fw-semibold ${
                          activeWeekDay === day ? 'active' : ''
                        }`}
                        onClick={() => setActiveWeekDay(day)}
                        type="button"
                        role="tab"
                      >
                        {day}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="tab-content" id="weeklyPlanTabContent">
                  {(() => {
                    const dayData = plan.days?.[activeWeekDay] || { calories: 0, macros: { protein: 0, carbs: 0, fat: 0 }, meals: {} };
                    return (
                      <div className="tab-pane fade show active">
                        {/* Daily Targets inside tab */}
                        <div className="row g-3 mb-4">
                          <div className="col-md-6 col-lg-3">
                            <div className="p-3 bg-secondary-subtle rounded-3 text-center border border-secondary-subtle">
                              <span className="small text-secondary d-block">Calories</span>
                              <h4 className="fw-bold text-grad-primary mb-0 mt-1">{dayData.calories || 0} kcal</h4>
                            </div>
                          </div>
                          <div className="col-md-6 col-lg-3">
                            <div className="p-3 bg-secondary-subtle rounded-3 text-center border border-secondary-subtle">
                              <span className="small text-secondary d-block">Protein</span>
                              <h4 className="fw-bold text-success mb-0 mt-1">{dayData.macros?.protein || 0}g</h4>
                            </div>
                          </div>
                          <div className="col-md-6 col-lg-3">
                            <div className="p-3 bg-secondary-subtle rounded-3 text-center border border-secondary-subtle">
                              <span className="small text-secondary d-block">Carbohydrates</span>
                              <h4 className="fw-bold text-info mb-0 mt-1">{dayData.macros?.carbs || 0}g</h4>
                            </div>
                          </div>
                          <div className="col-md-6 col-lg-3">
                            <div className="p-3 bg-secondary-subtle rounded-3 text-center border border-secondary-subtle">
                              <span className="small text-secondary d-block">Fats</span>
                              <h4 className="fw-bold text-warning mb-0 mt-1">{dayData.macros?.fat || 0}g</h4>
                            </div>
                          </div>
                        </div>

                        {/* Meals List */}
                        <div className="row g-3">
                          {Object.entries(dayData.meals || {}).map(([mealType, mealInfo]) => (
                            <div className="col-md-6" key={mealType}>
                              <div className="p-3 bg-secondary-subtle border border-secondary-subtle rounded-4 h-100">
                                <span className={`meal-type-badge meal-${mealType}`}>
                                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </span>
                                <h5 className="fw-bold mb-1">{mealInfo.title}</h5>
                                <p className="small text-secondary mb-0 mt-2">{mealInfo.ingredients}</p>
                                {mealInfo.calories && (
                                  <div className="text-end mt-2">
                                    <span className="badge bg-secondary-subtle text-secondary small">
                                      {mealInfo.calories} kcal
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {plan.recommendations && plan.recommendations.length > 0 && (
                  <>
                    <hr className="opacity-10 my-4" />
                    <h5 className="fw-bold mb-3">
                      <i className="fas fa-lightbulb me-2 text-warning"></i>Coach Guidelines:
                    </h5>
                    <ul className="text-secondary small ps-3">
                      {plan.recommendations.map((rec, idx) => (
                        <li key={idx} className="mb-2">{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MealPlannerPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <MealPlannerContent />
    </Suspense>
  );
}
