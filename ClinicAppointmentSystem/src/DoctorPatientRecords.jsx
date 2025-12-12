import { useEffect, useState, useMemo } from "react";

const DoctorPatientRecords = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch appointments and patients data
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // 1. Guard clause: Ensure user data is available
    if (!user || !user.name || !user.role) {
      console.log("Waiting for user data to load or role/name missing.");
      return;
    }

    setLoading(true);

    try {
      // 2. CONSTRUCT FILTERED URL: Request appointments only for this doctor (provider)
      // Note: Switched port from 4000 to 5000 and added filtering query parameters
      const appointmentUrl = `http://localhost:5000/api/appointments?providerName=${encodeURIComponent(
        user.name
      )}&providerRole=${encodeURIComponent(user.role)}`;
      const usersUrl = `http://localhost:5000/api/users`;

      const [apptsRes, usersRes] = await Promise.all([
        fetch(appointmentUrl),
        fetch(usersUrl),
      ]);

      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        // Since the server is expected to filter the appointments now,
        // we set them directly.
        setAppointments(apptsData.appointments || []);
      } else {
        console.error("Failed to fetch appointments:", apptsRes.statusText);
        setAppointments([]);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // Filter only CLIENT (patients)
        setPatients((usersData.users || []).filter((u) => u.role === "CLIENT"));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get appointments for this doctor (This logic is now redundant if server filters correctly,
  // but kept for safety in case the server needs time to implement it fully,
  // or to process the already fetched and filtered list if needed later)
  const doctorAppointments = useMemo(() => {
    // Re-check filtering just in case the backend filtering is not perfect yet,
    // although with the new URL, 'appointments' should already be the doctor's list.
    return appointments.filter(
      (a) => a.providerName === user?.name && a.providerRole === user?.role
    );
  }, [appointments, user]);

  // Get unique patient names and their data
  const patientRecords = useMemo(() => {
    const patientNames = new Set(doctorAppointments.map((a) => a.patientName));

    return Array.from(patientNames).map((patientName) => {
      const patientAppts = doctorAppointments.filter(
        (a) => a.patientName === patientName
      );
      const patientInfo = patients.find((p) => p.name === patientName);

      return {
        name: patientName,
        email: patientInfo?.email || patientAppts[0]?.patientEmail || "N/A",
        phone: patientInfo?.phone || patientAppts[0]?.patientPhone || "N/A",
        totalAppointments: patientAppts.length,
        appointments: patientAppts.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
        approvedCount: patientAppts.filter((a) => a.status === "Approved")
          .length,
        rejectedCount: patientAppts.filter((a) => a.status === "Rejected")
          .length,
        completedCount: patientAppts.filter((a) => a.status === "Completed")
          .length,
        lastVisit: patientAppts[0]?.date || "N/A",
      };
    });
  }, [doctorAppointments, patients]);

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    return patientRecords.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patientRecords, searchTerm]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        Loading patient records...
      </div>
    );
  }

  if (patientRecords.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>👥</div>
        <p style={{ fontSize: "16px", fontWeight: "600" }}>
          No patient records found
        </p>
        <p style={{ fontSize: "13px" }}>You haven't treated any patients yet</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "32px",
              fontWeight: "800",
              color: "#0B4F36",
              margin: "0 0 10px 0",
            }}
          >
            👥 Patient Records
          </h1>
          <p
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "14px",
              color: "#6B7280",
              margin: "0",
            }}
          >
            View and manage all patient records and their appointment history
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "30px" }}>
          <input
            type="text"
            placeholder="🔍 Search by patient name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1.5px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Poppins, sans-serif",
              boxSizing: "border-box",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0B4F36";
              e.target.style.boxShadow = "0 0 0 3px rgba(11, 79, 54, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E5E7EB";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Stats Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#6B7280",
                margin: "0 0 8px 0",
                textTransform: "uppercase",
              }}
            >
              Total Patients
            </p>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0B4F36",
                margin: "0",
              }}
            >
              {patientRecords.length}
            </h3>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#6B7280",
                margin: "0 0 8px 0",
                textTransform: "uppercase",
              }}
            >
              Total Appointments
            </p>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#3b82f6",
                margin: "0",
              }}
            >
              {doctorAppointments.length}
            </h3>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#6B7280",
                margin: "0 0 8px 0",
                textTransform: "uppercase",
              }}
            >
              Completed
            </p>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#22c55e",
                margin: "0",
              }}
            >
              {
                doctorAppointments.filter((a) => a.status === "Completed")
                  .length
              }
            </h3>
          </div>
        </div>

        {/* Patient Records List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredPatients.length === 0 ? (
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
                color: "#6B7280",
              }}
            >
              <p>No patients match your search</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.name}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Patient Header */}
                <button
                  onClick={() =>
                    setExpandedPatient(
                      expandedPatient === patient.name ? null : patient.name
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "24px",
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1F2937",
                        margin: "0 0 8px 0",
                      }}
                    >
                      👤 {patient.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        margin: "0 0 6px 0",
                      }}
                    >
                      📧 {patient.email} • 📱 {patient.phone}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        margin: "0",
                      }}
                    >
                      Total Appointments: {patient.totalAppointments} • Last
                      Visit: {patient.lastVisit}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      marginRight: "20px",
                      minWidth: "200px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#22c55e",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {patient.approvedCount}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6B7280",
                          margin: "0",
                          fontWeight: "600",
                        }}
                      >
                        Approved
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#ef4444",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {patient.rejectedCount}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6B7280",
                          margin: "0",
                          fontWeight: "600",
                        }}
                      >
                        Rejected
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#8b5cf6",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {patient.completedCount}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6B7280",
                          margin: "0",
                          fontWeight: "600",
                        }}
                      >
                        Completed
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "20px",
                      transition: "transform 0.3s ease",
                      transform:
                        expandedPatient === patient.name
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </div>
                </button>

                {/* Patient Details - Expanded */}
                {expandedPatient === patient.name && (
                  <div
                    style={{
                      padding: "24px",
                      borderTop: "1px solid #E5E7EB",
                      background: "#f9fafb",
                    }}
                  >
                    <h4
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#0B4F36",
                        margin: "0 0 16px 0",
                      }}
                    >
                      📋 Appointment History
                    </h4>

                    <div
                      style={{
                        overflowX: "auto",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "13px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background:
                                "linear-gradient(135deg, #0B4F36 0%, #083d2a 100%)",
                              color: "white",
                            }}
                          >
                            <th
                              style={{
                                padding: "12px 14px",
                                textAlign: "left",
                                fontWeight: "700",
                              }}
                            >
                              Date
                            </th>
                            <th
                              style={{
                                padding: "12px 14px",
                                textAlign: "left",
                                fontWeight: "700",
                              }}
                            >
                              Time
                            </th>
                            <th
                              style={{
                                padding: "12px 14px",
                                textAlign: "left",
                                fontWeight: "700",
                              }}
                            >
                              Status
                            </th>
                            <th
                              style={{
                                padding: "12px 14px",
                                textAlign: "left",
                                fontWeight: "700",
                              }}
                            >
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.appointments.map((appt, idx) => (
                            <tr
                              key={appt.id}
                              style={{
                                borderBottom: "1px solid #E5E7EB",
                                background: idx % 2 === 0 ? "white" : "#f9fafb",
                                transition: "background-color 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#f0f4f8";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  idx % 2 === 0 ? "white" : "#f9fafb";
                              }}
                            >
                              <td
                                style={{
                                  padding: "12px 14px",
                                  color: "#1F2937",
                                  fontWeight: "500",
                                }}
                              >
                                📆 {appt.date}
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                  color: "#1F2937",
                                  fontWeight: "500",
                                }}
                              >
                                🕐 {appt.time}
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    backgroundColor:
                                      appt.status === "Approved"
                                        ? "#d1fae5"
                                        : appt.status === "Rejected"
                                        ? "#fee2e2"
                                        : appt.status === "Scheduled"
                                        ? "#dbeafe"
                                        : appt.status === "Completed"
                                        ? "#d1fae5"
                                        : "#f3f4f6",
                                    color:
                                      appt.status === "Approved"
                                        ? "#065f46"
                                        : appt.status === "Rejected"
                                        ? "#7f1d1d"
                                        : appt.status === "Scheduled"
                                        ? "#0c4a6e"
                                        : appt.status === "Completed"
                                        ? "#065f46"
                                        : "#6b7280",
                                  }}
                                >
                                  {appt.status === "Approved" && "✅"}
                                  {appt.status === "Rejected" && "❌"}
                                  {appt.status === "Scheduled" && "⏳"}
                                  {appt.status === "Completed" && "✔️"}
                                  {appt.status === "Cancelled" && "🚫"}{" "}
                                  {appt.status}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                  color: "#6B7280",
                                  fontSize: "12px",
                                }}
                              >
                                {appt.notes || "No notes"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientRecords;
