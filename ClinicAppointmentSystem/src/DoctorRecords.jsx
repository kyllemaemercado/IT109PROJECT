import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const DoctorRecords = ({ user }) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, apptsRes] = await Promise.all([
        fetch("http://localhost:5000/api/users"),
        fetch("http://localhost:5000/api/appointments"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        // Filter for doctors (DENTIST and PHYSICIAN)
        const doctorsList = (usersData.users || []).filter(
          (u) => u.role === "DENTIST" || u.role === "PHYSICIAN"
        );
        setDoctors(doctorsList);
        if (doctorsList.length > 0) {
          setSelectedDoctor(doctorsList[0]);
        }
      }

      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        setAppointments(apptsData.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate doctor statistics
  const doctorStats = useMemo(() => {
    if (!selectedDoctor) return null;

    const doctorAppts = appointments.filter(
      (a) =>
        a.providerName === selectedDoctor.name &&
        a.providerRole === selectedDoctor.role
    );

    const approved = doctorAppts.filter((a) => a.status === "Approved").length;
    const rejected = doctorAppts.filter((a) => a.status === "Rejected").length;
    const scheduled = doctorAppts.filter(
      (a) => a.status === "Scheduled"
    ).length;
    const completed = doctorAppts.filter(
      (a) => a.status === "Completed"
    ).length;
    const cancelled = doctorAppts.filter(
      (a) => a.status === "Cancelled"
    ).length;

    const totalPatients = new Set(doctorAppts.map((a) => a.patientName)).size;
    const approvalRate =
      doctorAppts.length === 0
        ? "0%"
        : ((approved / doctorAppts.length) * 100).toFixed(1) + "%";

    // Monthly data for trend chart
    const monthlyData = {};
    doctorAppts.forEach((a) => {
      const [year, month] = a.date.split("-");
      const monthKey = `${month}/${year}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort()
      .map(([month, count]) => ({ month, appointments: count }));

    // Status distribution
    const statusDistribution = [
      { name: "Approved", value: approved, color: "#22c55e" },
      { name: "Rejected", value: rejected, color: "#ef4444" },
      { name: "Scheduled", value: scheduled, color: "#3b82f6" },
      { name: "Completed", value: completed, color: "#8b5cf6" },
      { name: "Cancelled", value: cancelled, color: "#9ca3af" },
    ].filter((s) => s.value > 0);

    return {
      doctorAppts,
      approved,
      rejected,
      scheduled,
      completed,
      cancelled,
      totalPatients,
      approvalRate,
      monthlyTrend,
      statusDistribution,
    };
  }, [selectedDoctor, appointments]);

  // Get unique patients for this doctor
  const doctorPatients = useMemo(() => {
    if (!doctorStats) return [];
    const patientNames = new Set(
      doctorStats.doctorAppts.map((a) => a.patientName)
    );
    return Array.from(patientNames);
  }, [doctorStats]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        Loading doctor records...
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        No doctors registered yet
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        background: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
            Doctor Records & Performance
          </h1>
          <p
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "14px",
              color: "#6B7280",
              margin: "0",
            }}
          >
            View comprehensive doctor profiles, performance metrics, and patient
            history
          </p>
        </div>

        {/* Doctor Selection */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "30px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <label
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: "12px",
              display: "block",
            }}
          >
            Select Doctor:
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {doctors.map((doctor) => (
              <button
                key={doctor.username}
                onClick={() => setSelectedDoctor(doctor)}
                style={{
                  padding: "12px 16px",
                  border:
                    selectedDoctor?.username === doctor.username
                      ? "2px solid #0B4F36"
                      : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  background:
                    selectedDoctor?.username === doctor.username
                      ? "#f0f4f8"
                      : "white",
                  color: "#1F2937",
                  cursor: "pointer",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedDoctor?.username !== doctor.username) {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.background = "#fafbfc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDoctor?.username !== doctor.username) {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.background = "white";
                  }
                }}
              >
                {doctor.role === "DENTIST" ? "🦷" : "⚕️"} {doctor.name}
              </button>
            ))}
          </div>
        </div>

        {selectedDoctor && doctorStats && (
          <>
            {/* Doctor Profile Section */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "30px",
                marginBottom: "30px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #E5E7EB",
              }}
            >
              <h2
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0B4F36",
                  marginBottom: "20px",
                  marginTop: "0",
                }}
              >
                📋 Doctor Profile
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "30px",
                }}
              >
                {/* Left Column - Profile Info */}
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Full Name
                    </label>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1F2937",
                        margin: "8px 0 0 0",
                      }}
                    >
                      {selectedDoctor.name}
                    </p>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Specialization
                    </label>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1F2937",
                        margin: "8px 0 0 0",
                      }}
                    >
                      {selectedDoctor.role === "DENTIST"
                        ? "🦷 Dentist"
                        : "⚕️ Physician"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Username
                    </label>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6B7280",
                        margin: "8px 0 0 0",
                      }}
                    >
                      @{selectedDoctor.username}
                    </p>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Email
                    </label>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6B7280",
                        margin: "8px 0 0 0",
                      }}
                    >
                      📧 {selectedDoctor.email}
                    </p>
                  </div>

                  {selectedDoctor.phone && (
                    <div style={{ marginBottom: "24px" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#9CA3AF",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Phone
                      </label>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                          margin: "8px 0 0 0",
                        }}
                      >
                        📱 {selectedDoctor.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Status */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #0B4F36 0%, #083d2a 100%)",
                    borderRadius: "12px",
                    padding: "24px",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ marginBottom: "20px" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        opacity: 0.9,
                        margin: "0 0 8px 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Status
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        margin: "0",
                      }}
                    >
                      ✅ Active
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        opacity: 0.9,
                        margin: "0 0 8px 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Availability
                    </p>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        margin: "0",
                      }}
                    >
                      🕐 Monday - Friday
                      <br />
                      9:00 AM - 5:00 PM
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        opacity: 0.9,
                        margin: "0 0 8px 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      License Status
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        margin: "0",
                      }}
                    >
                      📜 Valid & Updated
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorRecords;
