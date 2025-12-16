require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { google } = require("googleapis"); // ⭐️ Google Calendar Import

// --- EMAIL SERVICE IMPORTS ---
const {
  transporter: emailTransporter,
  sendAppointmentToProvider,
} = require("./services/emailService");

// ====================================================================
// GOOGLE CALENDAR API SETUP
// ====================================================================

const calendarId = process.env.GOOGLE_CALENDAR_ID;
const timeZone = process.env.TIME_ZONE || "Asia/Manila";

// Authenticate the Service Account using JWT
const keyFilePath = process.env.GOOGLE_KEYFILE_PATH;
const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath, // <-- Must use the keyFile property
  scopes: ["https://www.googleapis.com/auth/calendar"],
});
// Instantiate the Google Calendar API service
const calendar = google.calendar({
  version: "v3",
  auth: auth,
});

if (!calendarId) {
  console.warn(
    "⚠️ Google Calendar not fully configured: Booking will only be saved locally."
  );
}

/**
 * @function checkAvailability
 * @description Queries the Google Calendar API for busy times within a time range.
 * @param {Date} startDateTime - The start of the time range to check.
 * @param {Date} endDateTime - The end of the time range to check.
 * @param {string} providerEmail - The email of the provider to check.
 * @returns {boolean} Returns true if the calendar is BUSY (double-booked), false if FREE.
 */
async function checkAvailability(startDateTime, endDateTime, providerEmail) {
  if (!calendarId) {
    return false; // Assume free if we can't check
  }

  try {
    const response = await calendar.freebusy.query({
      resource: {
        timeMin: startDateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        timeZone: timeZone,
        items: [
          { id: calendarId }, // <-- ONLY this one
        ],
      },
    });

    // Check the busy entries for the main calendar ID
    const calendarBusy = response.data.calendars[calendarId];

    // If the 'busy' array has any entries, the calendar is busy.
    const isBusy =
      calendarBusy && calendarBusy.busy && calendarBusy.busy.length > 0;

    if (isBusy) {
      console.log(
        `❌ Provider is BUSY from ${startDateTime.toLocaleTimeString()} to ${endDateTime.toLocaleTimeString()}.`
      );
    } else {
      console.log(
        `✅ Provider is FREE from ${startDateTime.toLocaleTimeString()} to ${endDateTime.toLocaleTimeString()}.`
      );
    }

    return isBusy;
  } catch (error) {
    console.error("❌ Error checking calendar availability:", error.message);
    // It's safer to treat the slot as busy if the API fails.
    return true;
  }
}

/**
 * @function bookAppointmentOnCalendar
 * @description Creates a new event on the Google Calendar.
 */
async function bookAppointmentOnCalendar(appt, providerUser) {
  if (!calendarId) {
    return; // Skip if ID is missing
  }

  try {
    // Combine date and time from the local appt object
    const startDateTime = new Date(`${appt.date}T${appt.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30-minute duration

    const event = {
      summary: `${appt.providerRole} Appt: ${appt.patientName}`,
      description: `Booked via CSU Clinic System.\nPatient Email: ${
        appt.patientEmail
      }\nPatient Phone: ${appt.patientPhone}\nNotes: ${appt.notes || "None"}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: timeZone },
      end: { dateTime: endDateTime.toISOString(), timeZone: timeZone },
      attendees: [],
      sendUpdates: "none",
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log("✅ Google Calendar Event Created:", response.data.htmlLink);
    return response.data.id;
  } catch (error) {
    console.error("❌ Failed to book event on Google Calendar:", error.message);
    // Allow the rest of the async block (email) to execute.
  }
}

// ====================================================================
// SMS LOGIC: INFOBIP (EXISTING CODE)
// ====================================================================

const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_SENDER = process.env.INFOBIP_SENDER;

if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_SENDER) {
  console.log("Infobip not configured: SMS notifications will be skipped.");
}

