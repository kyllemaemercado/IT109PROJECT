import { useMemo, useEffect, useState } from "react";
import { FaNotesMedical } from "react-icons/fa"; // clinic icon

const Dashboard = ({ batches, setBatches, user, appointments, setAppointments, onUpdateAppointment, onDeleteAppointment, onOpenRejectModal, onApproveAppointment, onCancelAppointment }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    totalApproved,
    totalRejected,
    totalStudents,
    processedBatches,
    overallRate,
  } = useMemo(() => {
    const totalApproved = batches.reduce((sum, b) => sum + b.approved, 0);
    const totalRejected = batches.reduce((sum, b) => sum + b.rejected, 0);
    const totalStudents = batches.reduce((sum, b) => sum + b.total, 0);

    const overallRate =
      totalStudents === 0
        ? "0%"
        : ((totalApproved / totalStudents) * 100).toFixed(1) + "%";

    const processedBatches = batches.map((b) => {
      const rate =
        b.total === 0 ? "0%" : ((b.approved / b.total) * 100).toFixed(1) + "%";
      return { ...b, rate };
    });

    return {
      totalApproved,
      totalRejected,
      totalStudents,
      processedBatches,
      overallRate,
    };
  }, [batches]);

  // appointments by role
  const myAppointments = useMemo(() => {
    if (!user || !appointments) return [];
    if (user.role === "CLIENT") {
      return appointments.filter((a) => a.patientName === user.name);
    }
    if (user.role === "DENTIST") {
      return appointments.filter((a) => a.providerRole === "DENTIST");
    }
    if (user.role === "PHYSICIAN") {
      return appointments.filter((a) => a.providerRole === "PHYSICIAN");
    }
    return [];
  }, [user, appointments]);

  // Admin aggregated stats from appointments
  const adminAppointmentStats = useMemo(() => {
    const totalAppts = appointments?.length ?? 0;
    const approved = (appointments || []).filter(a => a.status === 'Approved').length;
    const rejected = (appointments || []).filter(a => a.status === 'Rejected').length;
    const approvalRate = totalAppts === 0 ? '0%' : ((approved / totalAppts) * 100).toFixed(1) + '%';
    return { totalAppts, approved, rejected, approvalRate };
  }, [appointments]);

  // fetch all records for admins (appointments & users)
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || user.role !== "ADMIN") return;
      setLoading(true);
      setError(null);
      try {
        const [apptsRes, usersRes] = await Promise.all([
          fetch("http://localhost:4000/api/appointments"),
          fetch("http://localhost:4000/api/users"),
        ]);
        if (!apptsRes.ok) throw new Error("Failed to fetch appointments");
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const apptsData = await apptsRes.json();
        const usersData = await usersRes.json();
        // Update parent appointment state if setter exists
        if (typeof setAppointments === "function") setAppointments(apptsData.appointments || []);
        setAllUsers(usersData.users || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Fetch error");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user, setAppointments]);

  const handleDeleteAppointment = async (id) => {
    if (!id || !confirm("Delete this appointment?")) return;
    try {
      if (typeof onDeleteAppointment === 'function') {
        await onDeleteAppointment(id);
      } else {
        const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete appointment');
        if (typeof setAppointments === 'function') setAppointments((prev) => (prev || []).filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete appointment');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!id || !confirm("Cancel this appointment?")) return;
    try {
      if (typeof onCancelAppointment === 'function') {
        await onCancelAppointment(id);
      } else {
        const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Cancelled' }) });
        if (!res.ok) throw new Error('Failed to cancel appointment');
        const data = await res.json();
        if (typeof setAppointments === 'function') setAppointments((prev) => (prev || []).map((a) => (a.id === id ? data.appointment : a)));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment');
    }
  };

  const handleUpdateAppointment = async (id, updates) => {
    if (!id) return;
    try {
      if (typeof onUpdateAppointment === 'function') {
        await onUpdateAppointment(id, updates);
      } else {
        const res = await fetch(`http://localhost:4000/api/appointments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update appointment');
        const data = await res.json();
        if (typeof setAppointments === 'function') setAppointments((prev) => (prev || []).map((a) => (a.id === id ? data.appointment : a)));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update appointment');
    }
  };

  const handleApprove = (id) => {
    if (!confirm('Approve this appointment?')) return;
    if (typeof onApproveAppointment === 'function') return onApproveAppointment(id);
    return handleUpdateAppointment(id, { status: 'Approved' });
  };

  const handleReject = (id) => {
    if (typeof onOpenRejectModal === 'function') return onOpenRejectModal(id);
    if (!confirm('Reject this appointment?')) return;
    return handleUpdateAppointment(id, { status: 'Rejected' });
  };

  const handleRemoveBatch = (index) => {
    const updated = [...batches];
    updated.splice(index, 1);
    setBatches(updated);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* HEADER WITH ICON */}
      <header
        style={{
          height: "70px",
          backgroundColor: "#0B4F36",
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: "0 25px",
          fontWeight: "bold",
          fontSize: "22px",
          borderRadius: "0 0 20px 20px", // smooth bottom edge
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <FaNotesMedical size={40} style={{ marginRight: "15px" }} />
        CSU Clinic Appointment System
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "25px",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Header: show clinic-specific for role */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "15px",
            color: "#1F2937",
          }}
        >
          {user?.role === 'CLIENT' ? 'Client Dashboard' : user?.role === 'DENTIST' ? 'Dentist Dashboard' : user?.role === 'PHYSICIAN' ? 'Physician Dashboard' : 'Dashboard'}
        </h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <FaNotesMedical size={26} color="#0B4F36" />
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {user?.name ?? 'User'} • {user?.role}
            </div>
          </div>
        </div>

        {/* STATISTICS CARDS */}
        {loading && (
          <div style={{ padding: '8px 12px', background: '#E8F6EA', borderRadius: 8, color: '#0B6F3A', marginBottom: 12 }}>
            Loading admin records...
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 12px', background: '#FFEFEF', borderRadius: 8, color: '#9B1A1A', marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: user?.role === 'CLIENT' ? "repeat(4, 1fr)" : user?.role === 'ADMIN' ? "repeat(5, 1fr)" : "repeat(5, 1fr)",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          {user?.role === 'CLIENT' ? (
            [
              { title: 'Total Appointments', value: myAppointments.length },
              { title: 'Upcoming', value: myAppointments.filter(a => a.status === 'Scheduled').length },
              { title: 'Past', value: myAppointments.filter(a => a.status === 'Completed').length },
              { title: 'Cancelled', value: myAppointments.filter(a => a.status === 'Cancelled').length },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '5px', fontWeight: 600 }}>{item.title}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{item.value}</p>
              </div>
            ))
          ) : (user?.role === 'DENTIST' || user?.role === 'PHYSICIAN') ? (
            [
              { title: 'Total Appointments', value: myAppointments.length },
              { title: 'Scheduled', value: myAppointments.filter(a => a.status === 'Scheduled').length },
              { title: 'Completed', value: myAppointments.filter(a => a.status === 'Completed').length },
              { title: 'Cancelled', value: myAppointments.filter(a => a.status === 'Cancelled').length },
            ].map((item, index) => (
              <div key={index} style={{ background: 'white', borderRadius: '20px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '5px', fontWeight: 600 }}>{item.title}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{item.value}</p>
              </div>
            ))
          ) : (
            [
              { title: 'Total Appointments', value: adminAppointmentStats.totalAppts ?? 0 },
              { title: 'Total Users', value: allUsers.length },
              { title: 'Approved', value: adminAppointmentStats.approved },
              { title: 'Rejected', value: adminAppointmentStats.rejected },
              { title: 'Approval Rate', value: adminAppointmentStats.approvalRate },
            ].map((item, index) => (
            <div
              key={index}
              style={{
                background:
                  index === 2
                    ? "#D4F7D0"
                    : index === 3
                    ? "#FFD5D5"
                    : index === 4
                    ? "#FCECB2"
                    : "white",
                borderRadius: "20px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#4B5563",
                  marginBottom: "5px",
                  fontWeight: "600",
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                {item.value}
              </p>
            </div>
            ))
          )}
        </div>

        {/* BATCH TABLE CARD */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "20px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "15px",
              color: "#1F2937",
            }}
          >
            {user?.role === 'CLIENT' ? 'My Appointments' : 'Schedule & Records'}
          </h2>

          {user?.role === 'CLIENT' ? (
            <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              {user?.role === 'CLIENT' ? (
                <tr style={{ backgroundColor: "#F0B400", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Appointment</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Provider</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                </tr>
              ) : user?.role === 'ADMIN' ? (
                <tr style={{ backgroundColor: "#F0B400", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Patient</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Provider</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                </tr>
              ) : (user?.role === 'DENTIST' || user?.role === 'PHYSICIAN') ? (
                // PROVIDER VIEW: show their appointments and action buttons to Approve or Reject
                myAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>
                      No appointments assigned yet.
                    </td>
                  </tr>
                ) : (
                  myAppointments.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{a.patientName}</td>
                      <td style={{ padding: "12px" }}>{a.patientEmail}<br />{a.patientPhone}</td>
                      <td style={{ padding: "12px" }}>{a.providerName} ({a.providerRole})</td>
                      <td style={{ padding: "12px" }}>{a.date}</td>
                      <td style={{ padding: "12px" }}>{a.time}</td>
                      <td style={{ padding: "12px" }}>{a.status}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ background: '#0B4F36', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }} onClick={() => handleApprove(a.id)}>Approve</button>
                          <button style={{ background: '#E63946', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }} onClick={() => handleReject(a.id)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : user?.role === 'DENTIST' || user?.role === 'PHYSICIAN' ? (
                <tr style={{ backgroundColor: "#F0B400", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Patient</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Contact</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Provider</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                </tr>
              ) : (
                <tr style={{ backgroundColor: "#F0B400", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Batch</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Total</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Approved</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Rejected</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Rate</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                </tr>
              )}
            </thead>

            <tbody>
              {user?.role === 'CLIENT' ? (
                myAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>
                      No appointments scheduled yet.
                    </td>
                  </tr>
                ) : (
                  myAppointments.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{a.patientName}</td>
                      <td style={{ padding: "12px" }}>{a.providerName} ({a.providerRole})</td>
                      <td style={{ padding: "12px" }}>{a.date}</td>
                      <td style={{ padding: "12px" }}>{a.time}</td>
                      <td style={{ padding: "12px" }}>{a.status}</td>
                      <td style={{ padding: "12px" }}>
                        {user?.role === 'CLIENT' && a.patientName === user.name ? (
                          <button onClick={() => handleCancelAppointment(a.id)} style={{ backgroundColor: '#E63946', color: 'white', padding: '6px 12px', borderRadius: 8, border: 'none', fontWeight: 600 }}>Cancel</button>
                        ) : (
                          <button style={{ backgroundColor: '#0B4F36', color: 'white', padding: '6px 12px', borderRadius: 8, border: 'none', fontWeight: 600 }}>View</button>
                        )}
                      </td>
                    </tr>
                  ))
                )
              ) : user?.role === 'ADMIN' ? (
                // ADMIN: show all appointments fetched from server
                appointments?.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: "20px", textAlign: "center" }}>
                      No appointment records yet.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{a.id}</td>
                      <td style={{ padding: "12px" }}>{a.patientName}</td>
                      <td style={{ padding: "12px" }}>{a.patientEmail}</td>
                      <td style={{ padding: "12px" }}>{a.patientPhone}</td>
                      <td style={{ padding: "12px" }}>{a.providerName} ({a.providerRole})</td>
                      <td style={{ padding: "12px" }}>{a.date}</td>
                      <td style={{ padding: "12px" }}>{a.time}</td>
                      <td style={{ padding: "12px" }}>{a.status}</td>
                      <td style={{ padding: "12px" }}>
                        <button onClick={() => handleDeleteAppointment(a.id)} style={{ backgroundColor: "#E63946", color: "white", border: "none", padding: "6px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // provider or admin view uses processedBatches table as before
                processedBatches.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: "20px", textAlign: "center" }}>
                      No batches yet. Filter students to create a batch.
                    </td>
                  </tr>
                ) : (
                  processedBatches.map((batch, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: "600" }}>{batch.name}</td>
                      <td style={{ padding: "12px" }}>{batch.total}</td>
                      <td style={{ padding: "12px", color: "#0B7D2A" }}>{batch.approved}</td>
                      <td style={{ padding: "12px", color: "#E63946" }}>{batch.rejected}</td>
                      <td style={{ padding: "12px", color: "#D97706" }}>{batch.rate}</td>
                      <td style={{ padding: "12px" }}>{batch.status}</td>
                      <td style={{ padding: "12px", color: "#6B7280" }}>{batch.date} {batch.time || ""}</td>
                      <td style={{ padding: "12px" }}>
                        <button onClick={() => handleRemoveBatch(idx)} style={{ backgroundColor: "#E63946", color: "white", border: "none", padding: "6px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>Remove</button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
