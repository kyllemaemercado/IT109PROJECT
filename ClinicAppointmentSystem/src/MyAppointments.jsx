import React, { useState, useEffect } from 'react';

const MyAppointments = ({ user, appointments, setAppointments, onUpdateAppointment, onDeleteAppointment, onOpenRejectModal, onApproveAppointment, onCancelAppointment }) => {
  // If appointments are not passed, we will fetch them ourselves
  const [loading, setLoading] = useState(false);
  const [localAppts, setLocalAppts] = useState(appointments || []);

  useEffect(() => {
    if (!appointments) fetchMyAppointments();
    else setLocalAppts(appointments);
  }, [appointments, user]);

  const fetchMyAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('role', user.role);
      if (user.role === 'CLIENT') q.set('name', user.name);
      const res = await fetch(`http://localhost:4000/api/appointments?${q.toString()}`);
      if (!res.ok) return alert('Failed to fetch appointments');
      const data = await res.json();
      setLocalAppts(data.appointments);
      if (setAppointments) setAppointments(data.appointments);
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
    setLoading(false);
  };

  const myAppointments = (localAppts || []).filter((a) => {
    if (!user) return false;
    if (user.role === "CLIENT") return a.patientName === user.name;
    if (user.role === "DENTIST") return a.providerRole === "DENTIST";
    if (user.role === "PHYSICIAN") return a.providerRole === "PHYSICIAN";
    return false;
  });

  const cancelAppointment = async (id) => {
    try {
      if (typeof onCancelAppointment === 'function') {
        await onCancelAppointment(id);
      } else {
        const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Cancelled' }) });
        if (!res.ok) return alert('Failed to cancel');
        const data = await res.json();
        const updated = (localAppts || []).map((a) => (a.id === id ? data.appointment : a));
        setLocalAppts(updated);
        if (setAppointments) setAppointments(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
  };

  const updateAppointment = async (id, updates) => {
    try {
      if (typeof onUpdateAppointment === 'function') {
        await onUpdateAppointment(id, updates);
      } else {
        const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
        if (!res.ok) return alert('Failed to update');
        const data = await res.json();
        const updated = (localAppts || []).map((a) => (a.id === id ? data.appointment : a));
        setLocalAppts(updated);
        if (setAppointments) setAppointments(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
  };

  const handleComplete = (id) => updateAppointment(id, { status: 'Completed' });
  const handleConfirm = (id) => updateAppointment(id, { status: 'Confirmed' });
  const handleApprove = (id) => {
    if (typeof onApproveAppointment === 'function') return onApproveAppointment(id);
    return updateAppointment(id, { status: 'Approved' });
  };
  const handleReject = (id) => {
    if (typeof onOpenRejectModal === 'function') return onOpenRejectModal(id);
    return updateAppointment(id, { status: 'Rejected' });
  };
  const handleReschedule = (id) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    if (newDate && newTime) updateAppointment(id, { date: newDate, time: newTime });
  };
  const handleAddNote = (id) => {
    const note = prompt('Add note for appointment:');
    if (note !== null) updateAppointment(id, { notes: note });
  };

  return (
    <div style={{ 
      padding: '40px',
      background: '#f9fafb',
      minHeight: '100vh',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header Section */}
        <div style={{
          marginBottom: '40px',
        }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '32px',
            fontWeight: '800',
            color: '#0B4F36',
            margin: '0 0 10px 0',
          }}>📅 My Appointments</h1>
          
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            color: '#6B7280',
            margin: '0',
          }}>Manage and track your appointments</p>
        </div>

        {/* Content */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
        }}>
          {myAppointments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
              }}>📭</div>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                color: '#6B7280',
                margin: '0',
              }}>No appointments found.</p>
            </div>
          ) : (
            <div style={{
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontFamily: 'Poppins, sans-serif',
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #F0B400 0%, #E8A600 100%)',
                    color: 'white' 
                  }}>
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Patient</th>
                    {user.role !== 'CLIENT' && (
                      <th style={{ 
                        padding: '16px 14px', 
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '700',
                        letterSpacing: '0.3px',
                      }}>Contact</th>
                    )}
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Provider</th>
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Date</th>
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Time</th>
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Status</th>
                    <th style={{ 
                      padding: '16px 14px', 
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myAppointments.map((a, index) => (
                    <tr 
                      key={a.id} 
                      style={{ 
                        borderBottom: '1px solid #E5E7EB',
                        background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f4f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                      }}
                    >
                      <td style={{ 
                        padding: '16px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1F2937',
                      }}>
                        👤 {a.patientName}
                      </td>
                      {user.role !== 'CLIENT' && (
                        <td style={{ 
                          padding: '16px 14px',
                          fontSize: '13px',
                          color: '#6B7280',
                        }}>
                          <div>📧 {a.patientEmail}</div>
                          <div>📱 {a.patientPhone}</div>
                        </td>
                      )}
                      <td style={{ 
                        padding: '16px 14px',
                        fontSize: '14px',
                        color: '#1F2937',
                      }}>
                        {a.providerRole === 'DENTIST' ? '🦷' : '⚕️'} {a.providerName} <br/>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({a.providerRole})</span>
                      </td>
                      <td style={{ 
                        padding: '16px 14px',
                        fontSize: '14px',
                        color: '#1F2937',
                        fontWeight: '500',
                      }}>
                        📆 {a.date}
                      </td>
                      <td style={{ 
                        padding: '16px 14px',
                        fontSize: '14px',
                        color: '#1F2937',
                        fontWeight: '500',
                      }}>
                        🕐 {a.time}
                      </td>
                      <td style={{ 
                        padding: '16px 14px',
                        fontSize: '13px',
                        fontWeight: '700',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 
                            a.status === 'Approved' ? '#d1fae5' :
                            a.status === 'Rejected' ? '#fee2e2' :
                            a.status === 'Scheduled' ? '#dbeafe' :
                            a.status === 'Cancelled' ? '#f3f4f6' :
                            a.status === 'Confirmed' ? '#fef08a' :
                            a.status === 'Completed' ? '#d1fae5' :
                            '#f3f4f6',
                          color: 
                            a.status === 'Approved' ? '#065f46' :
                            a.status === 'Rejected' ? '#7f1d1d' :
                            a.status === 'Scheduled' ? '#0c4a6e' :
                            a.status === 'Cancelled' ? '#6b7280' :
                            a.status === 'Confirmed' ? '#854d0e' :
                            a.status === 'Completed' ? '#065f46' :
                            '#6b7280',
                        }}>
                          {a.status === 'Approved' && '✅'} 
                          {a.status === 'Rejected' && '❌'} 
                          {a.status === 'Scheduled' && '⏳'} 
                          {a.status === 'Cancelled' && '🚫'} 
                          {a.status === 'Confirmed' && '☑️'} 
                          {a.status === 'Completed' && '✔️'} 
                          {' '}{a.status}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px 14px',
                      }}>
                        {a.status !== 'Cancelled' && (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {/* Patient can cancel their own appointment */}
                            {user.role === 'CLIENT' && a.patientName === user.name && (
                              <button 
                                style={{ 
                                  background: '#EF4444', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '8px 14px', 
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  fontFamily: 'Poppins, sans-serif',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onClick={() => cancelAppointment(a.id)}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#DC2626';
                                  e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#EF4444';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                ❌ Cancel
                              </button>
                            )}

                            {/* Providers can only Approve or Reject */}
                            {(user.role === 'DENTIST' || user.role === 'PHYSICIAN') && a.providerRole === user.role && a.providerName === user.name && (
                              <>
                                <button 
                                  style={{ 
                                    background: '#0B4F36', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '8px 14px', 
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    fontFamily: 'Poppins, sans-serif',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onClick={() => handleApprove(a.id)}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#083d2a';
                                    e.target.style.boxShadow = '0 2px 8px rgba(11, 79, 54, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = '#0B4F36';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  ✅ Approve
                                </button>
                                <button 
                                  style={{ 
                                    background: '#EF4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '8px 14px', 
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    fontFamily: 'Poppins, sans-serif',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onClick={() => handleReject(a.id)}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#DC2626';
                                    e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = '#EF4444';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