const sendInfobipSMS = async (to, message) => {
  if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_SENDER) {
    return false;
  }

  try {
    const response = await fetch(`${INFOBIP_BASE_URL}/sms/2/text/single`, {
      method: "POST",
      headers: {
        Authorization: `App ${INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: INFOBIP_SENDER,
        to: to, // Must be in +639XXXXXXXXX format
        text: message,
      }),
    });

    const result = await response.json();
    const groupId = result.messages?.[0]?.status?.groupId;

    if (response.ok && (groupId === 3 || groupId === 5)) {
      console.log(
        `✅ Infobip SMS Request Successful (Status Group ID: ${groupId}) to ${to}.`
      );
      return true;
    } else {
      console.error(
        `❌ Infobip SMS Failed. Status: ${
          result.messages?.[0]?.status?.name || "Unknown Error"
        }`,
        result.messages?.[0]?.status?.description || result
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Infobip API Request Failed:", error);
    return false;
  }
};

// ====================================================================
// SERVER SETUP & HELPERS (EXISTING CODE)
// ====================================================================

const app = express();
const DATA_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const readData = async () => {
  try {
    const exists = await fs.pathExists(DATA_FILE);
    if (!exists) {
      await fs.writeJson(
        DATA_FILE,
        { users: [], appointments: [] },
        { spaces: 2 }
      );
    }
    const data = await fs.readJson(DATA_FILE);
    return data;
  } catch (err) {
    console.error("readData error", err);
    return { users: [], appointments: [] };
  }
};

const writeData = async (data) => {
  try {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (err) {
    console.error("writeData error", err);
  }
};

// Seed sample data on first run
(async () => {
  const data = await readData();
  if (!data.users || data.users.length === 0) {
    data.users = [
      {
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "ADMIN",
        email: "admin@csu.local",
        phone: "",
      },
      {
        username: "kylle",
        password: "kylle123",
        name: "Kylle Cruz",
        role: "CLIENT",
        email: "kylle.mercado@csu.local",
        phone: "+639669474682", // Client number
      },
      {
        username: "drsantos",
        password: "drpass",
        name: "Dr. Santos",
        role: "DENTIST",
        email: "kyllemae.mercado@carsu.edu.ph", // Doctor Email 1
        phone: "+639669474683",
      },
      {
        username: "drreyes",
        password: "drpass",
        name: "Dr. Reyes",
        role: "PHYSICIAN",
        email: "kimayeshaanne.mongado@carsu.edu.ph", // Doctor Email 2
        phone: "+639669474684",
      },
    ];
  }
  if (!data.appointments) {
    data.appointments = [
      {
        id: "A-1001",
        patientName: "Kylle Cruz",
        patientEmail: "kylle.mercado@csu.local",
        patientPhone: "+639669474682",
        providerRole: "DENTIST",
        providerName: "Dr. Santos",
        date: "2025-12-03",
        time: "09:00",
        status: "Scheduled",
        notes: "",
      },
      {
        id: "A-1002",
        patientName: "Kim Mongado",
        patientEmail: "kim.mongado@csu.local",
        patientPhone: "+639669474685",
        providerRole: "PHYSICIAN",
        providerName: "Dr. Reyes",
        date: "2025-12-04",
        time: "10:30",
        status: "Scheduled",
        notes: "",
      },
    ];
  }
  await writeData(data);
})();

// ========== API ROUTES ==========

app.get("/test-email", async (req, res) => {
  try {
    const testEmail = {
      from:
        process.env.SMTP_FROM || process.env.SMTP_USER || "test@example.com",
      to: process.env.SMTP_USER || "test@example.com",
      subject: "✅ CSU Clinic Email API Test - SUCCESS",
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #0B4F36;">🎉 CSU Clinic Email API is Working!</h2>
                  <p>If you received this, your Nodemailer setup is correct.</p>
                  <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>From:</strong> ${
                      process.env.SMTP_FROM || "Not configured"
                    }</p>
                    <p><strong>To:</strong> ${
                      process.env.SMTP_USER || "Not configured"
                    }</p>
                  </div>
                  <p>You can now use the appointment email functions.</p>
                </div>
            `,
    };

    if (!emailTransporter) {
      return res.status(500).json({
        success: false,
        error: "Email transporter not initialized",
        details: "Check your email service configuration",
      });
    }

    const info = await emailTransporter.sendMail(testEmail);

    res.json({
      success: true,
      message: "Test email sent successfully!",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ Test email error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: "Check SMTP credentials in .env",
    });
  }
});

