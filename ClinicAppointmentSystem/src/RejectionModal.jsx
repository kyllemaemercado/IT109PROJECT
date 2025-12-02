import React, { useState } from 'react';

const RejectionModal = ({ open = false, onClose, onSubmit }) => {
  const [note, setNote] = useState('');
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ width: 400, background: 'white', borderRadius: 8, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Reject Appointment</h3>
        <p>Please include a reason for the rejection (optional):</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ background: '#6B7280', color: 'white', padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
          <button onClick={() => onSubmit(note)} style={{ background: '#E63946', color: 'white', padding: '8px 12px', borderRadius: 6 }}>Reject</button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
