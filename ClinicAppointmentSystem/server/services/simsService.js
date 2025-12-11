const axios = require('axios');

/**
 * SIMS API Service for sending messages to students/patients
 * This integrates with the SIMS (Student Information Management System)
 */

// Initialize SIMS API client
const simsAPI = axios.create({
  baseURL: process.env.SIMS_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SIMS_API_KEY || ''}`,
  },
  timeout: 5000,
});

/**
 * Send appointment approval message to student via SIMS
 * This sends a notification to the student's SIMS inbox/dashboard
 */
const sendAppointmentApprovalViaSims = async (studentEmail, appointment) => {
  try {
    if (!process.env.SIMS_API_URL || !process.env.SIMS_API_KEY) {
      console.log('⚠️ SIMS API not configured. Skipping SIMS notification.');
      return null;
    }

    const messagePayload = {
      recipient_email: studentEmail,
      message_type: 'appointment_approved',
      subject: `Appointment Approved: ${appointment.date}`,
      body: `Your appointment with ${appointment.providerName} (${appointment.providerRole}) has been approved for ${appointment.date} at ${appointment.time}. Please arrive 5 minutes early.`,
      appointment_id: appointment.id,
      appointment_details: {
        provider_name: appointment.providerName,
        provider_role: appointment.providerRole,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
      },
      timestamp: new Date().toISOString(),
    };

    const response = await simsAPI.post('/notifications/send', messagePayload);
    
    console.log('✅ SIMS notification sent successfully:', {
      studentEmail,
      messageId: response.data.id,
      timestamp: response.data.timestamp,
    });

    return response.data;
  } catch (err) {
    // Log error but don't fail the appointment approval
    console.error('⚠️ SIMS notification failed:', {
      studentEmail,
      error: err.message,
      status: err.response?.status,
    });
    return null;
  }
};

/**
 * Send appointment rejection message to student via SIMS
 */
const sendAppointmentRejectionViaSims = async (studentEmail, appointment, reason = '') => {
  try {
    if (!process.env.SIMS_API_URL || !process.env.SIMS_API_KEY) {
      console.log('⚠️ SIMS API not configured. Skipping SIMS notification.');
      return null;
    }

    const messagePayload = {
      recipient_email: studentEmail,
      message_type: 'appointment_rejected',
      subject: `Appointment Could Not Be Confirmed: ${appointment.date}`,
      body: `Unfortunately, your appointment with ${appointment.providerName} for ${appointment.date} at ${appointment.time} could not be confirmed.${reason ? ` Reason: ${reason}` : ''} Please book another appointment or contact the clinic for assistance.`,
      appointment_id: appointment.id,
      appointment_details: {
        provider_name: appointment.providerName,
        provider_role: appointment.providerRole,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        rejection_reason: reason,
      },
      timestamp: new Date().toISOString(),
    };

    const response = await simsAPI.post('/notifications/send', messagePayload);
    
    console.log('✅ SIMS rejection notification sent successfully:', {
      studentEmail,
      messageId: response.data.id,
      timestamp: response.data.timestamp,
    });

    return response.data;
  } catch (err) {
    console.error('⚠️ SIMS rejection notification failed:', {
      studentEmail,
      error: err.message,
      status: err.response?.status,
    });
    return null;
  }
};

/**
 * Check student status from SIMS
 */
const getStudentFromSims = async (studentEmail) => {
  try {
    if (!process.env.SIMS_API_URL || !process.env.SIMS_API_KEY) {
      console.log('⚠️ SIMS API not configured.');
      return null;
    }

    const response = await simsAPI.get(`/students/search?email=${studentEmail}`);
    return response.data;
  } catch (err) {
    console.error('⚠️ Failed to fetch student from SIMS:', err.message);
    return null;
  }
};

/**
 * Sync appointment to SIMS student record
 */
const syncAppointmentToStudentRecord = async (studentEmail, appointment) => {
  try {
    if (!process.env.SIMS_API_URL || !process.env.SIMS_API_KEY) {
      console.log('⚠️ SIMS API not configured. Skipping sync.');
      return null;
    }

    const syncPayload = {
      student_email: studentEmail,
      appointment: {
        id: appointment.id,
        provider_name: appointment.providerName,
        provider_role: appointment.providerRole,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        created_at: new Date().toISOString(),
      },
    };

    const response = await simsAPI.post('/students/sync-appointment', syncPayload);
    
    console.log('✅ Appointment synced to SIMS:', {
      studentEmail,
      appointmentId: appointment.id,
    });

    return response.data;
  } catch (err) {
    console.error('⚠️ Failed to sync appointment to SIMS:', err.message);
    return null;
  }
};

module.exports = {
  sendAppointmentApprovalViaSims,
  sendAppointmentRejectionViaSims,
  getStudentFromSims,
  syncAppointmentToStudentRecord,
};
