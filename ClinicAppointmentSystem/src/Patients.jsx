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
    <div style={{ padding: 24 }}>
      <h2>Patients</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {patients.length === 0 ? (
          <div>No patients yet.</div>
        ) : (
          patients.map(p => (
            <div key={p.username} style={{ background: 'white', padding: 16, borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Username: {p.username}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{getAppointments(p.name).length}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Appointments</div>
                </div>
              </div>
              {getAppointments(p.name).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <details>
                    <summary style={{ cursor: 'pointer' }}>View Appointments</summary>
                    <ul>
                      {getAppointments(p.name).map(a => (
                        <li key={a.id}>{a.date} {a.time} with {a.providerName} ({a.providerRole}) • {a.status}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Patients;
