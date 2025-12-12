import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const AdminDataAnalysis = () => {
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch appointments data
    fetch("http://localhost:5000/api/appointments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch appointments");
        return res.json();
      })
      .then((data) => {
        const appointments = data.appointments || [];

        // Count statuses
        const approved = appointments.filter(
          (a) => a.status === "Approved"
        ).length;
        const rejected = appointments.filter(
          (a) => a.status === "Rejected"
        ).length;
        const scheduled = appointments.filter(
          (a) => a.status === "Scheduled"
        ).length;

        setApprovedCount(approved);
        setRejectedCount(rejected);
        setScheduledCount(scheduled);
        setAppointmentsList(appointments);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const chartData = [
    { name: "Approved", value: approvedCount },
    { name: "Rejected", value: rejectedCount },
    { name: "Scheduled", value: scheduledCount },
  ];

  const statusByProviderData = appointmentsList.reduce((acc, appt) => {
    const existing = acc.find((item) => item.name === appt.providerRole);
    if (existing) {
      if (appt.status === "Approved")
        existing.approved = (existing.approved || 0) + 1;
      if (appt.status === "Rejected")
        existing.rejected = (existing.rejected || 0) + 1;
    } else {
      acc.push({
        name: appt.providerRole,
        approved: appt.status === "Approved" ? 1 : 0,
        rejected: appt.status === "Rejected" ? 1 : 0,
      });
    }
    return acc;
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Poppins, sans-serif" }}>
      <h2
        style={{
          fontWeight: 700,
          marginBottom: 24,
          fontSize: "24px",
          color: "#1F2937",
        }}
      >
        Admin Data Analysis
      </h2>

      {error && (
        <div
          style={{
            background: "#fee",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            color: "#c00",
            fontFamily: "Poppins, sans-serif",
            fontSize: "14px",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div
        style={{ display: "flex", gap: 15, marginBottom: 25, flexWrap: "wrap" }}
      >
        <div style={{ ...cardStyle, padding: 15, minWidth: 180 }}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              margin: 0,
              marginBottom: "6px",
            }}
          >
            Total Approved Appointments
          </h4>
          {loading ? (
            <p style={{ margin: 0, fontSize: "12px" }}>Loading...</p>
          ) : (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#22c55e",
                margin: 0,
              }}
            >
              {approvedCount}
            </h1>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 15, minWidth: 180 }}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              margin: 0,
              marginBottom: "6px",
            }}
          >
            Total Rejected Appointments
          </h4>
          {loading ? (
            <p style={{ margin: 0, fontSize: "12px" }}>Loading...</p>
          ) : (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#ef4444",
                margin: 0,
              }}
            >
              {rejectedCount}
            </h1>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 15, minWidth: 180 }}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              margin: 0,
              marginBottom: "6px",
            }}
          >
            Total Scheduled Appointments
          </h4>
          {loading ? (
            <p style={{ margin: 0, fontSize: "12px" }}>Loading...</p>
          ) : (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#3b82f6",
                margin: 0,
              }}
            >
              {scheduledCount}
            </h1>
          )}
        </div>
      </div>

      {!loading && (
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "20px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 30,
              marginBottom: 30,
            }}
          >
            {/* BAR CHART - Overall Status */}
            <div style={{ ...chartCard, boxShadow: "none", marginBottom: 0 }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: "16px",
                  margin: 0,
                }}
              >
                Appointment Status Overview (Bar Chart)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PIE CHART - Status Distribution */}
            <div style={{ ...chartCard, boxShadow: "none", marginBottom: 0 }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: "16px",
                  margin: 0,
                }}
              >
                Appointment Status Distribution (Pie Chart)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" outerRadius={90} label>
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={["#22c55e", "#ef4444", "#3b82f6"][index]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* STACKED BAR CHART - By Provider */}
          {statusByProviderData.length > 0 && (
            <div style={{ ...chartCard, boxShadow: "none", marginBottom: 0 }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: "16px",
                  margin: 0,
                }}
              >
                Appointments by Provider Type (Approved vs Rejected)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusByProviderData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Appointments Table */}
      {!loading && appointmentsList.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 16,
              margin: 0,
            }}
          >
            Recent Appointments
          </h3>
          <div
            className="appointments-ticker"
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "400px",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              scrollBehavior: "smooth",
            }}
          >
            <table style={tableStyle}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Patient Name
                  </th>
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Provider
                  </th>
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                      padding: "12px 16px",
                    }}
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointmentsList.slice(0, 10).map((appt, idx) => (
                  <tr
                    key={appt.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        idx % 2 === 0 ? "#ffffff" : "#f9fafb")
                    }
                  >
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "500",
                        padding: "12px 16px",
                      }}
                    >
                      {appt.patientName}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "500",
                        padding: "12px 16px",
                      }}
                    >
                      {appt.providerName}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "500",
                        padding: "12px 16px",
                      }}
                    >
                      {appt.date}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "500",
                        padding: "12px 16px",
                      }}
                    >
                      {appt.time}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor:
                            appt.status === "Approved"
                              ? "#dcfce7"
                              : appt.status === "Rejected"
                              ? "#fee2e2"
                              : "#dbeafe",
                          color:
                            appt.status === "Approved"
                              ? "#166534"
                              : appt.status === "Rejected"
                              ? "#991b1b"
                              : "#1e40af",
                        }}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "500",
                        padding: "12px 16px",
                      }}
                    >
                      {appt.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ✅ STYLES */
const cardStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  minWidth: 240,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  textAlign: "center",
  fontFamily: "Poppins, sans-serif",
};

const chartCard = {
  background: "#fff",
  padding: 24,
  borderRadius: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontFamily: "Poppins, sans-serif",
  marginBottom: 30,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  padding: 16,
  fontFamily: "Poppins, sans-serif",
};

Object.assign(tableStyle, {
  "thead th": {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: 600,
    color: "#374151",
    fontFamily: "Poppins, sans-serif",
  },
  "tbody td": {
    padding: "12px 16px",
    color: "#4b5563",
    fontFamily: "Poppins, sans-serif",
  },
});

// Add ticker/scroller styles
const tickerStyles = `
  .appointments-ticker {
    position: relative;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 400px;
  }

  .appointments-ticker::-webkit-scrollbar {
    width: 8px;
  }

  .appointments-ticker::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .appointments-ticker::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #0B4F36, #083d2a);
    border-radius: 10px;
    transition: background 0.3s ease;
  }

  .appointments-ticker::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #083d2a, #062e22);
  }

  .appointments-ticker table {
    animation: subtle-slide 0.3s ease-in-out;
  }

  @keyframes subtle-slide {
    from {
      opacity: 0.95;
    }
    to {
      opacity: 1;
    }
  }

  .appointments-ticker tbody tr:hover {
    background-color: #f0f4f8 !important;
    transition: background-color 0.2s ease;
  }
`;

// Inject ticker styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = tickerStyles;
  if (!document.head.querySelector("style[data-ticker]")) {
    styleSheet.setAttribute("data-ticker", "true");
    document.head.appendChild(styleSheet);
  }
}

export default AdminDataAnalysis;
