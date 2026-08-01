import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Activity, Calendar, FileText, Share2, FlaskConical, ShoppingBag, 
  User, CheckCircle, Clock, AlertTriangle, Search, Plus, Trash2, 
  MapPin, Bed, ExternalLink, RefreshCw, X
} from 'lucide-react';

const DashboardController = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  
  // Universal States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  
  // Data States
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consentGrants, setConsentGrants] = useState([]);
  
  // Dashboard Analytics (Admin)
  const [metrics, setMetrics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  // Search/Filters (Booking & Management)
  const [searchDoctor, setSearchDoctor] = useState('');
  const [filterDept, setFilterDept] = useState('');
  
  // Form States
  // 1. Appointment Booking
  const [bookHospitalId, setBookHospitalId] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [doctorSlots, setDoctorSlots] = useState([]);

  // 2. EHR Creation (Doctor)
  const [ehrPatientId, setEhrPatientId] = useState('');
  const [ehrDiagnosis, setEhrDiagnosis] = useState('');
  const [ehrPlan, setEhrPlan] = useState('');
  const [ehrFollowUp, setEhrFollowUp] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

  // 3. Consent Granting (Patient)
  const [consentDoctorUserId, setConsentDoctorUserId] = useState('');
  const [consentDuration, setConsentDuration] = useState('7');

  // 4. Referral Creation (Doctor)
  const [refPatientId, setRefPatientId] = useState('');
  const [refHospitalId, setRefHospitalId] = useState('');
  const [refReason, setRefReason] = useState('');

  // 5. Lab Upload (Lab Tech)
  const [labPatientId, setLabPatientId] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [labIsCritical, setLabIsCritical] = useState(false);
  const [labFile, setLabFile] = useState(null);

  // 6. Beds Editing (Hospital Admin)
  const [bedGeneral, setBedGeneral] = useState(0);
  const [bedIcu, setBedIcu] = useState(0);
  const [bedEmergency, setBedEmergency] = useState(0);
  const [bedNicu, setBedNicu] = useState(0);

  // 7. Reschedule Modal
  const [rescheduleApptId, setRescheduleApptId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // 8. View EHR Modal (Doctor/Admin)
  const [viewEhrPatientId, setViewEhrPatientId] = useState(null);
  const [viewEhrPatientName, setViewEhrPatientName] = useState('');

  // Load Initial Tab Data
  useEffect(() => {
    fetchData();
  }, [currentTab, user]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Always fetch notifications
      const notifs = await api.get('/notifications');
      setNotifications(notifs);

      if (currentTab === 'overview') {
        if (user.role === 'HOSPITAL_ADMIN' || user.role === 'SUPER_ADMIN') {
          const m = await api.get('/dashboard/metrics');
          setMetrics(m);
          if (m.bedSummary && user.role === 'HOSPITAL_ADMIN') {
            setBedGeneral(m.bedSummary.availableBeds);
            setBedIcu(m.bedSummary.availableIcuBeds);
            setBedEmergency(m.bedSummary.availableEmergencyBeds);
            setBedNicu(m.bedSummary.availableNicuBeds);
          }
        } else {
          // List user specific appointments
          const appts = await api.get('/appointments');
          setAppointments(appts.slice(0, 5));
        }
      }

      if (currentTab === 'appointments') {
        const appts = await api.get('/appointments');
        setAppointments(appts);
        
        if (user.role === 'PATIENT') {
          const hosps = await api.get('/hospitals');
          setHospitals(hosps);
        }
      }

      if (currentTab === 'records') {
        if (user.role === 'PATIENT') {
          const recs = await api.get(`/ehr/patient/${user.patientId}`);
          setRecords(recs);
        } else if (user.role === 'DOCTOR') {
          // Fetch patients from appointments or consent
          const appts = await api.get('/appointments');
          const uniquePatients = [];
          const seen = new Set();
          appts.forEach(a => {
            if (!seen.has(a.patientId)) {
              seen.add(a.patientId);
              uniquePatients.push(a.patient);
            }
          });
          setRecords(uniquePatients);
        }
      }

      if (currentTab === 'ehr-create') {
        // List patients
        const appts = await api.get('/appointments');
        const uniquePatients = [];
        const seen = new Set();
        appts.forEach(a => {
          if (!seen.has(a.patientId)) {
            seen.add(a.patientId);
            uniquePatients.push(a.patient);
          }
        });
        setRecords(uniquePatients);
      }

      if (currentTab === 'referrals') {
        const refs = await api.get('/referrals');
        setReferrals(refs);
        if (user.role === 'DOCTOR') {
          // Fetch patients
          const appts = await api.get('/appointments');
          const uniquePatients = [];
          const seen = new Set();
          appts.forEach(a => {
            if (!seen.has(a.patientId)) {
              seen.add(a.patientId);
              uniquePatients.push(a.patient);
            }
          });
          setRecords(uniquePatients);
          const hosps = await api.get('/hospitals');
          setHospitals(hosps);
        }
      }

      if (currentTab === 'labs') {
        const reports = await api.get('/labs/reports');
        setLabReports(reports);
      }

      if (currentTab === 'labs-upload') {
        // List patient users
        const appts = await api.get('/appointments');
        const uniquePatients = [];
        const seen = new Set();
        appts.forEach(a => {
          if (!seen.has(a.patientId)) {
            seen.add(a.patientId);
            uniquePatients.push(a.patient);
          }
        });
        setRecords(uniquePatients);
      }

      if (currentTab === 'consent') {
        const grants = await api.get('/consent');
        setConsentGrants(grants);
        const docs = await api.get('/doctors');
        setDoctors(docs);
      }

      if (currentTab === 'pharmacy-queue') {
        const prescs = await api.get('/pharmacy/prescriptions');
        setPrescriptions(prescs);
      }

      if (currentTab === 'beds') {
        const hosps = await api.get('/hospitals');
        setHospitals(hosps);
      }

      if (currentTab === 'doctors-list') {
        const docs = await api.get('/doctors');
        setDoctors(docs);
      }

      if (currentTab === 'pending-approvals') {
        const pending = await api.get('/doctors/admin/pending');
        setPendingDoctors(pending);
      }

    } catch (err) {
      setError(err.message || 'Error fetching dynamic tab data');
    } finally {
      setLoading(false);
    }
  };

  // Helper when Patient selects a hospital
  const handleHospitalChange = async (hospId) => {
    setBookHospitalId(hospId);
    setBookDoctorId('');
    setDoctorSlots([]);
    if (!hospId) return;

    try {
      const docs = await api.get(`/doctors?hospitalId=${hospId}`);
      setDoctors(docs);
    } catch (err) {
      setError('Failed to fetch doctors for hospital');
    }
  };

  // Helper when Patient selects a doctor
  const handleDoctorChange = (docId) => {
    setBookDoctorId(docId);
    const doc = doctors.find(d => d.id === parseInt(docId));
    if (doc) {
      setDoctorSlots(JSON.parse(doc.availabilitySchedule || '[]'));
    } else {
      setDoctorSlots([]);
    }
  };

  // Form Submissions
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/appointments', {
        doctorId: parseInt(bookDoctorId),
        hospitalId: parseInt(bookHospitalId),
        date: bookDate,
        slotTime: bookSlot,
        notes: bookNotes
      });
      setSuccess('Appointment booked successfully!');
      setBookHospitalId('');
      setBookDoctorId('');
      setBookDate('');
      setBookSlot('');
      setBookNotes('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (apptId, status) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/appointments/${apptId}/status`, { status });
      setSuccess(`Appointment status updated to ${status}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.patch(`/appointments/${rescheduleApptId}/reschedule`, {
        date: rescheduleDate,
        slotTime: rescheduleSlot
      });
      setSuccess('Appointment rescheduled successfully');
      setRescheduleApptId(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateEhr = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/ehr/records', {
        patientId: parseInt(ehrPatientId),
        diagnosis: ehrDiagnosis,
        treatmentPlan: ehrPlan,
        followUpNotes: ehrFollowUp,
        prescriptionItems
      });
      setSuccess('Medical record & prescription created successfully!');
      setEhrPatientId('');
      setEhrDiagnosis('');
      setEhrPlan('');
      setEhrFollowUp('');
      setPrescriptionItems([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/consent', {
        targetUserId: parseInt(consentDoctorUserId),
        accessType: 'VIEW_RECORDS',
        durationDays: parseInt(consentDuration)
      });
      setSuccess('Consent granted successfully');
      setConsentDoctorUserId('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeConsent = async (grantId) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/consent/${grantId}`);
      setSuccess('Consent access revoked');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/referrals', {
        patientId: parseInt(refPatientId),
        targetHospitalId: parseInt(refHospitalId),
        reason: refReason
      });
      setSuccess('Referral created successfully');
      setRefPatientId('');
      setRefHospitalId('');
      setRefReason('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAcceptReferral = async (refId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/referrals/${refId}/status`, { status: 'ACCEPTED' });
      setSuccess('Referral accepted');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadLabReport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!labFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('patientId', labPatientId);
      formData.append('testName', labTestName);
      formData.append('isCritical', labIsCritical);
      formData.append('reportFile', labFile);

      await api.post('/labs/upload', formData);
      setSuccess('Lab report uploaded successfully!');
      setLabPatientId('');
      setLabTestName('');
      setLabIsCritical(false);
      setLabFile(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFulfillPrescription = async (prescId, status) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/pharmacy/prescriptions/${prescId}/status`, { status });
      setSuccess(`Prescription marked as ${status}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const hosp = metrics?.recentLogs?.[0]?.user ? 1 : 1; // City Central default
      await api.patch(`/hospitals/${hosp}/beds`, {
        availableBeds: bedGeneral,
        availableIcuBeds: bedIcu,
        availableEmergencyBeds: bedEmergency,
        availableNicuBeds: bedNicu
      });
      setSuccess('Bed availability capacity updated successfully');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewEhr = async (patientId, patientName) => {
    setViewEhrPatientId(patientId);
    setViewEhrPatientName(patientName);
    setError('');
    try {
      const recs = await api.get(`/ehr/patient/${patientId}`);
      setRecords(recs);
    } catch (err) {
      setError(err.message);
      setRecords([]);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/doctors/admin/${doctorId}/approve`);
      setSuccess('Doctor approved successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to reject this doctor registration?')) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/doctors/admin/${doctorId}/reject`);
      setSuccess('Doctor registration rejected.');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkNotifRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      {/* Messages */}
      {error && (
        <div className="glass-card" style={{ background: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.25)', color: '#f43f5e', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {success}
        </div>
      )}

      {loading && <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '16px' }} className="flex-center"><RefreshCw className="animate-spin" size={18} style={{ marginRight: '8px' }} /> Loading page details...</div>}

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. OVERVIEW */}
      {currentTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Welcome Dashboard metrics */}
          {(user.role === 'HOSPITAL_ADMIN' || user.role === 'SUPER_ADMIN') && metrics ? (
            <>
              <div className="grid-cols-4">
                <div className="glass-card metric-card">
                  <div className="metric-icon"><User size={24} /></div>
                  <div className="metric-details">
                    <p>Total Patients</p>
                    <h3>{metrics.patientsCount}</h3>
                  </div>
                </div>
                <div className="glass-card metric-card" style={{ '--primary': '#8b5cf6' }}>
                  <div className="metric-icon" style={{ background: 'rgba(139,92,246,0.1)' }}><Activity size={24} /></div>
                  <div className="metric-details">
                    <p>Total Doctors</p>
                    <h3>{metrics.doctorsCount}</h3>
                  </div>
                </div>
                <div className="glass-card metric-card" style={{ '--primary': '#10b981' }}>
                  <div className="metric-icon" style={{ background: 'rgba(16,185,129,0.1)' }}><Calendar size={24} /></div>
                  <div className="metric-details">
                    <p>Appointments</p>
                    <h3>{metrics.appointmentsCount}</h3>
                  </div>
                </div>
                <div className="glass-card metric-card" style={{ '--primary': '#f59e0b' }}>
                  <div className="metric-icon" style={{ background: 'rgba(245,158,11,0.1)' }}><Share2 size={24} /></div>
                  <div className="metric-details">
                    <p>Referrals</p>
                    <h3>{metrics.referralsCount}</h3>
                  </div>
                </div>
              </div>

              {/* Beds Summary Graph */}
              {metrics.bedSummary && (
                <div className="grid-cols-2">
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><Bed size={20} color="#3b82f6" /> Bed Capacity Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { label: 'General Beds', total: metrics.bedSummary.totalBeds, avail: metrics.bedSummary.availableBeds, color: '#3b82f6' },
                        { label: 'ICU Beds', total: metrics.bedSummary.totalIcuBeds, avail: metrics.bedSummary.availableIcuBeds, color: '#8b5cf6' },
                        { label: 'Emergency Beds', total: metrics.bedSummary.totalEmergencyBeds, avail: metrics.bedSummary.availableEmergencyBeds, color: '#f43f5e' },
                        { label: 'NICU Beds', total: metrics.bedSummary.totalNicuBeds, avail: metrics.bedSummary.availableNicuBeds, color: '#f59e0b' }
                      ].map((b, i) => {
                        const pct = b.total > 0 ? (b.avail / b.total) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex-between" style={{ marginBottom: '6px', fontSize: '0.9rem' }}>
                              <span>{b.label}</span>
                              <span><strong>{b.avail}</strong> / {b.total} Available</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: b.color, borderRadius: '999px', transition: 'width 0.5s ease-out' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '16px' }}>Security Audit History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                      {metrics.recentLogs?.map((log) => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                          <div>
                            <p style={{ color: '#f9fafb', fontWeight: '500' }}>{log.action}</p>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>User: {log.user?.firstName} {log.user?.lastName} ({log.user?.role})</span>
                          </div>
                          <span style={{ color: '#6b7280' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Patient/Doctor/Tech Overview */
            <div className="grid-cols-3">
              <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                <h3 style={{ marginBottom: '16px' }}>Upcoming Scheduled Operations</h3>
                {appointments.length === 0 ? (
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af' }}>No upcoming appointments scheduled.</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>{user.role === 'PATIENT' ? 'Doctor' : 'Patient'}</th>
                          <th>Hospital</th>
                          <th>Date / Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a.id}>
                            <td>
                              {user.role === 'PATIENT' 
                                ? `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}`
                                : `${a.patient.user.firstName} ${a.patient.user.lastName}`
                              }
                            </td>
                            <td>{a.hospital.name}</td>
                            <td>{a.date} at {a.slotTime}</td>
                            <td>
                              <span className={`badge ${
                                a.status === 'COMPLETED' ? 'badge-success' : 
                                a.status === 'CONFIRMED' ? 'badge-info' : 'badge-warning'
                              }`}>{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Patient Notifications Panel */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '16px' }}>Notifications & Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.85rem' }}>No new notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.isRead && handleMarkNotifRead(n.id)}
                        className="glass-card" 
                        style={{ 
                          padding: '12px', 
                          background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(59,130,246,0.06)',
                          borderColor: n.isRead ? 'transparent' : 'rgba(59,130,246,0.15)',
                          cursor: n.isRead ? 'default' : 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <p style={{ color: '#fff', fontWeight: n.isRead ? '400' : '500' }}>{n.message}</p>
                        <div className="flex-between" style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span>{n.type}</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. APPOINTMENTS */}
      {currentTab === 'appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {user.role === 'PATIENT' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '20px' }}>Book Appointment Slot</h3>
              <form onSubmit={handleBookAppointment} className="grid-cols-2" style={{ gap: '20px' }}>
                <div>
                  <div className="form-group">
                    <label>Select Hospital</label>
                    <select value={bookHospitalId} onChange={(e) => handleHospitalChange(e.target.value)} required>
                      <option value="">-- Choose Hospital --</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Specialization Doctor</label>
                    <select value={bookDoctorId} onChange={(e) => handleDoctorChange(e.target.value)} required disabled={!bookHospitalId}>
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.user.firstName} {d.user.lastName} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Preferred Date</label>
                      <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className="form-group">
                      <label>Available Slots</label>
                      <select value={bookSlot} onChange={(e) => setBookSlot(e.target.value)} required disabled={doctorSlots.length === 0}>
                        <option value="">-- Time Slot --</option>
                        {doctorSlots.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes / Symptoms</label>
                    <input type="text" placeholder="Describe symptoms or reasons for visit" value={bookNotes} onChange={(e) => setBookNotes(e.target.value)} />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>Book Appointment Slot</button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Appointments Management</h3>
            {appointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Hospital</th>
                      <th>Date / Time</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.patient.user.firstName} {a.patient.user.lastName}</td>
                        <td>Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</td>
                        <td>{a.hospital.name}</td>
                        <td>{a.date} at {a.slotTime}</td>
                        <td>
                          <span className={`badge ${
                            a.status === 'COMPLETED' ? 'badge-success' : 
                            a.status === 'CONFIRMED' ? 'badge-info' : 
                            a.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                          }`}>{a.status}</span>
                        </td>
                        <td>{a.notes || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Patient Actions */}
                            {user.role === 'PATIENT' && a.status === 'CONFIRMED' && (
                              <>
                                <button 
                                  onClick={() => {
                                    setRescheduleApptId(a.id);
                                    setRescheduleDate(a.date);
                                    setRescheduleSlot(a.slotTime);
                                  }}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  Reschedule
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(a.id, 'CANCELLED')}
                                  className="btn btn-danger" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {/* Doctor Actions */}
                            {user.role === 'DOCTOR' && (
                              <>
                                {a.status === 'CONFIRMED' && (
                                  <button 
                                    onClick={() => handleUpdateStatus(a.id, 'CHECKED_IN')}
                                    className="btn btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  >
                                    Check In
                                  </button>
                                )}
                                {a.status === 'CHECKED_IN' && (
                                  <button 
                                    onClick={() => {
                                      setCurrentTab('ehr-create');
                                      setEhrPatientId(a.patientId);
                                    }}
                                    className="btn btn-success" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--gradient-success)', border: 'none', color: '#fff' }}
                                  >
                                    Complete Visit
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MEDICAL RECORDS (EHR) */}
      {currentTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {user.role === 'PATIENT' ? (
            <div className="glass-card">
              <h3 style={{ marginBottom: '20px' }}>Electronic Health Records (EHR)</h3>
              {records.length === 0 ? (
                <p>No past medical records found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {records.map((r) => (
                    <div key={r.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
                      <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ color: '#fff' }}>Diagnosis: {r.diagnosis}</h4>
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            Treated by Dr. {r.doctor.user.firstName} {r.doctor.user.lastName} on {r.visitDate}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: '#3b82f6', fontSize: '0.9rem' }}>Treatment Plan</strong>
                        <p style={{ marginTop: '4px', fontSize: '0.925rem' }}>{r.treatmentPlan}</p>
                      </div>

                      {r.followUpNotes && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Follow Up Notes</strong>
                          <p style={{ marginTop: '4px', fontSize: '0.925rem' }}>{r.followUpNotes}</p>
                        </div>
                      )}

                      {r.prescriptions && r.prescriptions.length > 0 && (
                        <div>
                          <strong style={{ color: '#10b981', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Active Prescriptions</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {r.prescriptions.map(p => (
                              <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div className="flex-between" style={{ marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Rx ID: {p.id}</span>
                                  <span className={`badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                                </div>
                                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                                  {p.items.map(item => (
                                    <li key={item.id} style={{ fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '4px' }}>
                                      💊 <strong>{item.medicineName}</strong> - {item.dosage} | {item.frequency} for {item.duration}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Doctor's Patient Search & Consent Gate */
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px' }}>Access Electronic Health Records</h3>
              <p style={{ marginBottom: '24px' }}>To maintain patient privacy under RBAC, search for a patient below. You can only access their historical EHR if they have granted you consent or if you are their primary treating practitioner.</p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="Filter Patient name..." 
                  value={searchDoctor} 
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>DOB</th>
                      <th>Blood Group</th>
                      <th>Allergies</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records
                      .filter(p => !searchDoctor || `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchDoctor.toLowerCase()))
                      .map(p => (
                        <tr key={p.id}>
                          <td>{p.user.firstName} {p.user.lastName}</td>
                          <td>{p.dateOfBirth}</td>
                          <td>{p.bloodGroup || '-'}</td>
                          <td>{p.allergies || 'None'}</td>
                          <td>
                            <button 
                              onClick={() => handleViewEhr(p.id, `${p.user.firstName} ${p.user.lastName}`)}
                              className="btn btn-primary" 
                              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                            >
                              Request / View EHR
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. EHR CREATE */}
      {currentTab === 'ehr-create' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Log New Consultation & Prescription</h3>
          <form onSubmit={handleCreateEhr} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="grid-cols-2">
              <div>
                <div className="form-group">
                  <label>Select Checked-In Patient</label>
                  <select value={ehrPatientId} onChange={(e) => setEhrPatientId(e.target.value)} required>
                    <option value="">-- Choose Patient --</option>
                    {records.map(p => (
                      <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Diagnosis Summary</label>
                  <textarea rows={4} placeholder="E.g., Acute bronchopneumonia, viral fever" value={ehrDiagnosis} onChange={(e) => setEhrDiagnosis(e.target.value)} required></textarea>
                </div>

                <div className="form-group">
                  <label>Treatment Plan</label>
                  <textarea rows={4} placeholder="E.g., Complete bed rest, plenty of hydration" value={ehrPlan} onChange={(e) => setEhrPlan(e.target.value)} required></textarea>
                </div>

                <div className="form-group">
                  <label>Follow-up Notes (Optional)</label>
                  <input type="text" placeholder="Return for review in 5 days" value={ehrFollowUp} onChange={(e) => setEhrFollowUp(e.target.value)} />
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: '600' }}>Prescribed Medicines (Rx)</label>
                  <button 
                    type="button" 
                    onClick={() => setPrescriptionItems([...prescriptionItems, { medicineName: '', dosage: '', frequency: '', duration: '' }])}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} /> Add Drug
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="glass-card" style={{ padding: '16px', position: 'relative', background: 'rgba(255,255,255,0.01)' }}>
                      {prescriptionItems.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index))}
                          style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label>Medicine Name</label>
                        <input 
                          type="text" 
                          placeholder="Paracetamol / Amoxicillin" 
                          value={item.medicineName} 
                          onChange={(e) => {
                            const newItems = [...prescriptionItems];
                            newItems[index].medicineName = e.target.value;
                            setPrescriptionItems(newItems);
                          }}
                          required 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Dosage</label>
                          <input 
                            type="text" 
                            placeholder="500mg" 
                            value={item.dosage} 
                            onChange={(e) => {
                              const newItems = [...prescriptionItems];
                              newItems[index].dosage = e.target.value;
                              setPrescriptionItems(newItems);
                            }}
                            required 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Frequency</label>
                          <input 
                            type="text" 
                            placeholder="1-0-1 (Twice daily)" 
                            value={item.frequency} 
                            onChange={(e) => {
                              const newItems = [...prescriptionItems];
                              newItems[index].frequency = e.target.value;
                              setPrescriptionItems(newItems);
                            }}
                            required 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Duration</label>
                          <input 
                            type="text" 
                            placeholder="5 days" 
                            value={item.duration} 
                            onChange={(e) => {
                              const newItems = [...prescriptionItems];
                              newItems[index].duration = e.target.value;
                              setPrescriptionItems(newItems);
                            }}
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '14px 40px' }}>Save Record & Dispatch Rx</button>
            </div>
          </form>
        </div>
      )}

      {/* 5. CONSENT */}
      {currentTab === 'consent' && (
        <div className="grid-cols-3">
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px' }}>Grant Access Permission</h3>
            <form onSubmit={handleGrantConsent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Select Authorized Doctor</label>
                <select value={consentDoctorUserId} onChange={(e) => setConsentDoctorUserId(e.target.value)} required>
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.user.id}>
                      Dr. {d.user.firstName} {d.user.lastName} ({d.specialization} - {d.hospital.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Access Duration (Time-Limited)</label>
                <select value={consentDuration} onChange={(e) => setConsentDuration(e.target.value)}>
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Grant Secure Access</button>
            </form>
          </div>

          <div className="glass-card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '16px' }}>Active Access Control Permissions</h3>
            {consentGrants.length === 0 ? (
              <p>No active record access permissions granted.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Authorized Person</th>
                      <th>Access Type</th>
                      <th>Expiration Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentGrants.map((g) => {
                      const isExpired = new Date(g.expiresAt) < new Date();
                      const isRevoked = !!g.revokedAt;
                      return (
                        <tr key={g.id}>
                          <td>{g.targetUser.firstName} {g.targetUser.lastName} ({g.targetUser.role})</td>
                          <td>{g.accessType}</td>
                          <td>{new Date(g.expiresAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              isRevoked ? 'badge-danger' : 
                              isExpired ? 'badge-warning' : 'badge-success'
                            }`}>
                              {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td>
                            {!isRevoked && !isExpired && (
                              <button 
                                onClick={() => handleRevokeConsent(g.id)}
                                className="btn btn-danger" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. REFERRALS */}
      {currentTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {user.role === 'DOCTOR' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '20px' }}>Initiate Inter-Hospital Referral</h3>
              <form onSubmit={handleCreateReferral} className="grid-cols-3" style={{ gap: '20px' }}>
                <div className="form-group">
                  <label>Select Patient</label>
                  <select value={refPatientId} onChange={(e) => setRefPatientId(e.target.value)} required>
                    <option value="">-- Choose Patient --</option>
                    {records.map(p => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Referral Hospital</label>
                  <select value={refHospitalId} onChange={(e) => setRefHospitalId(e.target.value)} required>
                    <option value="">-- Choose Destination --</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason for Referral</label>
                  <input type="text" placeholder="Specialized cardiac surgery, NICU requirement" value={refReason} onChange={(e) => setRefReason(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 3', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px' }}>Send Referral</button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Hospital Referrals Tracker</h3>
            {referrals.length === 0 ? (
              <p>No referrals in system.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Referring Doctor</th>
                      <th>From Hospital</th>
                      <th>To Hospital</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {user.role === 'DOCTOR' && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td>{r.patient.user.firstName} {r.patient.user.lastName}</td>
                        <td>Dr. {r.doctor.user.firstName} {r.doctor.user.lastName}</td>
                        <td>{r.sourceHospital.name}</td>
                        <td>{r.targetHospital.name}</td>
                        <td>{r.reason}</td>
                        <td>
                          <span className={`badge ${
                            r.status === 'COMPLETED' ? 'badge-success' : 
                            r.status === 'ACCEPTED' ? 'badge-info' : 'badge-warning'
                          }`}>{r.status}</span>
                        </td>
                        {user.role === 'DOCTOR' && (
                          <td>
                            {r.status === 'SENT' && r.targetHospitalId === user.doctorId && (
                              <button 
                                onClick={() => handleAcceptReferral(r.id)}
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Accept Referral
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. LABS */}
      {currentTab === 'labs' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Diagnostic Lab Reports</h3>
          {labReports.length === 0 ? (
            <p>No lab reports found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Date Uploaded</th>
                    <th>Status</th>
                    <th>Critical Result</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {labReports.map((r) => (
                    <tr key={r.id} style={r.isCritical ? { background: 'rgba(244, 63, 94, 0.03)' } : {}}>
                      <td>{r.patient.user.firstName} {r.patient.user.lastName}</td>
                      <td>{r.testName}</td>
                      <td>{new Date().toLocaleDateString() /* Mock Upload Time */}</td>
                      <td><span className="badge badge-success">{r.status}</span></td>
                      <td>
                        {r.isCritical ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} className="animate-pulse" /> Critical
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>Normal</span>
                        )}
                      </td>
                      <td>
                        <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'none' }}>
                          <ExternalLink size={14} /> PDF Link
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. LABS UPLOAD */}
      {currentTab === 'labs-upload' && (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px' }}>Upload Test Diagnostic Report</h3>
          <form onSubmit={handleUploadLabReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Select Patient</label>
              <select value={labPatientId} onChange={(e) => setLabPatientId(e.target.value)} required>
                <option value="">-- Choose Patient --</option>
                {records.map(p => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lab Test Name</label>
              <input type="text" placeholder="Complete Blood Count (CBC), Lipid Panel, MRI Brain" value={labTestName} onChange={(e) => setLabTestName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Upload File</label>
              <input 
                type="file" 
                id="file-upload"
                onChange={(e) => setLabFile(e.target.files[0])} 
                required 
                style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              {labFile && <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '8px' }}>Selected: {labFile.name}</p>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
              <input type="checkbox" id="criticalCheck" checked={labIsCritical} onChange={(e) => setLabIsCritical(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
              <label htmlFor="criticalCheck" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: labIsCritical ? '#f43f5e' : '#9ca3af' }}>
                <AlertTriangle size={16} /> Flag as CRITICAL RESULT (triggers instant alert notifications)
              </label>
            </div>

            <button type="submit" className="btn btn-primary">Publish and Link Report</button>
          </form>
        </div>
      )}

      {/* 9. PHARMACY QUEUE */}
      {currentTab === 'pharmacy-queue' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Prescription Dispatch Pipeline</h3>
          {prescriptions.length === 0 ? (
            <p>No prescriptions pending fulfillment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {prescriptions.map((p) => (
                <div key={p.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#fff' }}>Patient: {p.patient.user.firstName} {p.patient.user.lastName}</h4>
                      <p style={{ fontSize: '0.85rem' }}>Doctor: Dr. {p.doctor.user.firstName} {p.doctor.user.lastName} | Phone: {p.patient.user.phone || '-'}</p>
                    </div>
                    <div>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
                    {p.items.map(item => (
                      <li key={item.id} style={{ padding: '4px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>
                        💊 <strong>{item.medicineName}</strong> - {item.dosage} ({item.frequency} for {item.duration})
                      </li>
                    ))}
                  </ul>

                  {p.status !== 'COMPLETED' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {p.status === 'PENDING' && (
                        <button onClick={() => handleFulfillPrescription(p.id, 'DISPATCHED')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Mark Dispatched</button>
                      )}
                      {p.status === 'DISPATCHED' && (
                        <button onClick={() => handleFulfillPrescription(p.id, 'COMPLETED')} className="btn btn-success" style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--gradient-success)', border: 'none', color: '#fff' }}>Mark Completed / Collected</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 10. BEDS */}
      {currentTab === 'beds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {user.role === 'HOSPITAL_ADMIN' && (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '20px' }}>Update Bed Capacities</h3>
              <form onSubmit={handleUpdateBeds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Available General Beds</label>
                    <input type="number" value={bedGeneral} onChange={(e) => setBedGeneral(e.target.value)} required min={0} />
                  </div>
                  <div className="form-group">
                    <label>Available ICU Beds</label>
                    <input type="number" value={bedIcu} onChange={(e) => setBedIcu(e.target.value)} required min={0} />
                  </div>
                  <div className="form-group">
                    <label>Available Emergency Beds</label>
                    <input type="number" value={bedEmergency} onChange={(e) => setBedEmergency(e.target.value)} required min={0} />
                  </div>
                  <div className="form-group">
                    <label>Available NICU Beds</label>
                    <input type="number" value={bedNicu} onChange={(e) => setBedNicu(e.target.value)} required min={0} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Publish Capacity Update</button>
              </form>
            </div>
          )}

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Bed Availability Hospital Grid</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>Address</th>
                    <th>General (Avail/Total)</th>
                    <th>ICU (Avail/Total)</th>
                    <th>Emergency (Avail/Total)</th>
                    <th>NICU (Avail/Total)</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: '600' }}>{h.name}</td>
                      <td>{h.address}</td>
                      <td>{h.availableBeds} / {h.totalBeds}</td>
                      <td>{h.availableIcuBeds} / {h.icuBeds}</td>
                      <td>{h.availableEmergencyBeds} / {h.emergencyBeds}</td>
                      <td>{h.availableNicuBeds} / {h.nicuBeds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. PENDING APPROVALS (HOSPITAL ADMIN) */}
      {currentTab === 'pending-approvals' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Pending Doctor Registrations</h3>
          {pendingDoctors.length === 0 ? (
            <p>No pending doctor registrations.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Email / Phone</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDoctors.map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: '600' }}>Dr. {doc.user.firstName} {doc.user.lastName}</td>
                      <td>{doc.user.email}<br/><span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{doc.user.phone}</span></td>
                      <td>{doc.specialization}</td>
                      <td>{doc.experienceYears} Years</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApproveDoctor(doc.id)} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--gradient-success)', border: 'none', color: '#fff' }}>Approve</button>
                          <button onClick={() => handleRejectDoctor(doc.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--gradient-danger)', border: 'none', color: '#fff' }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* Reschedule Modal */}
      {rescheduleApptId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card fade-in" style={{ width: '400px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3>Reschedule Slot</h3>
              <X size={20} onClick={() => setRescheduleApptId(null)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>New Date</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>New Time Slot</label>
                <select value={rescheduleSlot} onChange={(e) => setRescheduleSlot(e.target.value)} required>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Confirm Reschedule</button>
            </form>
          </div>
        </div>
      )}

      {/* View EHR Modal (Doctor/Consent) */}
      {viewEhrPatientId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card fade-in" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <h3>EHR History: {viewEhrPatientName}</h3>
              <X size={20} onClick={() => { setViewEhrPatientId(null); setRecords([]); }} style={{ cursor: 'pointer' }} />
            </div>

            {records.length === 0 ? (
              <p style={{ padding: '20px 0' }}>No medical history records accessible. Ensure you have patient consent.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {records.map((r) => (
                  <div key={r.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
                    <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <h4>Diagnosis: {r.diagnosis}</h4>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Treated by Dr. {r.doctor.user.firstName} {r.doctor.user.lastName} on {r.visitDate}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#3b82f6', fontSize: '0.9rem' }}>Treatment Plan</strong>
                      <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>{r.treatmentPlan}</p>
                    </div>
                    {r.prescriptions && r.prescriptions.map(p => (
                      <div key={p.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Prescription Items</span>
                        {p.items.map(item => (
                          <div key={item.id} style={{ fontSize: '0.875rem', color: '#e5e7eb' }}>
                            💊 {item.medicineName} - {item.dosage} | {item.frequency} for {item.duration}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardController;
