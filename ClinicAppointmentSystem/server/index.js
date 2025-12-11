require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { 
  transporter: emailTransporter, 
  sendAppointmentToProvider, 
  sendApprovalToPatient, 
  sendRejectionToPatient 
} = require('./services/emailService');
const { sendAppointmentApprovalViaSims, sendAppointmentRejectionViaSims } = require('./services/simsService');

let twilioClient = null;
try {
  const Twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (err) {
  // twilio not installed - will log messages to console
  console.log('Twilio not configured:', err.message);
}

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 5000; // Changed to 5000 to match your email routes

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
      { username: 'drreyes', password: 'drpass', name: 'Dr. Reyes', role: 'PHYSICIAN', email: 'kimayeshaanne.mongado@carsu.edu.ph', phone: '09669474684' },
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

// ========== EMAIL TEST ROUTE ==========
app.get('/test-email', async (req, res) => {
  try {
    // Use the transporter from emailService
    const testEmail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'test@example.com',
      to: process.env.SMTP_USER || 'test@example.com',
      subject: '✅ CSU Clinic Email API Test - SUCCESS',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0B4F36;">🎉 CSU Clinic Email API is Working!</h2>
          <p>If you received this, your Nodemailer setup is correct.</p>
          <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>From:</strong> ${process.env.SMTP_FROM || 'Not configured'}</p>
            <p><strong>To:</strong> ${process.env.SMTP_USER || 'Not configured'}</p>
          </div>
          <p>You can now use the appointment email functions.</p>
        </div>
      `,
    };

    if (!emailTransporter) {
      return res.status(500).json({
        success: false,
        error: 'Email transporter not initialized',
        details: 'Check your email service configuration'
      });
    }

    const info = await emailTransporter.sendMail(testEmail);
    
    res.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check SMTP credentials in .env'
    });
  }
});

// ========== EMAIL API ENDPOINTS ==========
// 1. Send appointment notification (when patient books)
app.post('/api/appointments/notify-provider', async (req, res) => {
  try {
    const { providerEmail, appointment } = req.body;
    
    const result = await sendAppointmentToProvider(providerEmail, appointment);
    
    if (result) {
      res.json({
        success: true,
        message: 'Provider notified successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }
  } catch (error) {
    console.error('Error notifying provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. Send approval to patient (when provider approves)
app.post('/api/appointments/approve', async (req, res) => {
  try {
    const { patientEmail, appointment } = req.body;
    
    const result = await sendApprovalToPatient(patientEmail, appointment);
    
    if (result) {
      res.json({
        success: true,
        message: 'Approval email sent to patient',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send approval email'
      });
    }
  } catch (error) {
    console.error('Error sending approval:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. Send rejection to patient (when provider rejects)
app.post('/api/appointments/reject', async (req, res) => {
  try {
    const { patientEmail, appointment, reason } = req.body;
    
    const result = await sendRejectionToPatient(patientEmail, appointment, reason);
    
    if (result) {
      res.json({
        success: true,
        message: 'Rejection email sent to patient',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send rejection email'
      });
    }
  } catch (error) {
    console.error('Error sending rejection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== EXISTING API ROUTES ==========
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

app.get('/api/patients', async (req, res) => {
  const data = await readData();
  const appointments = data.appointments || [];
  
  // Create a map of unique patients with their statuses
  const patientsMap = new Map();
  
  appointments.forEach(appt => {
    if (!patientsMap.has(appt.patientName)) {
      patientsMap.set(appt.patientName, {
        name: appt.patientName,
        email: appt.patientEmail,
        phone: appt.patientPhone,
        status: appt.status,
      });
    } else {
      // Update status to the latest appointment status
      const existing = patientsMap.get(appt.patientName);
      existing.status = appt.status;
    }
  });
  
  const patients = Array.from(patientsMap.values());
  res.json(patients);
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
  
  // Send email to provider (if available) - wait for it to complete
  try {
    // Try to find provider by role AND name first
    let providerUser = data.users.find(u => u.role === providerRole && u.name === newAppt.providerName);
    
    // If not found by name, try to find by role only (as fallback)
    if (!providerUser) {
      providerUser = data.users.find(u => u.role === providerRole);
      if (providerUser) {
        console.log(`⚠️ Provider name not found, using first available ${providerRole}:`, providerUser.name);
      }
    }
    
    const providerEmail = providerUser?.email || (process.env.DEFAULT_PROVIDER_EMAIL || null);
    if (providerEmail) {
      console.log(`📧 Sending appointment notification to doctor: ${providerEmail}`);
      await sendAppointmentToProvider(providerEmail, newAppt);
      console.log(`✅ Email sent successfully to ${providerEmail}`);
    } else {
      console.log('⚠️ No provider email found for:', { providerRole, providerName: newAppt.providerName });
    }
  } catch (err) {
    console.error('❌ Failed to send provider email:', err.message);
  }
  
  res.json({ success: true, appointment: newAppt, message: 'Appointment booked and doctor notified' });
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

  // If appointment status changed, send appropriate notifications
  (async () => {
    try {
      const appt = data.appointments[idx];
      const patientPhone = appt.patientPhone;
      const patientEmail = appt.patientEmail;
      
      // Send notifications based on status change
      if (updates && updates.status) {
        const newStatus = updates.status.toLowerCase();
        
        // Send SMS if status changed to Confirmed, Approved, or Rejected and we have Twilio configured
        if ((newStatus === 'confirmed' || newStatus === 'approved' || newStatus === 'rejected') && patientPhone && twilioClient && process.env.TWILIO_FROM) {
          let body = `Your appointment on ${appt.date} at ${appt.time} with ${appt.providerName} is ${updates.status}.`;
          if (updates.notes) body += ` Reason: ${updates.notes}`;
          await twilioClient.messages.create({ body, from: process.env.TWILIO_FROM, to: patientPhone });
          console.log('SMS sent to patient', patientPhone);
        }
        
        // Send email notifications using email service
        if (patientEmail) {
          if (newStatus === 'approved') {
            // Send approval email and SIMS notification
            await sendApprovalToPatient(patientEmail, appt);
            await sendAppointmentApprovalViaSims(patientEmail, appt);
            console.log('Approval email and SIMS notification sent to patient', patientEmail);
          } else if (newStatus === 'rejected') {
            // Send rejection email and SIMS notification
            await sendRejectionToPatient(patientEmail, appt, updates.notes);
            await sendAppointmentRejectionViaSims(patientEmail, appt, updates.notes);
            console.log('Rejection email and SIMS notification sent to patient', patientEmail);
          } else if (newStatus === 'confirmed') {
            // Send confirmation email (generic update)
            await sendApprovalToPatient(patientEmail, appt);
            console.log('Confirmation email sent to patient', patientEmail);
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

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 CSU Clinic server listening on port ${PORT}`);
  console.log(`📧 Test email route: http://localhost:${PORT}/test-email`);
});