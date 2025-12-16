require("dotenv").config();
const nodemailer = require("nodemailer");

// Validate environment variables on startup
const validateEmailConfig = () => {
  const required = ["SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing email configuration in .env:", missing);
    return false;
  }

  console.log("✅ Email configuration loaded:", process.env.SMTP_USER);
  return true;
};

// Create transporter with better configuration
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
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
        rejectUnauthorized: false,
      },
      logger: process.env.NODE_ENV === "development",
      debug: process.env.NODE_ENV === "development",
    }); // Verify connection configuration

    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP Connection Error:", error.message);
      } else {
        console.log("✅ SMTP Server is ready to send messages");
      }
    });

    return transporter;
  } catch (error) {
    console.error("❌ Failed to create email transporter:", error.message);
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
    console.error("❌ Email transporter not initialized");
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Sending email attempt ${attempt}/${retries}...`);
      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error("❌ All email attempts failed");
        throw error;
      } // Wait before retrying (exponential backoff)

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * Send appointment notification email to provider (FORMAL MESSAGE)
 */
const sendAppointmentToProvider = async (providerEmail, appointment) => {
  try {
    if (!providerEmail) {
      throw new Error("Provider email is required");
    } // --- IMPLEMENTING YOUR REQUIRED FORMAL MESSAGE ---

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Dear ${appointment.providerName},</p>
        <p>A patient has booked an appointment and requires your review.</p>
        <div style="border: 1px solid #e0e0e0; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Patient:</strong> ${appointment.patientName}</p>
          <p><strong>Date & Time:</strong> ${appointment.date} at ${appointment.time}</p>
        </div>
        <p>Please log in to the CCAS webpage to check the details and update the status.</p>
        <p>Sincerely,</p>
        <p>CSU Clinic Appointment System</p>
      </div>
    `;

    const mailOptions = {
      from: {
        name: "CSU Clinic System",
        address: process.env.SMTP_FROM,
      },
      to: providerEmail,
      subject: `New Appointment Request: ${appointment.patientName} (${appointment.date})`,
      html: htmlContent,
    };

    return await sendEmail(mailOptions);
  } catch (err) {
    console.error("❌ Failed to send email to provider:", err.message);
    throw err;
  }
};

/**
 * QUICK TEST FUNCTION (for debugging) - kept for utility
 */
const sendTestEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: toEmail || process.env.SMTP_USER,
      subject: "Test from CSU Clinic API",
      text: "This is a test email from your Node.js API.",
      html: "<h2>✅ Email API is working!</h2><p>This confirms your setup is correct.</p>",
    };

    const result = await sendEmail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ✅ FINAL CORRECT EXPORTS
module.exports = {
  transporter,
  sendAppointmentToProvider,
  sendTestEmail,
  validateEmailConfig,
};
