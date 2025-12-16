import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import google from "googleapis"; // Correct for ES Modules
import dotenv from "dotenv";
import infobit from "infobit";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- GMAIL API SETUP ---
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_SENDER =
  process.env.INFOBIP_SENDER_ID || process.env.INFOBIP_SENDER;

if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_SENDER) {
  console.log("Infobip not configured: SMS notifications will be skipped.");
}

// --- INFOBIP SMS SENDING FUNCTION ---
const sendInfobipSMS = async (to, message) => {
  if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_SENDER) {
    return false; // Skip if not configured
  }

  try {
    const response = await fetch(`${INFOBIP_BASE_URL}/sms/2/text/single`, {
      method: "POST",
      headers: {
        // Correct header for Infobip API Key (as discussed)
        Authorization: `ApiKey ${INFOBIP_API_KEY}`,
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

    // Check for success status (Infobip uses status group ID 3 for 'Sent')
    if (response.ok && result.messages?.[0]?.status?.groupId === 3) {
      console.log(`✅ Infobip SMS Sent Successfully to ${to}.`);
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

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// --- SEND EMAIL TO MEDIC ---
app.post("/api/send-email", async (req, res) => {
  const { medicEmail, patientName, appointmentDate } = req.body;

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "kaasmongado@gmail.com",
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "Appointment System <kaasmongado@gmail.com>",
      to: medicEmail,
      subject: "New Appointment Request",
      html: `
        <h2>New Appointment Request</h2>
        <p>Patient: ${patientName}</p>
        <p>Date: ${appointmentDate}</p>
      `,
    };

    await transport.sendMail(mailOptions);
    res.json({ message: "Email sent to medic successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email sending failed" });
  }
});

// --- SEND SMS TO PATIENT ---
app.post("/api/send-sms", async (req, res) => {
  const { phoneNumber, status } = req.body;

  const message =
    status === "approved"
      ? "Your appointment has been APPROVED."
      : "Your appointment has been CANCELED.";

  try {
    // --- INFOBIP CALL ---
    const success = await sendInfobipSMS(phoneNumber, message);

    if (success) {
      res.json({ message: "SMS sent to patient successfully via Infobip" });
    } else {
      // If the function returns false (due to config or API error)
      res.status(500).json({ error: "Infobip SMS sending failed" });
    }
  } catch (error) {
    console.error("SMS route error:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during SMS sending" });
  }
});

// --- START SERVER ---
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
