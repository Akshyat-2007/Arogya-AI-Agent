'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function ProfilesContent() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    activity_level: '', dietary_type: '', health_goals: '',
    regional_preference: 'None', allergies: ''
  });

  const [editFormData, setEditFormData] = useState({
    id: '', name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    activity_level: '', dietary_type: '', health_goals: '',
    regional_preference: 'None', allergies: ''
  });

  useEffect(() => {
    fetchMembers();

    // Check for prefill redirection from BMI page
    const shouldPrefill = searchParams.get('prefill') === 'true';
    if (shouldPrefill) {
      const prefillStr = localStorage.getItem('bmi_prefill');
      if (prefillStr) {
        const prefill = JSON.parse(prefillStr);
        setFormData(prev => ({
          ...prev,
          height_cm: prefill.height || '',
          weight_kg: prefill.weight || ''
        }));
        setIsAddModalOpen(true);
        localStorage.removeItem('bmi_prefill');
      }
    }
  }, [searchParams]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to load profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          name: '', age: '', gender: '', height_cm: '', weight_kg: '',
          activity_level: '', dietary_type: '', health_goals: '',
          regional_preference: 'None', allergies: ''
        });
        fetchMembers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/members/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchMembers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  const openEditModal = (member) => {
    setEditFormData({
      id: member.id,
      name: member.name,
      age: member.age,
      gender: member.gender.toLowerCase(),
      height_cm: member.height_cm,
      weight_kg: member.weight_kg,
      activity_level: member.activity_level.toLowerCase(),
      dietary_type: member.dietary_type,
      health_goals: member.health_goals,
      regional_preference: member.regional_preference,
      allergies: member.allergies || ''
    });
    setIsEditModalOpen(true);
  };

  const deleteMember = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete the profile for ${name}? All charts, weight logs, and meal plans for them will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete member.');
    }
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

  return (
    <div>
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <h1 className="font-heading fw-bold mb-1">Family Profiles</h1>
          <p className="text-secondary">Manage personalized profiles for every family member to customize their nutrition goals.</p>
        </div>
        <div className="col-md-4 text-md-end">
          <button className="btn btn-grad px-4 py-2" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-plus me-2"></i>Add Member
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="glass-card-static text-center p-5 my-5">
          <i className="fas fa-users fa-4x text-grad-primary mb-3"></i>
          <h3 className="fw-bold mb-2">No Profiles Found</h3>
          <p className="text-secondary max-width-500 mx-auto mb-4">
            To get started with personalized meal plans, calorie tracking, and nutritional advice, please add your first family member profile.
          </p>
          <button className="btn btn-grad" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-user-plus me-2"></i>Add First Profile
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {members.map(member => (
            <div className="col-md-6 col-lg-4" key={member.id}>
              <div className="glass-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar-circle">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold">{member.name}</h4>
                        <span className="badge bg-secondary-subtle text-secondary small">
                          {member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}, {member.age} yrs
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className={`badge bg-${member.bmi_category.color} badge-pill-grad`}>
                        {member.bmi_category.label}
                      </span>
                    </div>
                  </div>

                  <hr className="opacity-10 my-3" />

                  <div className="row g-2 mb-3 text-secondary small">
                    <div className="col-6">
                      <i className="fas fa-arrows-alt-v me-2"></i>Height: <strong>{member.height_cm} cm</strong>
                    </div>
                    <div className="col-6">
                      <i className="fas fa-weight me-2"></i>Weight: <strong>{member.weight_kg} kg</strong>
                    </div>
                    <div className="col-6">
                      <i className="fas fa-calculator me-2"></i>BMI: <strong>{member.bmi}</strong>
                    </div>
                    <div className="col-6">
                      <i className="fas fa-burn me-2"></i>Target: <strong>{member.target_calories} kcal</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        <i className="fas fa-utensils me-1"></i>{member.dietary_type}
                      </span>
                      {member.regional_preference && member.regional_preference !== 'None' && (
                        <span className="badge bg-info-subtle text-info border border-info-subtle">
                          <i className="fas fa-map-marker-alt me-1"></i>{member.regional_preference}
                        </span>
                      )}
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="fas fa-bullseye me-1"></i>{member.health_goals}
                      </span>
                    </div>
                  </div>

                  {member.allergies && (
                    <div className="alert alert-danger-subtle bg-danger-subtle border border-danger-subtle text-danger py-1 px-2 rounded-2 small mb-3">
                      <i className="fas fa-exclamation-circle me-1"></i>Allergies: {member.allergies}
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2 mt-4 pt-2 border-top border-secondary-subtle">
                  <Link href={`/dashboard?member_id=${member.id}`} className="btn btn-outline-glass btn-sm flex-grow-1">
                    <i className="fas fa-tachometer-alt me-1"></i>Dashboard
                  </Link>
                  <button className="btn btn-outline-glass btn-sm text-primary border-primary-subtle" onClick={() => openEditModal(member)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn btn-outline-glass btn-sm text-danger border-danger-subtle" onClick={() => deleteMember(member.id, member.name)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card-static border-0 p-3">
              <div className="modal-header border-0">
                <h4 className="modal-title fw-bold">Add Family Member Profile</h4>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsAddModalOpen(false)}></button>
              </div>
              <div className="modal-body border-0">
                <form onSubmit={handleAddSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="addName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="addName"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="addAge" className="form-label">Age (years)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="addAge"
                        required
                        min="1"
                        max="120"
                        placeholder="e.g. 35"
                        value={formData.age}
                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="addGender" className="form-label">Gender</label>
                      <select
                        className="form-select"
                        id="addGender"
                        required
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="" disabled>Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="addHeight" className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="addHeight"
                        required
                        min="50"
                        max="250"
                        step="0.1"
                        placeholder="e.g. 172"
                        value={formData.height_cm}
                        onChange={e => setFormData({ ...formData, height_cm: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="addWeight" className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="addWeight"
                        required
                        min="10"
                        max="300"
                        step="0.1"
                        placeholder="e.g. 72.5"
                        value={formData.weight_kg}
                        onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="addActivity" className="form-label">Activity Level</label>
                      <select
                        className="form-select"
                        id="addActivity"
                        required
                        value={formData.activity_level}
                        onChange={e => setFormData({ ...formData, activity_level: e.target.value })}
                      >
                        <option value="" disabled>Select activity level</option>
                        <option value="sedentary">Sedentary (Little/no exercise)</option>
                        <option value="light">Lightly Active (Light exercise 1-3 days/wk)</option>
                        <option value="moderate">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                        <option value="active">Very Active (Hard exercise 6-7 days/wk)</option>
                        <option value="extra">Extra Active (Very physical job or athletic training)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="addDiet" className="form-label">Dietary Preference</label>
                      <select
                        className="form-select"
                        id="addDiet"
                        required
                        value={formData.dietary_type}
                        onChange={e => setFormData({ ...formData, dietary_type: e.target.value })}
                      >
                        <option value="" disabled>Select diet type</option>
                        <option value="Vegetarian">Vegetarian (Lacto-vegetarian)</option>
                        <option value="Vegan">Vegan (Plant-based)</option>
                        <option value="Eggetarian">Eggetarian (Egg-eating Vegetarian)</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="addGoal" className="form-label">Health Goal</label>
                      <select
                        className="form-select"
                        id="addGoal"
                        required
                        value={formData.health_goals}
                        onChange={e => setFormData({ ...formData, health_goals: e.target.value })}
                      >
                        <option value="" disabled>Select health goal</option>
                        <option value="Weight Loss">Weight Loss (Caloric Deficit)</option>
                        <option value="Muscle Gain">Muscle Gain (Caloric Surplus)</option>
                        <option value="Maintenance">Maintenance (Balanced Calories)</option>
                        <option value="Managing Health">Managing Diabetes / Health Conditions</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="addRegional" className="form-label">Indian Regional Staple Preference</label>
                      <select
                        className="form-select"
                        id="addRegional"
                        value={formData.regional_preference}
                        onChange={e => setFormData({ ...formData, regional_preference: e.target.value })}
                      >
                        <option value="None">No regional preference (Standard Indian)</option>
                        <option value="North Indian">North Indian (Rotis, Dals, Sabzis)</option>
                        <option value="South Indian">South Indian (Idli/Dosa, Sambar, Rice)</option>
                        <option value="West Indian">West Indian (Thepla, Khichdi, Kadhi)</option>
                        <option value="East Indian">East Indian (Rice, Fish, Dalma)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label htmlFor="addAllergies" className="form-label">Allergies / Intolerances (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="addAllergies"
                        placeholder="e.g. Gluten, Peanuts, Lactose (comma separated)"
                        value={formData.allergies}
                        onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-outline-glass" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-grad">Create Profile</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card-static border-0 p-3">
              <div className="modal-header border-0">
                <h4 className="modal-title fw-bold">Edit Family Member Profile</h4>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsEditModalOpen(false)}></button>
              </div>
              <div className="modal-body border-0">
                <form onSubmit={handleEditSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="editName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="editName"
                        required
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="editAge" className="form-label">Age (years)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="editAge"
                        required
                        min="1"
                        max="120"
                        value={editFormData.age}
                        onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="editGender" className="form-label">Gender</label>
                      <select
                        className="form-select"
                        id="editGender"
                        required
                        value={editFormData.gender}
                        onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="editHeight" className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="editHeight"
                        required
                        min="50"
                        max="250"
                        step="0.1"
                        value={editFormData.height_cm}
                        onChange={e => setEditFormData({ ...editFormData, height_cm: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editWeight" className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="editWeight"
                        required
                        min="10"
                        max="300"
                        step="0.1"
                        value={editFormData.weight_kg}
                        onChange={e => setEditFormData({ ...editFormData, weight_kg: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="editActivity" className="form-label">Activity Level</label>
                      <select
                        className="form-select"
                        id="editActivity"
                        required
                        value={editFormData.activity_level}
                        onChange={e => setEditFormData({ ...editFormData, activity_level: e.target.value })}
                      >
                        <option value="sedentary">Sedentary (Little/no exercise)</option>
                        <option value="light">Lightly Active (Light exercise 1-3 days/wk)</option>
                        <option value="moderate">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                        <option value="active">Very Active (Hard exercise 6-7 days/wk)</option>
                        <option value="extra">Extra Active (Very physical job or athletic training)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editDiet" className="form-label">Dietary Preference</label>
                      <select
                        className="form-select"
                        id="editDiet"
                        required
                        value={editFormData.dietary_type}
                        onChange={e => setEditFormData({ ...editFormData, dietary_type: e.target.value })}
                      >
                        <option value="Vegetarian">Vegetarian (Lacto-vegetarian)</option>
                        <option value="Vegan">Vegan (Plant-based)</option>
                        <option value="Eggetarian">Eggetarian (Egg-eating Vegetarian)</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="editGoal" className="form-label">Health Goal</label>
                      <select
                        className="form-select"
                        id="editGoal"
                        required
                        value={editFormData.health_goals}
                        onChange={e => setEditFormData({ ...editFormData, health_goals: e.target.value })}
                      >
                        <option value="Weight Loss">Weight Loss (Caloric Deficit)</option>
                        <option value="Muscle Gain">Muscle Gain (Caloric Surplus)</option>
                        <option value="Maintenance">Maintenance (Balanced Calories)</option>
                        <option value="Managing Health">Managing Diabetes / Health Conditions</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editRegional" className="form-label">Indian Regional Staple Preference</label>
                      <select
                        className="form-select"
                        id="editRegional"
                        value={editFormData.regional_preference}
                        onChange={e => setEditFormData({ ...editFormData, regional_preference: e.target.value })}
                      >
                        <option value="None">No regional preference (Standard Indian)</option>
                        <option value="North Indian">North Indian (Rotis, Dals, Sabzis)</option>
                        <option value="South Indian">South Indian (Idli/Dosa, Sambar, Rice)</option>
                        <option value="West Indian">West Indian (Thepla, Khichdi, Kadhi)</option>
                        <option value="East Indian">East Indian (Rice, Fish, Dalma)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label htmlFor="editAllergies" className="form-label">Allergies / Intolerances (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="editAllergies"
                        value={editFormData.allergies}
                        onChange={e => setEditFormData({ ...editFormData, allergies: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-outline-glass" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-grad">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <ProfilesContent />
    </Suspense>
  );
}
