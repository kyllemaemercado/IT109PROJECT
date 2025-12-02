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
    <div style={{ padding: 24 }}>
      <h2>Appointments</h2>
      <div style={{ marginTop: 12 }}>
        {myAppointments.length === 0 ? (
          <div>No appointments found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: '#F0B400', color: 'white' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Patient</th>
                {user.role !== 'CLIENT' && <th style={{ padding: 12, textAlign: 'left' }}>Contact</th>}
                <th style={{ padding: 12, textAlign: 'left' }}>Provider</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Time</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {myAppointments.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: 12 }}>{a.patientName}</td>
                  {user.role !== 'CLIENT' && <td style={{ padding: 12 }}>{a.patientEmail}<br />{a.patientPhone}</td>}
                  <td style={{ padding: 12 }}>{a.providerName} ({a.providerRole})</td>
                  <td style={{ padding: 12 }}>{a.date}</td>
                  <td style={{ padding: 12 }}>{a.time}</td>
                  <td style={{ padding: 12 }}>{a.status}</td>
                  <td style={{ padding: 12 }}>
                    {a.status !== 'Cancelled' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* Patient can cancel their own appointment */}
                        {user.role === 'CLIENT' && a.patientName === user.name && (
                          <button style={{ background: '#E63946', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }} onClick={() => cancelAppointment(a.id)}>Cancel</button>
                        )}

                        {/* Providers can only Approve or Reject */}
                        {(user.role === 'DENTIST' || user.role === 'PHYSICIAN') && a.providerRole === user.role && a.providerName === user.name && (
                          <>
                            <button style={{ background: '#0B4F36', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }} onClick={() => handleApprove(a.id)}>Approve</button>
                            <button style={{ background: '#E63946', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }} onClick={() => handleReject(a.id)}>Reject</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
