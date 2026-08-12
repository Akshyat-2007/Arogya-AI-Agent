'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BmiCalculator() {
  const router = useRouter();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (!h || !w || isNaN(h) || isNaN(w)) return;

    const heightM = h / 100.0;
    const bmiScore = w / (heightM * heightM);
    const roundedBmi = Math.round(bmiScore * 10) / 10;

    let category = '';
    let colorClass = '';
    let assessment = '';

    // Map BMI score to slider left percent: Range 15 to 35
    let percent = ((bmiScore - 15) / (35 - 15)) * 100;
    percent = Math.max(0, Math.min(percent, 100)); // Clamp between 0 and 100

    if (bmiScore < 18.5) {
      category = 'Underweight';
      colorClass = 'warning';
      assessment = 'Your BMI is below the healthy range. Focus on nutrient-rich foods, healthy fats, and strength training. We recommend consulting a healthcare expert to build a healthy calorie surplus plan.';
    } else if (bmiScore >= 18.5 && bmiScore < 25) {
      category = 'Normal Weight';
      colorClass = 'success';
      assessment = 'Congratulations! You are in a healthy, normal weight range. Focus on maintaining your balanced lifestyle, high fiber foods, clean proteins, and regular exercise.';
    } else if (bmiScore >= 25 && bmiScore < 30) {
      category = 'Overweight';
      colorClass = 'warning';
      assessment = 'Your weight is slightly high. Re-examine your portion sizes, reduce refined sugars/processed carbs, and increase active exercise (at least 150 mins per week).';
    } else {
      category = 'Obese';
      colorClass = 'danger';
      assessment = 'Your BMI falls into the obesity category. High risk for insulin resistance, hypertension, and heart issues. We strongly suggest starting a structural diet plan (low fat, calorie deficit) and working with a doctor or dietitian.';
    }

    setResult({
      score: roundedBmi,
      category,
      colorClass,
      assessment,
      percent
    });
  };

  const handleCreateProfile = () => {
    const prefill = {
      height: parseFloat(height),
      weight: parseFloat(weight)
    };
    localStorage.setItem('bmi_prefill', JSON.stringify(prefill));
    router.push('/profiles?prefill=true');
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <h1 className="font-heading fw-bold mb-1">Body Mass Index (BMI) Calculator</h1>
        <p className="text-secondary mb-4">
          Body mass index (BMI) is a measure of body fat based on height and weight that applies to adult men and women.
        </p>

        <div className="row g-4">
          {/* Form Card */}
          <div className="col-md-5">
            <div className="glass-card p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-calculator me-2 text-grad-primary"></i>Calculate BMI
              </h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="bmiHeight" class="form-label">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    id="bmiHeight"
                    required
                    placeholder="e.g. 175"
                    min="50"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="bmiWeight" class="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    id="bmiWeight"
                    required
                    placeholder="e.g. 70"
                    min="10"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-grad w-100 py-2.5">
                  <i className="fas fa-magic me-2"></i>Compute BMI
                </button>
              </form>
            </div>
          </div>

          {/* Results Card */}
          <div className="col-md-7">
            {!result ? (
              <div className="glass-card-static p-4 h-100 d-flex flex-column justify-content-center align-items-center opacity-75">
                <i className="fas fa-chart-bar fa-3x mb-3 text-secondary"></i>
                <p className="text-center">Enter your height and weight to calculate your BMI and nutritional guidelines.</p>
              </div>
            ) : (
              <div className="glass-card-static p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="fw-bold mb-1">Calculation Results</h5>
                  <hr className="opacity-10 my-3" />

                  <div className="row align-items-center">
                    <div className="col-6">
                      <span className="text-secondary small">YOUR SCORE</span>
                      <h1 className="fw-bold font-heading display-4 mb-0 text-grad-primary">
                        {result.score}
                      </h1>
                    </div>
                    <div className="col-6 text-end">
                      <span className="text-secondary small d-block">CATEGORY</span>
                      <span className={`badge bg-${result.colorClass}-subtle text-${result.colorClass} border border-${result.colorClass}-subtle fs-6 py-2 px-3`}>
                        {result.category}
                      </span>
                    </div>
                  </div>

                  {/* Visual Dial slider */}
                  <div className="bmi-wheel-container mt-4">
                    <div className="bmi-pin" style={{ left: `${result.percent}%` }}></div>
                  </div>
                  <div className="d-flex justify-content-between text-secondary small px-1 mb-4">
                    <span>15 (Under)</span>
                    <span>18.5 (Normal)</span>
                    <span>25 (Over)</span>
                    <span>30+ (Obese)</span>
                  </div>

                  <div className="alert bg-secondary-subtle border border-secondary-subtle p-3 rounded-3 small text-secondary mb-0">
                    <h6 className="fw-bold text-primary mb-1">
                      <i className="fas fa-heartbeat me-1"></i>Health Assessment:
                    </h6>
                    <span>{result.assessment}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary-subtle text-end">
                  <button className="btn btn-grad btn-sm" onClick={handleCreateProfile}>
                    <i className="fas fa-user-plus me-1"></i>Create Profile with this BMI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BMI Guidelines Table Reference */}
        <div className="glass-card-static p-4 mt-4">
          <h5 className="fw-bold mb-3">
            <i className="fas fa-info-circle me-2 text-grad-primary"></i>Standard BMI Reference Chart
          </h5>
          <div className="table-responsive">
            <table className="table table-sm border-secondary-subtle text-secondary align-middle mb-0">
              <thead>
                <tr className="text-white border-bottom border-secondary-subtle">
                  <th>BMI Range</th>
                  <th>Classification</th>
                  <th>Health Risks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Below 18.5</td>
                  <td>
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      Underweight
                    </span>
                  </td>
                  <td>Malnutrition, osteoporosis, anemia, and immune deficiencies.</td>
                </tr>
                <tr>
                  <td>18.5 &ndash; 24.9</td>
                  <td>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      Normal Weight
                    </span>
                  </td>
                  <td>Lowest risk of cardiovascular disease, diabetes, and other weight-related conditions.</td>
                </tr>
                <tr>
                  <td>25.0 &ndash; 29.9</td>
                  <td>
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      Overweight
                    </span>
                  </td>
                  <td>Increased risk of high blood pressure, coronary heart disease, and type 2 diabetes.</td>
                </tr>
                <tr>
                  <td>30.0 and above</td>
                  <td>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                      Obese
                    </span>
                  </td>
                  <td>High risk of heart disease, stroke, sleep apnea, osteoarthritis, and metabolic syndromes.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