// ========== EMAIL API ENDPOINTS / HELPERS ==========
const getProviderEmail = (providerRole, providerName, data) => {
  const provider = data.users.find(
    (u) =>
      (u.name === providerName && u.role === providerRole) ||
      (providerRole === "DENTIST" && providerName === "Dr. Santos") ||
      (providerRole === "PHYSICIAN" && providerName === "Dr. Reyes")
  );
  return provider ? provider.email : null;
};

// --- APPOINTMENT CREATION ROUTE (NOW INCLUDES AVAILABILITY CHECK) ---
app.post("/api/appointments", async (req, res) => {
  const newAppt = req.body;
  const data = await readData();

  // Find the provider user to get their email and details
  const providerUser = data.users.find(
    (u) => u.name === newAppt.providerName && u.role === newAppt.providerRole
  );

  if (!providerUser) {
    return res.status(404).json({
      success: false,
      message: "Provider not found in system.",
    });
  }

  // --- Determine Appointment Slot ---
  const startDateTime = new Date(`${newAppt.date}T${newAppt.time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes

  // ==============================================================
  // ⭐️ AVAILABILITY CHECK - BLOCK EXECUTION IF BUSY
  // ==============================================================
  const isBusy = await checkAvailability(
    startDateTime,
    endDateTime,
    providerUser.email
  );

  if (isBusy) {
    console.log(
      `🛑 Booking rejected: Provider ${newAppt.providerName} is already busy at this time.`
    );
    return res.status(409).json({
      success: false,
      message:
        "Provider is unavailable at the requested time. Please choose another slot.",
    });
  }
  // ==============================================================

  // 1. Save the new appointment to the local database (Only runs if FREE)
  data.appointments.push(newAppt);
  await writeData(data);

  // 2. Send success response immediately
  res.json({ success: true, appointment: newAppt });

  // 3. Trigger Asynchronous Processing (Calendar Booking & Email)
  (async () => {
    let calendarEventId = null;

    try {
      // GOOGLE CALENDAR BOOKING
      if (calendarId) {
        calendarEventId = await bookAppointmentOnCalendar(
          newAppt,
          providerUser
        );
      } else {
        console.log("⚠️ Cannot book on calendar: Missing Calendar ID.");
      }

      // Trigger the Email Notification to the Doctor
      const providerEmail = providerUser.email;

      if (providerEmail) {
        // Pass the calendarEventId along for better email content if needed
        await sendAppointmentToProvider(
          providerEmail,
          newAppt,
          calendarEventId
        );
        console.log(
          `✅ New Appointment Email sent to provider: ${providerEmail}`
        );
      } else {
        console.log(
          `⚠️ Email skipped: Provider email not found for ${newAppt.providerName}`
        );
      }
    } catch (err) {
      console.error(
        "❌ Failed in post-appointment processing (Calendar/Email):",
        err.message
      );
    }
  })();
});

// ========== EXISTING API ROUTES (Login, Signup, Users, Appointments) ==========
app.post("/api/signup", async (req, res) => {
  const newUser = req.body;
  const data = await readData();

  if (!newUser.username || !newUser.password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }
  const existingUser = data.users.find((u) => u.username === newUser.username);
  if (existingUser) {
    return res.status(409).json({ message: "Username already exists" });
  }

  if (!newUser.role) {
    newUser.role = "CLIENT";
  }
  data.users.push(newUser);
  await writeData(data);

  console.log(`✅ New user signed up: ${newUser.username} (${newUser.role})`);
  const { password, ...userWithoutPassword } = newUser;
  res.json({
    success: true,
    message: "User created successfully",
    user: userWithoutPassword,
  });
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await readData();

    const user = data.users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      console.log(`✅ User logged in: ${username} (${user.role})`);
      res.json({ success: true, user: userWithoutPassword });
    } else {
      console.log(`❌ Login attempt failed for: ${username}`);
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login Route Failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
});

app.get("/api/users", async (req, res) => {
  const data = await readData();
  const providers = data.users.filter(
    (u) => u.role === "DENTIST" || u.role === "PHYSICIAN"
  );
  const safeProviders = providers.map(({ password, ...rest }) => rest);
  res.json({ users: safeProviders });
});

app.get("/api/appointments", async (req, res) => {
  const { role, name, providerRole, providerName } = req.query;
  const data = await readData();
  let list = data.appointments || [];

  if (role && role === "CLIENT" && name) {
    list = list.filter((a) => a.patientName === name);
  }

  if (providerRole && providerName) {
    list = list.filter(
      (a) => a.providerRole === providerRole && a.providerName === providerName
    );
  }

  if (role && (role === "DENTIST" || role === "PHYSICIAN")) {
    list = list.filter((a) => a.providerRole === role);
  }

  res.json({ appointments: list });
});

// --- APPOINTMENT STATUS UPDATE (PATIENT SMS TRIGGER - FORMAL MESSAGE) ---
app.put("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = await readData();
  const idx = data.appointments.findIndex((a) => a.id === id);

  if (idx === -1) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const oldAppt = data.appointments[idx];
  data.appointments[idx] = { ...oldAppt, ...updates };

  if (
    updates.status &&
    updates.status.toLowerCase() === "rejected" &&
    updates.notes
  ) {
    data.appointments[idx].notes = updates.notes;
  }
  await writeData(data);
  res.json({ success: true, appointment: data.appointments[idx] });

  // --- ASYNCHRONOUS NOTIFICATION BLOCK (SMS ONLY) ---
  (async () => {
    try {
      const appt = data.appointments[idx];
      const patientPhone = appt.patientPhone;

      if (updates && updates.status) {
        const newStatus = updates.status;
        let body = `Hello ${appt.patientName}, `;

        if (
          (newStatus.toLowerCase() === "confirmed" ||
            newStatus.toLowerCase() === "approved") &&
          patientPhone &&
          patientPhone.startsWith("+63")
        ) {
          body += `Your appointment on ${appt.date} at ${appt.time} with ${appt.providerName} has been APPROVED. Please ensure you come on time and bring your ID and necessary documents. Thank you.`;
          await sendInfobipSMS(patientPhone, body);
        } else if (
          newStatus.toLowerCase() === "rejected" &&
          patientPhone &&
          patientPhone.startsWith("+63")
        ) {
          body += `Your appointment with ${appt.providerName} on ${appt.date} has been REJECTED.`;
          if (updates.notes) body += ` Reason: ${updates.notes}.`;
          body += ` Please re-book or call the clinic for assistance.`;

          await sendInfobipSMS(patientPhone, body);
        } else if (patientPhone && !patientPhone.startsWith("+63")) {
          console.log(
            `SMS skipped: Patient phone number ${patientPhone} must be in +63 format for Infobip.`
          );
        }
      }
    } catch (err) {
      console.error(
        "Failed to send notification for appointment status change",
        err.message
      );
    }
  })();
});

app.delete("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  const initialLength = data.appointments.length;
  data.appointments = data.appointments.filter((a) => a.id !== id);

  if (data.appointments.length === initialLength) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  await writeData(data);
  res.json({ success: true, message: "Appointment deleted" });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 CSU Clinic server listening on port ${PORT}`);
  console.log(`📧 Test email route: http://localhost:${PORT}/test-email`);
});
