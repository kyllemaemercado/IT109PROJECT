require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
let twilioClient = null;
try {
  const Twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (err) {
  // twilio not installed - will log messages to console
}

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Helper functions
const readData = async () => {
  try {
    const exists = await fs.pathExists(DATA_FILE);
    if (!exists) {
      await fs.writeJson(DATA_FILE, { users: [], appointments: [] }, { spaces: 2 });
    }
    const data = await fs.readJson(DATA_FILE);
    return data;
  } catch (err) {
    console.error('readData error', err);
    return { users: [], appointments: [] };
  }
};

const writeData = async (data) => {
  try {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (err) {
    console.error('writeData error', err);
  }
};

// Seed sample data on first run
(async () => {
  const data = await readData();
  if (!data.users || data.users.length === 0) {
    data.users = [
      { username: 'admin', password: 'admin123', name: 'Administrator', role: 'ADMIN', email: 'admin@csu.local', phone: '' },
      { username: 'kylle', password: 'kylle123', name: 'Kylle Cruz', role: 'CLIENT', email: 'kylle.mercado@csu.local', phone: '09669474682' },
      { username: 'drsantos', password: 'drpass', name: 'Dr. Santos', role: 'DENTIST', email: 'kyllemae.mercado@carsu.edu.ph', phone: '09669474683' },
      { username: 'drreyes', password: 'drpass', name: 'Dr. Reyes', role: 'PHYSICIAN', email: 'dr.reyes@csu.local', phone: '09669474684' },
    ];
  }
  if (!data.appointments) {
    data.appointments = [
      { id: 'A-1001', patientName: 'Kylle Cruz', patientEmail: 'kylle.mercado@csu.local', patientPhone: '09669474682', providerRole: 'DENTIST', providerName: 'Dr. Santos', date: '2025-12-03', time: '09:00', status: 'Scheduled', notes: '' },
      { id: 'A-1002', patientName: 'Kim Mongado', patientEmail: 'kim.mongado@csu.local', patientPhone: '09669474685', providerRole: 'PHYSICIAN', providerName: 'Dr. Reyes', date: '2025-12-04', time: '10:30', status: 'Scheduled', notes: '' },
    ];
  }
  await writeData(data);
})();

// Setup nodemailer transporter
let transporter = null;
(async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Create an ethereal account for development if not provided
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('Using Ethereal SMTP account for emails');
    } catch (err) {
      console.error('Failed to create test email account', err);
    }
  }
})();

// Basic API
app.post('/api/signup', async (req, res) => {
  const { username, password, name, role, email, phone } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const data = await readData();
  if (data.users.find((u) => u.username === username)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const newUser = { username, password, name, role, email: email || '', phone: phone || '' };
  data.users.push(newUser);
  await writeData(data);
  res.json({ success: true, user: { username, name, role, email: newUser.email, phone: newUser.phone } });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const data = await readData();
  const user = data.users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ success: true, user: { username: user.username, name: user.name, role: user.role, email: user.email || '', phone: user.phone || '' } });
});

app.get('/api/users', async (req, res) => {
  const data = await readData();
  res.json({ users: data.users.map(u => ({ username: u.username, name: u.name, role: u.role })) });
});

app.get('/api/appointments', async (req, res) => {
  const { role, name } = req.query; // optional filtering
  const data = await readData();
  let list = data.appointments || [];
  if (role && role === 'CLIENT' && name) list = list.filter(a => a.patientName === name);
  if (role && (role === 'DENTIST' || role === 'PHYSICIAN')) list = list.filter(a => a.providerRole === role);
  res.json({ appointments: list });
});

