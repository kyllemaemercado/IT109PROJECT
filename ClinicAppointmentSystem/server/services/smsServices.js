/**
 * Ensures the phone number is in E.164 format (e.g., +63917xxxxxxx).
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string} The phone number in E.164 format.
 */
const formatPhoneNumberE164 = (phoneNumber) => {
  // ... (KEEP ALL EXISTING LOGIC HERE)
  if (!phoneNumber) return "";
  let digits = phoneNumber.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  return `+63${digits}`;
};
