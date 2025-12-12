import { useState } from "react";

const BookAppointment = ({ user, onBook }) => {
  const [providerRole, setProviderRole] = useState("DENTIST");
  const [providerName, setProviderName] = useState("");
  const [patientEmail, setPatientEmail] = useState(user?.email || "");
  const [patientPhone, setPatientPhone] = useState(user?.phone || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You need to be logged in to book an appointment.");
    const newAppt = {
      id: `A-${Date.now()}`,
      patientName: user.name || user.username,
      patientEmail,
      patientPhone,
      providerRole,
      providerName:
        providerName ||
        (providerRole === "DENTIST" ? "Dr. Santos" : "Dr. Reyes"),
      date,
      time,
      status: "Scheduled",
    };
    try {
      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppt),
      });
      if (!res.ok) {
        const data = await res.json();
        return alert(data.message || "Failed to book");
      }
      const data = await res.json();
      onBook(data.appointment);
      alert("Appointment booked!");
    } catch (err) {
      console.error(err);
      alert("Server not reachable");
    }
    setProviderName("");
    setPatientEmail("");
    setPatientPhone("");
    setDate("");
    setTime("");
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontFamily: "Poppins, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1F2937",
  };

  const inputStyle = {
    padding: "12px 14px",
    marginBottom: 20,
    width: "100%",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "Poppins, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage:
      'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%270B4F36%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "20px",
    paddingRight: "40px",
  };

  return (
    <div
      style={{
        padding: "50px 40px",
        minHeight: "100vh",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            marginBottom: "50px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "42px",
              fontWeight: "800",
              color: "#0B4F36",
              marginBottom: "15px",
              marginTop: "0",
            }}
          >
            Book Your Appointment
          </h1>

          <p
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "16px",
              color: "#6B7280",
              marginBottom: "0",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Schedule a consultation with our expert healthcare professionals.
            Fill in your details below and we'll confirm your appointment
            shortly.
          </p>
        </div>

        {/* Main Form Container */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "50px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            border: "2px solid rgba(11, 79, 54, 0.1)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Section Title */}
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "18px",
                fontWeight: "700",
                color: "#0B4F36",
                marginBottom: "30px",
                marginTop: "0",
                paddingBottom: "15px",
                borderBottom: "3px solid #F0B400",
                display: "inline-block",
              }}
            >
              📋 Appointment Details
            </h3>

            {/* 2-Column Grid Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "30px",
                marginBottom: "35px",
              }}
            >
              {/* Appointment Type */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  📅 Appointment Type
                </label>
                <select
                  value={providerRole}
                  onChange={(e) => setProviderRole(e.target.value)}
                  style={{
                    ...selectStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="DENTIST">🦷 Dentist</option>
                  <option value="PHYSICIAN">⚕️ Physician</option>
                </select>
              </div>

              {/* Provider Name */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  👨‍⚕️ Provider Name (optional)
                </label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g., Dr. Santos"
                  style={{
                    ...inputStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Section Title 2 */}
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "18px",
                fontWeight: "700",
                color: "#0B4F36",
                marginBottom: "30px",
                marginTop: "0",
                paddingBottom: "15px",
                borderBottom: "3px solid #F0B400",
                display: "inline-block",
              }}
            >
              👤 Patient Information
            </h3>

            {/* Patient Info Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "30px",
                marginBottom: "35px",
              }}
            >
              {/* Patient Email */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  📧 Patient Email
                </label>
                <input
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="kim@gmail.com"
                  type="email"
                  style={{
                    ...inputStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Patient Phone */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  📱 Patient Phone
                </label>
                <input
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="09669474682"
                  style={{
                    ...inputStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Section Title 3 */}
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "18px",
                fontWeight: "700",
                color: "#0B4F36",
                marginBottom: "30px",
                marginTop: "0",
                paddingBottom: "15px",
                borderBottom: "3px solid #F0B400",
                display: "inline-block",
              }}
            >
              ⏰ Schedule
            </h3>

            {/* Schedule Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "30px",
                marginBottom: "40px",
              }}
            >
              {/* Date */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  📆 Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    ...inputStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Time */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: "12px",
                    fontSize: "15px",
                  }}
                >
                  🕐 Select Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{
                    ...inputStyle,
                    marginBottom: "0",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B4F36";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(11, 79, 54, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px 24px",
                background: "linear-gradient(135deg, #0B4F36 0%, #083d2a 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                fontFamily: "Poppins, sans-serif",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(11, 79, 54, 0.3)",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = "0 8px 25px rgba(11, 79, 54, 0.4)";
                e.target.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = "0 4px 15px rgba(11, 79, 54, 0.3)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ✅ Confirm & Book Appointment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
