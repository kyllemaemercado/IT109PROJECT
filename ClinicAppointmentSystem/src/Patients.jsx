import { useEffect, useState } from 'react';

const Patients = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setPatients(data.users.filter(u => u.role === 'CLIENT'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/appointments');
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments);
    } catch (err) {
      console.error(err);
    }
  };

  const getAppointments = (patientName) => {
    return appointments.filter(a => a.patientName === patientName);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0, marginBottom: '8px' }}>
          Patients Management
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
          View and manage all patient records and their appointments
        </p>
      </div>

      {/* Patients List - 2 Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {patients.length === 0 ? (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>No patients registered yet</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>Patients who sign up will appear here</div>
          </div>
        ) : (
          patients.map(p => {
            const patientAppts = getAppointments(p.name);
            const approvedCount = patientAppts.filter(a => a.status === 'Approved').length;
            const rejectedCount = patientAppts.filter(a => a.status === 'Rejected').length;
            const scheduledCount = patientAppts.filter(a => a.status === 'Scheduled').length;

            return (
              <div
                key={p.username}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Patient Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', marginBottom: '4px' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                      👤 {p.username} • 📧 {p.email}
                    </div>
                    {p.phone && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        📱 {p.phone}
                      </div>
                    )}
                  </div>

                  {/* Appointment Stats */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: '#F0F9FF', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#0369A1' }}>{patientAppts.length}</div>
                      <div style={{ fontSize: '11px', color: '#0C4A6E', fontWeight: '600' }}>Total</div>
                    </div>
                    <div style={{ background: '#DCFCE7', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534' }}>{approvedCount}</div>
                      <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '600' }}>Approved</div>
                    </div>
                    <div style={{ background: '#FFE4E6', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#9F1239' }}>{rejectedCount}</div>
                      <div style={{ fontSize: '11px', color: '#BE185D', fontWeight: '600' }}>Rejected</div>
                    </div>
                  </div>
                </div>

                {/* Appointments Section */}
                {patientAppts.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ fontWeight: '600', color: '#0B4F36', fontSize: '14px', userSelect: 'none' }}>
                        📅 View {patientAppts.length} Appointment{patientAppts.length !== 1 ? 's' : ''} ({scheduledCount} Scheduled)
                      </summary>

                      <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
                        {patientAppts.map((a, idx) => (
                          <div
                            key={a.id}
                            style={{
                              background: '#F9FAFB',
                              padding: '12px',
                              borderRadius: '8px',
                              borderLeft: '3px solid #0B4F36',
                              fontSize: '13px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                                  {a.providerName} ({a.providerRole})
                                </div>
                                <div style={{ color: '#6B7280', fontSize: '12px' }}>
                                  📆 {a.date} • 🕐 {a.time}
                                </div>
                              </div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor:
                                    a.status === 'Approved'
                                      ? '#DCFCE7'
                                      : a.status === 'Rejected'
                                      ? '#FFE4E6'
                                      : a.status === 'Scheduled'
                                      ? '#F0F9FF'
                                      : a.status === 'Cancelled'
                                      ? '#F3F4F6'
                                      : '#FFFFFF',
                                  color:
                                    a.status === 'Approved'
                                      ? '#166534'
                                      : a.status === 'Rejected'
                                      ? '#9F1239'
                                      : a.status === 'Scheduled'
                                      ? '#0369A1'
                                      : a.status === 'Cancelled'
                                      ? '#6B7280'
                                      : '#4B5563',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {a.status}
                              </span>
                            </div>
                            {a.notes && (
                              <div style={{ marginTop: '6px', color: '#6B7280', fontSize: '12px', fontStyle: 'italic' }}>
                                📝 {a.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Patients;
