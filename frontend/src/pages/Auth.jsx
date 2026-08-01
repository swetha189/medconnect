import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Activity, ShieldCheck, Mail, Lock, User, Phone, Calendar, Heart, Stethoscope, Clock, Hourglass } from 'lucide-react';

const SPECIALIZATIONS = [
  'Cardiology','Pediatrics','Gynecology','Orthopedics','Neurology',
  'General Medicine','Dermatology','Psychiatry','Ophthalmology','Emergency Medicine',
  'Radiology','Oncology','Urology','Gastroenterology','Endocrinology'
];

const inputStyle = { paddingLeft: '44px' };

const InputWithIcon = ({ Icon, ...props }) => (
  <div style={{ position: 'relative' }}>
    <Icon size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '15px', pointerEvents: 'none' }} />
    <input {...props} style={inputStyle} />
  </div>
);

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'login', label: 'Sign In' },
  { id: 'patient', label: 'Patient Sign Up' },
  { id: 'doctor', label: 'Doctor Sign Up' },
];

const Auth = () => {
  const { login, registerPatient } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Shared fields ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // ── Patient fields ────────────────────────────────────────────────────────
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // ── Doctor fields ─────────────────────────────────────────────────────────
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  const resetForm = () => {
    setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setPhone('');
    setDateOfBirth(''); setGender('Female'); setBloodGroup('O+'); setAllergies('');
    setEmergencyContactName(''); setEmergencyContactPhone('');
    setSpecialization('General Medicine'); setQualification('');
    setExperienceYears(''); setConsultationFee('');
    setError(''); setSuccessMsg('');
  };

  const switchTab = (tab) => { resetForm(); setActiveTab(tab); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else if (activeTab === 'patient') {
        await registerPatient({ email, password, firstName, lastName, phone, dateOfBirth, gender, bloodGroup, allergies, emergencyContactName, emergencyContactPhone });
      } else if (activeTab === 'doctor') {
        const res = await api.post('/auth/register/doctor', { email, password, firstName, lastName, phone, specialization, qualification, experienceYears: parseInt(experienceYears) || 0, consultationFee: parseFloat(consultationFee) || 0 });
        setSuccessMsg(res.message || 'Registration submitted! Awaiting Hospital Admin approval.');
        resetForm();
        setActiveTab('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxWidth = activeTab === 'login' ? '460px' : '820px';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '24px' }}>
      <div className="bg-glow-1" style={{ top: '-20%', left: '-10%', width: '600px', height: '600px' }}></div>
      <div className="bg-glow-2" style={{ bottom: '-20%', right: '-10%', width: '600px', height: '600px' }}></div>

      <div className="glass-card fade-in" style={{ width: '100%', maxWidth, position: 'relative', zIndex: 10 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={36} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 12px #3b82f6)' }} />
            <span style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.04em' }}>Med<span style={{ color: '#3b82f6' }}>Connect</span></span>
          </div>
          <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Apollo Hospitals · Digital Healthcare Ecosystem</p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '28px', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '9px',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'rgba(59,130,246,0.85)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 2px 12px rgba(59,130,246,0.35)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '14px 16px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Hourglass size={20} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong>Registration Submitted!</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── LOGIN FORM ── */}
          {activeTab === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Email Address</label>
                <InputWithIcon Icon={Mail} type="email" placeholder="name@hospital.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <InputWithIcon Icon={Lock} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
          )}

          {/* ── PATIENT SIGNUP FORM ── */}
          {activeTab === 'patient' && (
            <div className="grid-cols-2">
              <div>
                <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px', color: '#3b82f6' }}>Account Credentials</h3>
                <div className="form-group"><label>First Name</label><input type="text" placeholder="Swethalakshmi" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                <div className="form-group"><label>Last Name</label><input type="text" placeholder="Rajan" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                <div className="form-group"><label>Email Address</label><input type="email" placeholder="swethalakshmi@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="form-group"><label>Password</label><input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" placeholder="9444200001" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px', color: '#3b82f6' }}>Medical Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label>Date of Birth</label><input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required /></div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Known Allergies</label><input type="text" placeholder="e.g. Penicillin, Dust (or None)" value={allergies} onChange={e => setAllergies(e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label>Emergency Contact</label><input type="text" placeholder="Rajendran Rajan" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} /></div>
                  <div className="form-group"><label>Emergency Phone</label><input type="tel" placeholder="9444200099" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ── DOCTOR SIGNUP FORM ── */}
          {activeTab === 'doctor' && (
            <div className="grid-cols-2">
              <div>
                <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px', color: '#3b82f6' }}>Personal Details</h3>
                <div className="form-group"><label>First Name</label><input type="text" placeholder="Arunachalam" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                <div className="form-group"><label>Last Name</label><input type="text" placeholder="Subramaniam" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                <div className="form-group"><label>Email Address</label><input type="email" placeholder="doctor@apollo.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="form-group"><label>Password</label><input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" placeholder="9444300001" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px', color: '#3b82f6' }}>Professional Details</h3>
                <div className="form-group">
                  <label>Specialization</label>
                  <select value={specialization} onChange={e => setSpecialization(e.target.value)}>
                    {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Qualification</label><input type="text" placeholder="MD, DM (Cardiology) – Madras Medical College" value={qualification} onChange={e => setQualification(e.target.value)} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label>Experience (Years)</label><input type="number" min="0" max="60" placeholder="10" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} /></div>
                  <div className="form-group"><label>Consultation Fee (₹)</label><input type="number" min="0" placeholder="500" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} /></div>
                </div>
                {/* Pending notice */}
                <div style={{ marginTop: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Hourglass size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.85rem', margin: 0 }}>Approval Required</p>
                    <p style={{ color: '#d1d5db', fontSize: '0.8rem', margin: '4px 0 0' }}>Your registration will be reviewed by the Apollo Hospital Admin. You will receive a notification once approved and will then be able to log in.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '24px', padding: '14px' }}
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In to MedConnect' : activeTab === 'patient' ? 'Create Patient Account' : 'Submit Doctor Registration'}
          </button>
        </form>

        {/* Demo Credentials */}
        {activeTab === 'login' && (
          <div className="glass-card" style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', fontSize: '0.82rem' }}>
            <h4 style={{ color: '#3b82f6', marginBottom: '10px', fontSize: '0.875rem' }}>🔑 Demo Accounts (Password: password123)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', color: '#9ca3af' }}>
              <div>👤 Patient: <code style={{ color: '#e5e7eb' }}>patient@medconnect.com</code></div>
              <div>🩺 Doctor: <code style={{ color: '#e5e7eb' }}>doctor@medconnect.com</code></div>
              <div>🏥 Hosp Admin: <code style={{ color: '#e5e7eb' }}>hadmin@medconnect.com</code></div>
              <div>🔬 Lab Tech: <code style={{ color: '#e5e7eb' }}>labtech@medconnect.com</code></div>
              <div>💊 Pharmacist: <code style={{ color: '#e5e7eb' }}>pharmacist@medconnect.com</code></div>
              <div>🛡️ Super Admin: <code style={{ color: '#e5e7eb' }}>admin@medconnect.com</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