app.post('/api/appointments', async (req, res) => {
  const { patientName, patientEmail, patientPhone, providerRole, providerName, date, time } = req.body;
  if (!patientName || !providerRole || !date || !time) return res.status(400).json({ message: 'Missing fields' });
  const data = await readData();
  const newAppt = {
    id: `A-${Date.now()}`,
    patientName,
    patientEmail: patientEmail || '',
    patientPhone: patientPhone || '',
    providerRole,
    providerName: providerName || (providerRole === 'DENTIST' ? 'Dr. Santos' : 'Dr. Reyes'),
    date,
    time,
    status: 'Scheduled',
    notes: '',
  };
  data.appointments.push(newAppt);
  await writeData(data);
  res.json({ success: true, appointment: newAppt });

  // Send email to provider (if available)
  (async () => {
    try {
      const providerUser = data.users.find(u => u.role === providerRole && u.name === newAppt.providerName);
      const providerEmail = providerUser?.email || (process.env.DEFAULT_PROVIDER_EMAIL || null);
      if (providerEmail && transporter) {
        const mailRes = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'kyllemae.mercado@carsu.edu.ph',
          to: providerEmail,
          subject: `New appointment: ${newAppt.patientName}`,
          text: `A new appointment has been booked by ${newAppt.patientName} on ${newAppt.date} at ${newAppt.time}. Provider: ${newAppt.providerName}`,
        });
        console.log('Email sent to provider', mailRes.messageId);
        if (nodemailer.getTestMessageUrl) {
          console.log('Email preview URL:', nodemailer.getTestMessageUrl(mailRes));
        }
      } else {
        console.log('No provider email configured; not sending email. providerUser:', providerUser?.username);
      }
    } catch (err) {
      console.error('Failed to send provider email', err);
    }
  })();
});

app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = await readData();
  const idx = data.appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ message: "Appointment not found" });
  const oldAppt = { ...data.appointments[idx] };
  data.appointments[idx] = { ...data.appointments[idx], ...updates };
  await writeData(data);
  res.json({ success: true, appointment: data.appointments[idx] });

  // If appointment status changed to Confirmed, SMS patient if possible
  (async () => {
    try {
      const appt = data.appointments[idx];
      const patientPhone = appt.patientPhone;
      const patientEmail = appt.patientEmail;
      // Send SMS if status changed to Confirmed, or Approved, or Rejected and we have twilio configured
      if (updates && updates.status) {
        const newStatus = updates.status.toLowerCase();
        if ((newStatus === 'confirmed' || newStatus === 'approved' || newStatus === 'rejected') && patientPhone && twilioClient && process.env.TWILIO_FROM) {
          let body = `Your appointment on ${appt.date} at ${appt.time} with ${appt.providerName} is ${updates.status}.`;
          if (updates.notes) body += ` Reason: ${updates.notes}`;
          await twilioClient.messages.create({ body, from: process.env.TWILIO_FROM, to: patientPhone });
          console.log('SMS sent to patient', patientPhone);
        }
        // send email to patient for Approved/Rejected or Confirmed
        if ((newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'confirmed') && patientEmail && transporter) {
          let subject = `Appointment ${updates.status}: ${appt.patientName}`;
          let text = `Your appointment on ${appt.date} at ${appt.time} with ${appt.providerName} has been ${updates.status}.`;
          if (updates.notes) text += `\n\nNotes: ${updates.notes}`;
          const mailRes = await transporter.sendMail({ from: process.env.SMTP_FROM || 'kyllemae.mercado@carsu.edu.ph', to: patientEmail, subject, text });
          console.log('Email sent to patient', mailRes.messageId);
          if (nodemailer.getTestMessageUrl) {
            console.log('Email preview URL:', nodemailer.getTestMessageUrl(mailRes));
          }
        }
      }
      // If appointment was rejected, persist 'notes' if passed
      if (updates && updates.status && updates.status.toLowerCase() === 'rejected' && updates.notes) {
        data.appointments[idx].notes = updates.notes;
        await writeData(data);
      }
    } catch (err) {
      console.error('Failed to send notification for appointment status change', err);
    }
  })();
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  data.appointments = data.appointments.filter(a => a.id !== id);
  await writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`CSU Clinic server listening on ${PORT}`));
