import { useState } from "react";
import {
  FiArrowLeft,
  FiHome,
  FiFilter,
  FiUserCheck,
  FiBarChart2,
  FiDatabase,
} from "react-icons/fi";

/**
 * Slim, inspo-matching Sidebar
 * - Keeps your profilePics array and logic
 * - Preserves currentPage, setCurrentPage, onLogout props/behavior
 * - Slim width (220px), dark-green background, white rounded profile card
 * - Yellow active highlight and subtle hover transitions
 */

const profilePics = [
  "/assets/PIC2.jpg",
  "/assets/PIC3.jpg",
  "/assets/PIC4.jpg",
  "/assets/PIC5.jpg",
  "/assets/PIC6.jpg",
  "/assets/PIC7.jpg",
  "/assets/PIC8.jpg",
];

// menu is built based on role
const getMenuForRole = (role) => {
  if (!role) return [];
  if (role === "CLIENT") {
    return [
      { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
      { id: "book", label: "Book Appointment", icon: <FiFilter /> },
      { id: "myappointments", label: "My Appointments", icon: <FiUserCheck /> },
    ];
  }
  if (role === "DENTIST" || role === "PHYSICIAN") {
    return [
      { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
      { id: "schedule", label: "Schedule", icon: <FiFilter /> },
      { id: "patients", label: "Patients", icon: <FiUserCheck /> },
      { id: "records", label: "Records", icon: <FiDatabase /> },
    ];
  }
  // fallback admin menu
  return [
    { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
    { id: "patients", label: "Patients", icon: <FiUserCheck /> },
  ];
};

const Sidebar = ({ currentPage, setCurrentPage, onLogout, user }) => {
  const [selectedPic, setSelectedPic] = useState(profilePics[0]);
  const [showPicOptions, setShowPicOptions] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [logoutHover, setLogoutHover] = useState(false);

  // Colors & sizes (kept as JS constants for easy tweaks)
  const COLORS = {
    greenDark: "#0B4F36",
    yellowAccent: "#F9C300",
    white: "#FFFFFF",
    textDark: "#1F2937",
    mutedText: "#6B7280",
    menuBgHover: "rgba(255,255,255,0.12)",
    menuBgActive: "#F9C300",
  };

  const styles = {
    container: {
      width: 220,
      minWidth: 220,
      maxWidth: 220,
      height: "100vh",
      background: COLORS.greenDark,
      padding: 20,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
      fontFamily:
        "Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    },
    profileCard: {
      background: COLORS.white,
      padding: 16,
      borderRadius: 16,
      textAlign: "center",
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    },
    avatarWrap: {
      width: 68,
      height: 68,
      borderRadius: "50%",
      overflow: "hidden",
      margin: "0 auto 10px",
      border: `3px solid ${COLORS.yellowAccent}`,
      cursor: "pointer",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    adminText: {
      color: COLORS.textDark,
      fontWeight: 700,
      fontSize: 15,
      margin: 0,
    },
    roleText: {
      color: COLORS.mutedText,
      fontSize: 12,
      margin: "6px 0 0",
    },
    picsGrid: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    picSmall: (isSelected) => ({
      width: 36,
      height: 36,
      borderRadius: "50%",
      overflow: "hidden",
      border: isSelected
        ? `2px solid ${COLORS.yellowAccent}`
        : "1px solid rgba(0,0,0,0.08)",
      cursor: "pointer",
    }),
    nav: {
      flex: 1,
      overflowY: "auto",
      paddingRight: 6,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    menuTitle: {
      color: "rgba(255,255,255,0.92)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      paddingLeft: 6,
    },
    menuButton: (active, hovered) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 12,
      background: active
        ? COLORS.menuBgActive
        : hovered
        ? COLORS.menuBgHover
        : "transparent",
      color: active ? COLORS.textDark : COLORS.white,
      border: "none",
      cursor: "pointer",
      textAlign: "left",
      fontSize: 14,
      fontWeight: active ? 700 : 600,
      transition: "all 180ms ease",
      transform: hovered && !active ? "translateX(4px)" : "none",
      boxShadow: active ? "0 6px 14px rgba(0,0,0,0.12)" : "none",
    }),
    iconSpan: (active) => ({
      fontSize: 18,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      color: active ? COLORS.textDark : COLORS.white,
    }),
    logoutWrap: {
      paddingTop: 6,
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    logoutButton: (hovered) => ({
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      color: COLORS.white,
      border: "none",
      background: hovered ? "rgba(255,255,255,0.08)" : "transparent",
      cursor: "pointer",
      fontWeight: 700,
      borderRadius: 10,
      transition: "background 150ms ease",
    }),
  };

  return (
    <aside style={styles.container} aria-label="Sidebar">
      {/* PROFILE CARD */}
      <div style={styles.profileCard}>
        <div
          style={styles.avatarWrap}
          onClick={() => setShowPicOptions((s) => !s)}
          title="Change profile picture"
        >
          <img src={selectedPic} alt="profile" style={styles.avatarImg} />
        </div>

        <h3 style={styles.adminText}>{user?.name ?? "User"}</h3>
        <p style={styles.roleText}>{user?.role ?? "ADMIN"}</p>

        {showPicOptions && (
          <div style={styles.picsGrid}>
            {profilePics.map((pic, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedPic(pic);
                  setShowPicOptions(false);
                }}
                style={styles.picSmall(selectedPic === pic)}
                title={`Profile ${idx + 1}`}
              >
                <img
                  src={pic}
                  alt={`profile-${idx}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAV */}
      <nav style={styles.nav} aria-label="Main menu">
        <div style={styles.menuTitle}>Main</div>

        {getMenuForRole(user?.role).map((item) => {
          const active = currentPage === item.id;
          const hovered = hoveredMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              onMouseEnter={() => setHoveredMenu(item.id)}
              onMouseLeave={() => setHoveredMenu(null)}
              style={styles.menuButton(active, hovered)}
              aria-current={active ? "page" : undefined}
            >
              <span style={styles.iconSpan(active)}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div style={styles.logoutWrap}>
        <button
          onClick={onLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={styles.logoutButton(logoutHover)}
        >
          <FiArrowLeft />
          <span style={{ fontSize: 13 }}>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
