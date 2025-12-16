import React, { useState, useEffect } from "react";
import "/src/BookAppointment.css";
// Assuming you are using React Icons for better UX (optional)
import { FaCalendarPlus } from "react-icons/fa";

const BookAppointment = () => {
  // --- 1. STATE MANAGEMENT ---
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState(""); // Ensure this is in +63 format for SMS
  const [providerRole, setProviderRole] = useState("DENTIST"); // Default to DENTIST
  const [providerName, setProviderName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [providers, setProviders] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- 2. EFFECT: Fetch Providers on Load ---
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // Fetch the list of DENTIST and PHYSICIAN users from your Express backend
        const response = await fetch("/api/users");
        const data = await response.json();

        if (data.users && data.users.length > 0) {
          setProviders(data.users);
          // Set default provider to the first DENTIST found
          const defaultProvider = data.users.find((u) => u.role === "DENTIST");
          if (defaultProvider) {
            setProviderName(defaultProvider.name);
            setProviderRole(defaultProvider.role);
          }
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        setMessage("Error loading provider list.");
      }
    };
    fetchProviders();
  }, []);

  // Function to handle provider selection change
  const handleProviderChange = (e) => {
    const selectedName = e.target.value;
    const selectedProvider = providers.find((p) => p.name === selectedName);
    if (selectedProvider) {
      setProviderName(selectedProvider.name);
      setProviderRole(selectedProvider.role);
    }
  };

  // --- 3. HANDLER: Submit Appointment ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Processing booking request...");

    // Simple validation check
    if (!patientName || !providerName || !appointmentDate || !appointmentTime) {
      setMessage("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const newAppt = {
      id: "A-" + Date.now(), // Generate a unique ID (local only)
      patientName,
      patientEmail,
      patientPhone,
      providerRole,
      providerName,
      date: appointmentDate,
      time: appointmentTime,
      status: "Scheduled",
      notes,
    };

    try {
      // Send the appointment data to the backend API
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppt),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(
          `✅ Appointment booked successfully with ${providerName}! Confirmation email and SMS sent.`
        );
        // Clear form fields
        setPatientName("");
        setPatientEmail("");
        setPatientPhone("");
        setAppointmentDate("");
        setAppointmentTime("");
        setNotes("");
      } else if (response.status === 409) {
        // Conflict status (409) for availability check failure
        setMessage(`❌ Booking Failed: ${result.message}`);
      } else {
        setMessage(
          `❌ Booking Failed: ${
            result.message || "Server error. Please try again."
          }`
        );
      }
    } catch (error) {
      setMessage(
        "❌ Network Error: Could not connect to the appointment server."
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. RENDER ---
  return (
    <div className="appointment-form-container">
      <header className="form-header">
        <FaCalendarPlus size={24} />
        <h2>Book New Clinic Appointment</h2>
      </header>

      <form className="appointment-form" onSubmit={handleSubmit}>
        {/* PATIENT DETAILS */}
        <fieldset>
          <legend>Patient Information</legend>
          <div className="form-group">
            <label htmlFor="patientName">Your Full Name*</label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div className="form-group">
            <label htmlFor="patientEmail">Email Address</label>
            <input
              id="patientEmail"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="e.g., jane@mail.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="patientPhone">
              Phone Number (Format: +63XXXXXXXXXX)
            </label>
            <input
              id="patientPhone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+63XXXXXXXXXX"
            />
          </div>
        </fieldset>

        {/* PROVIDER & TIME SELECTION */}
        <fieldset>
          <legend>Appointment Details</legend>
          <div className="form-group">
            <label htmlFor="providerSelect">Select Provider*</label>
            <select
              id="providerSelect"
              value={providerName}
              onChange={handleProviderChange}
              required
            >
              <option value="" disabled>
                -- Select a Doctor/Dentist --
              </option>
              {providers.map((p) => (
                <option key={p.username} value={p.name}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group half-width">
            <label htmlFor="date">Date*</label>
            <input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="time">Time* (30-min slot)</label>
            <input
              id="time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              step="1800" // Enforces 30-minute intervals (30*60=1800 seconds)
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes/Reason for Visit</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Briefly describe the reason for your appointment..."
            ></textarea>
          </div>
        </fieldset>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>

      {message && (
        <p
          className={`status-message ${
            message.startsWith("❌") ? "error" : "success"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default BookAppointment;
