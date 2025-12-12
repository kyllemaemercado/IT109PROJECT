import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import google from "googleapis"; // Correct for ES Modules
import dotenv from "dotenv";
import twilio from "twilio";

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

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// --- TWILIO SETUP ---
const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
    await smsClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    res.json({ message: "SMS sent to patient successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SMS sending failed" });
  }
});

// --- START SERVER ---
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
