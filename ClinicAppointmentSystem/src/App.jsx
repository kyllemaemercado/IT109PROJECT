import { useState, useEffect } from "react";
import RejectionModal from './RejectionModal';
import LoginPage from "./LoginPage";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import BookAppointment from "./BookAppointment";
import MyAppointments from "./MyAppointments";
import Patients from "./Patients";
import AdminDataAnalysis from "./AdminDataAnalysis";

const App = () => {
  // store user object { username, name, role }
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  // appointments state for the clinic system
  const [appointments, setAppointments] = useState([
    {
      id: "A-1001",
      patientName: "Kylle Cruz",
      providerRole: "DENTIST",
      providerName: "Dr. Santos",
      date: "2025-12-03",
      time: "09:00",
      status: "Scheduled",
    },
    {
      id: "A-1002",
      patientName: "Kim Mongado",
      providerRole: "PHYSICIAN",
      providerName: "Dr. Reyes",
      date: "2025-12-04",
      time: "10:30",
      status: "Scheduled",
    },
  ]);
  const [currentBatchName, setCurrentBatchName] = useState(""); // Track active batch
  // centralized status / modal / toast for appointment actions
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [toast, setToast] = useState({ message: '', visible: false });

  // Login
  const handleLogin = (userObj) => setUser(userObj);
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return setAppointments([]);
      try {
        const q = new URLSearchParams();
        q.set('role', user.role);
        if (user.role === 'CLIENT') q.set('name', user.name);
        const res = await fetch(`http://localhost:4000/api/appointments?${q.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setAppointments(data.appointments);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, [user]);

  const showToast = (msg, ms = 3000) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), ms);
  }

  const updateAppointment = async (id, updates) => {
    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error('Failed to update appointment');
      const data = await res.json();
      setAppointments((prev) => (prev || []).map((a) => (a.id === id ? data.appointment : a)));
      showToast('Appointment updated');
      return data.appointment;
    } catch (err) {
      console.error(err);
      showToast('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setAppointments((prev) => (prev || []).filter((a) => a.id !== id));
      showToast('Appointment deleted');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete appointment');
      throw err;
    }
  };

  const openRejectModal = (id) => {
    setRejectionTarget(id);
    setRejectionModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectionModalOpen(false);
    setRejectionTarget(null);
  };

  const rejectAppointment = async (id, reason) => {
    try {
      await updateAppointment(id, { status: 'Rejected', notes: reason });
      closeRejectModal();
    } catch (err) {
      console.error(err);
    }
  };

  const approveAppointment = async (id) => {
    try {
      await updateAppointment(id, { status: 'Approved' });
    } catch (err) { console.error(err); }
  };

  const cancelAppointment = async (id) => {
    try {
      await updateAppointment(id, { status: 'Cancelled' });
    } catch (err) { console.error(err); }
  };

  // Save batch + date & time
  const addBatch = (batchName, fileName, studentList) => {
    const approved = studentList.filter((s) => s.status === "Approved").length;
    const rejected = studentList.filter((s) => s.status === "Rejected").length;

    const now = new Date();

    const newBatch = {
      name: batchName,
      fileName,
      students: studentList,
      total: studentList.length,
      approved,
      rejected,
      rate:
        studentList.length > 0
          ? `${Math.round((approved / studentList.length) * 100)}%`
          : "0%",
      status: approved > 0 ? "Completed" : "Processing",
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setBatches((prev) => [...prev, newBatch]);
    setCurrentBatchName(batchName); // Update current batch
  };

  const handleStudentSubmit = (formData) => {
    // Use the current batch name from FilterData
    const batchName = currentBatchName || `Batch ${batches.length + 1}`;
    const gpa = parseFloat(formData.gpa);
    const income = parseInt(formData.parentIncome);

    const status =
      (gpa <= 1.25 && income <= 40000) || (gpa <= 3.0 && income <= 25000)
        ? "Approved"
        : "Rejected";

    const newStudent = {
      id: formData.schoolId,
      name: `${formData.firstName} ${formData.lastName}`,
      gpa,
      income,
      need: income <= 10000 ? "High" : income <= 25000 ? "Medium" : "Low",
      status,
      college: formData.college,
      program: formData.program,
      year: formData.yearLevel,
      batch: batchName,
    };

    // Add to students state
    setStudents((prev) => [...prev, newStudent]);

    // **Update existing batch if exists, else create new**
    setBatches((prev) => {
      const batchIndex = prev.findIndex((b) => b.name === batchName);
      if (batchIndex >= 0) {
        // Update existing batch
        const updatedBatch = { ...prev[batchIndex] };
        updatedBatch.students = [...updatedBatch.students, newStudent];
        updatedBatch.total = updatedBatch.students.length;
        updatedBatch.approved = updatedBatch.students.filter(
          (s) => s.status === "Approved"
        ).length;
        updatedBatch.rejected = updatedBatch.students.filter(
          (s) => s.status === "Rejected"
        ).length;
        updatedBatch.rate =
          updatedBatch.students.length > 0
            ? `${Math.round(
                (updatedBatch.approved / updatedBatch.students.length) * 100
              )}%`
            : "0%";
        updatedBatch.status =
          updatedBatch.approved > 0 ? "Completed" : "Processing";

        const newBatches = [...prev];
        newBatches[batchIndex] = updatedBatch;
        return newBatches;
      } else {
        // Create new batch if it doesn't exist
        const now = new Date();
        return [
          ...prev,
          {
            name: batchName,
            fileName: "Manual Entry",
            students: [newStudent],
            total: 1,
            approved: status === "Approved" ? 1 : 0,
            rejected: status === "Rejected" ? 1 : 0,
            rate: status === "Approved" ? "100%" : "0%",
            status: "Completed",
            date: now.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      }
    });

    setShowForm(false);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        user={user}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <main style={{ flex: 1, overflow: "auto" }}>
          {currentPage === "dashboard" && (
            <Dashboard
              batches={batches}
              setBatches={setBatches}
              user={user}
              appointments={appointments}
              setAppointments={setAppointments}
              onUpdateAppointment={updateAppointment}
              onDeleteAppointment={deleteAppointment}
              onOpenRejectModal={openRejectModal}
              onApproveAppointment={approveAppointment}
              onCancelAppointment={cancelAppointment}
            />
          )}

          {currentPage === "filter" && (
            <FilterData
              students={students}
              setStudents={setStudents}
              addBatch={addBatch}
              batchNumber={batches.length + 1}
              setBatches={setBatches}
              currentBatchName={currentBatchName}
              setCurrentBatchName={setCurrentBatchName}
              onStudentAdd={handleStudentSubmit}
            />
          )}

          {currentPage === "eligible" && <EligibleStudents batches={batches} />}

          {currentPage === "records" && <BatchRecords batches={batches} />}

          {currentPage === "book" && (
            <BookAppointment
              user={user}
              onBook={(appt) => setAppointments((prev) => [...prev, appt])}
            />
          )}

          {currentPage === "myappointments" && (
            <MyAppointments
              user={user}
              appointments={appointments}
              setAppointments={setAppointments}
              onUpdateAppointment={updateAppointment}
              onDeleteAppointment={deleteAppointment}
              onOpenRejectModal={openRejectModal}
              onApproveAppointment={approveAppointment}
              onCancelAppointment={cancelAppointment}
            />
          )}

          {currentPage === "schedule" && (
            <MyAppointments
              user={user}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          )}

          {currentPage === "patients" && (
            <Patients user={user} />
          )}

        {currentPage === "analysis" && <AdminDataAnalysis />}        </main>
      </div>

      {showForm && (
        <StudentForm
          onClose={() => setShowForm(false)}
          onSubmit={handleStudentSubmit}
        />
      )}
      {rejectionModalOpen && (
        <RejectionModal open={rejectionModalOpen} onClose={closeRejectModal} onSubmit={(note) => rejectAppointment(rejectionTarget, note)} />
      )}
      {/* Toast */}
      {toast.visible && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, background: '#0B4F36', color: 'white', padding: '10px 16px', borderRadius: 8, boxShadow: '0 3px 8px rgba(0,0,0,0.2)' }}>{toast.message}</div>
      )}
    </div>
  );
};

export default App;
