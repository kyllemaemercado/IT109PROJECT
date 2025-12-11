require('dotenv').config();
const nodemailer = require('nodemailer');

// Validate environment variables on startup
const validateEmailConfig = () => {
  const required = ['SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing email configuration in .env:', missing);
    return false;
  }
  
  console.log('✅ Email configuration loaded:', process.env.SMTP_USER);
  return true;
};

// Create transporter with better configuration
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      tls: {
        rejectUnauthorized: false
      },
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
    });

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
      } else {
        console.log('✅ SMTP Server is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Initialize
const isConfigValid = validateEmailConfig();
const transporter = createTransporter();

/**
 * Improved email sending with retry logic
 */
const sendEmail = async (mailOptions, retries = 3) => {
  if (!transporter) {
    console.error('❌ Email transporter not initialized');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Sending email attempt ${attempt}/${retries}...`);
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('❌ All email attempts failed');
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * Send appointment notification email to provider
 */
const sendAppointmentToProvider = async (providerEmail, appointment) => {
  try {
    if (!providerEmail) {
      throw new Error('Provider email is required');
    }

    const mailOptions = {
      from: {
        name: 'CSU Clinic System',
        address: process.env.SMTP_FROM
      },
      to: providerEmail,
      subject:`📅 New Appointment: ${appointment.patientName}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #0B4F36; margin: 0 0 20px 0;">New Appointment Booking</h2>
            
            <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>👤 Patient Name:</strong> ${appointment.patientName}</p>
              <p><strong>📧 Email:</strong> ${appointment.patientEmail}</p>
              <p><strong>📱 Phone:</strong> ${appointment.patientPhone}</p>
            </div>

            <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>📆 Date:</strong> ${appointment.date}</p>
              <p><strong>🕐 Time:</strong> ${appointment.time}</p>
              <p><strong>🏥 Type:</strong> ${appointment.providerRole}</p>
            </div>

            <div style="border-top: 2px solid #E5E7EB; padding-top: 20px;">
              <p style="color: #6B7280;">Please review this appointment and approve or reject it in the system.</p>
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" style="background: #0B4F36; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View in Dashboard</a>
            </div>

            <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
              This is an automated message from CSU Clinic Appointment System
            </p>
          </div>
        </div>
      `,
    };

    return await sendEmail(mailOptions);
  } catch (err) {
    console.error('❌ Failed to send email to provider:', err.message);
    throw err;
  }
};

/**
 * Send appointment approval confirmation email to patient
 */
const sendApprovalToPatient = async (patientEmail, appointment) => {
  try {
    const mailOptions = {
      from: {
        name: 'CSU Clinic System',
        address: process.env.SMTP_FROM
      },
      to: patientEmail,
      subject:`✅ Appointment Approved: ${appointment.date} at ${appointment.time}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #0B4F36; margin: 0 0 20px 0;">Appointment Approved! 🎉</h2>
            
            <div style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0B4F36;">
              <p style="margin: 0; font-size: 16px;">
                Your appointment has been <strong>approved</strong> by ${appointment.providerName}.
              </p>
            </div>

            <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #0B4F36; margin-top: 0;">Appointment Details</h3>
              <p><strong>👤 Patient Name:</strong> ${appointment.patientName}</p>
              <p><strong>👨‍⚕️ Provider:</strong> ${appointment.providerName} (${appointment.providerRole})</p>
              <p><strong>📆 Date:</strong> ${appointment.date}</p>
              <p><strong>🕐 Time:</strong> ${appointment.time}</p>
              <p><strong>📍 Location:</strong> CSU Main Clinic, Main Campus</p>
            </div>

            <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin-top: 0; color: #ff9800;">📋 Important Reminders:</h4>
              <ul style="margin-bottom: 0;">
                <li>Arrive 15 minutes before your scheduled time</li>
                <li>Bring your CSU ID and any medical records</li>
                <li>Wear appropriate clothing for examination</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/my-appointments" style="background: #0B4F36; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Your Appointments</a>
            </div>

            <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px; text-align: center;">
              Need to reschedule or cancel? Contact the clinic at clinic@csu.edu.ph
            </p>
          </div>
        </div>
      `,
    };

    return await sendEmail(mailOptions);
  } catch (err) {
    console.error('❌ Failed to send approval email:', err.message);
    throw err;
  }
};

/**
 * Send appointment rejection email to patient
 */
const sendRejectionToPatient = async (patientEmail, appointment, reason = '') => {
  try {
    const mailOptions = {
      from: {
        name: 'CSU Clinic System',
        address: process.env.SMTP_FROM
      },
      to: patientEmail,
      subject: `❌ Appointment Rejected: ${appointment.date} at ${appointment.time}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #d32f2f; margin: 0 0 20px 0;">Appointment Rejected</h2>
            
            <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #d32f2f;">
              <p style="margin: 0; font-size: 16px;">
                Your appointment with ${appointment.providerName} has been <strong>rejected</strong>.
              </p>
            </div>

            <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #0B4F36; margin-top: 0;">Appointment Details</h3>
              <p><strong>👤 Patient Name:</strong> ${appointment.patientName}</p>
              <p><strong>👨‍⚕️ Provider:</strong> ${appointment.providerName} (${appointment.providerRole})</p>
              <p><strong>📆 Date:</strong> ${appointment.date}</p>
              <p><strong>🕐 Time:</strong> ${appointment.time}</p>
            </div>

            ${reason ? `
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin-top: 0; color: #f57c00;">📝 Reason for Rejection:</h4>
              <p style="margin-bottom: 0;">${reason}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <p style="margin-bottom: 15px;">You can book a new appointment at a different time:</p>
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/book-appointment" style="background: #0B4F36; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Book New Appointment</a>
            </div>

            <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px; text-align: center;">
              For questions, contact the clinic at clinic@csu.edu.ph
            </p>
          </div>
        </div>
      `,
    };

    return await sendEmail(mailOptions);
  } catch (err) {
    console.error('❌ Failed to send rejection email:', err.message);
    throw err;
  }
};

/**
 * QUICK TEST FUNCTION (for debugging)
 */
const sendTestEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: toEmail || process.env.SMTP_USER,
      subject: 'Test from CSU Clinic API',
      text: 'This is a test email from your Node.js API.',
      html: '<h2>✅ Email API is working!</h2><p>This confirms your setup is correct.</p>'
    };

    const result = await sendEmail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ✅ CORRECT EXPORTS (AFTER ALL FUNCTIONS ARE DEFINED)
module.exports = {
  transporter,
  sendAppointmentToProvider,
  sendApprovalToPatient,
  sendRejectionToPatient,
  sendTestEmail,
  validateEmailConfig
};