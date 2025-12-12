// /server/services/smsService.js
const twilio = require("twilio");

// NOTE: We rely on the .env variables being loaded by index.js before this file is used.

/**
 * Ensures the phone number is in E.164 format (e.g., +63917xxxxxxx).
 * This is the function that converts '09...' to '+639...'.
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string} The phone number in E.164 format.
 */
const formatPhoneNumberE164 = (phoneNumber) => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters except for a leading plus sign
  let digits = phoneNumber.replace(/[^\d+]/g, "");

  // 1. If it starts with a plus, assume it's correctly formatted
  if (digits.startsWith("+")) {
    return digits;
  }

  // 2. If it starts with '0', remove it and prepend +63 (e.g., 0917 -> +63917)
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // 3. Prepend the +63 country code to the remaining digits
  return `+63${digits}`;
};

/**
 * Sends a generic SMS message via Twilio.
 * This function uses the formatter before sending the SMS.
 * @param {string} toPhoneNumber - The recipient's phone number.
 * @param {string} messageBody - The content of the SMS.
 * @returns {Promise<Object|null>} The Twilio result object or null on failure.
 */
const sendSmsMessage = async (toPhoneNumber, messageBody) => {
  // Read variables inside the function for reliable loading
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_FROM;

  try {
    if (!accountSid || !authToken || !twilioNumber) {
      console.log(
        "⚠️ Twilio SMS not fully configured (check .env). Skipping SMS."
      );
      return null;
    }

    // Initialize client ONLY after checking variables
    const client = twilio(accountSid, authToken);

    // 🔑 THE FIX: Apply E.164 formatting here
    const formattedToPhoneNumber = formatPhoneNumberE164(toPhoneNumber);

    // Check if the formatting was successful and the number looks valid
    if (!formattedToPhoneNumber || formattedToPhoneNumber.length < 10) {
      throw new Error(
        `Invalid formatted phone number: ${formattedToPhoneNumber}`
      );
    }

    const result = await client.messages.create({
      body: messageBody,
      from: twilioNumber,
      to: formattedToPhoneNumber, // Use the formatted number
    });

    console.log("✅ SMS sent successfully via Twilio:", {
      to: formattedToPhoneNumber,
      sid: result.sid,
    });
    return result;
  } catch (err) {
    console.error("⚠️ Twilio SMS failed:", {
      to: toPhoneNumber,
      error: err.message,
      status: err.status,
    });
    return null;
  }
};

/**
 * Helper function to format and send the appointment confirmation SMS
 */
const sendAppointmentConfirmationSms = async (phoneNumber, appointment) => {
  const body = `Approved! Your appointment with ${appointment.providerName} is confirmed for ${appointment.date} at ${appointment.time}. Please check your email for full details.`;
  return sendSmsMessage(phoneNumber, body);
};

/**
 * Helper function to format and send the appointment rejection SMS
 */
const sendAppointmentRejectionSms = async (phoneNumber, appointment) => {
  const body = `Rejected. Your appointment for ${appointment.date} at ${appointment.time} could not be confirmed. Please check your email for the reason or rebook.`;
  return sendSmsMessage(phoneNumber, body);
};

module.exports = {
  sendSmsMessage,
  sendAppointmentConfirmationSms,
  sendAppointmentRejectionSms,
};
