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
      providerName: providerName || (providerRole === "DENTIST" ? "Dr. Santos" : "Dr. Reyes"),
      date,
      time,
      status: "Scheduled",
    };
    try {
        const res = await fetch('http://localhost:4000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt),
      });
      if (!res.ok) {
        const data = await res.json();
        return alert(data.message || 'Failed to book');
      }
      const data = await res.json();
      onBook(data.appointment);
      alert('Appointment booked!');
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
    setProviderName("");
    setPatientEmail("");
    setPatientPhone("");
    setDate("");
    setTime("");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Book an Appointment</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Appointment Type</label>
        <select value={providerRole} onChange={(e) => setProviderRole(e.target.value)} style={{ padding: 10, marginBottom: 12, width: '100%' }}>
          <option value="DENTIST">Dentist</option>
          <option value="PHYSICIAN">Physician</option>
        </select>

        <label style={{ display: 'block', marginBottom: 8 }}>Provider Name (optional)</label>
        <input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Dr. Name" style={{ padding: 10, marginBottom: 12, width: '100%' }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Patient Email</label>
        <input value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="you@example.com" style={{ padding: 10, marginBottom: 12, width: '100%' }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Patient Phone</label>
        <input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="+1555..." style={{ padding: 10, marginBottom: 12, width: '100%' }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: 10, marginBottom: 12, width: '100%' }} />

        <label style={{ display: 'block', marginBottom: 8 }}>Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ padding: 10, marginBottom: 12, width: '100%' }} />

        <button type="submit" style={{ padding: '10px 18px', background: '#0B4F36', color: 'white', border: 'none', borderRadius: 8 }}>Book</button>
      </form>
    </div>
  );
};

export default BookAppointment;
