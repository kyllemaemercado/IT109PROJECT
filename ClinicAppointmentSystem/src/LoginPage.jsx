import { useState } from "react";
import bgImage from "./assets/PIC1.jpg";
import csuLogo from "./assets/csu-logo.png";

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        return alert(data.message || 'Login failed');
      }
      const { user } = await res.json();
      onLogin(user);
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!username || !password || !name) return alert('Please fill all fields.');
    try {
      const res = await fetch('http://localhost:4000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, role, email, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        return alert(data.message || 'Signup failed');
      }
      const data = await res.json();
      onLogin(data.user);
    } catch (err) {
      console.error(err);
      alert('Server not reachable');
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        // STRONGER GREEN TINT
        backgroundImage: `linear-gradient(rgba(8, 80, 8, 0.35), rgba(8, 80, 8, 0.35)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",

        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      {/* LEFT SIDE TEXT */}
      <div
        style={{
          flex: 1,
          color: "white",
          paddingLeft: "60px",
          transform: "translateY(-60px)",
        }}
      >
        <h1
          style={{
            fontSize: "70px",
            fontWeight: "900",
            color: "#0d7515ff",
            maxWidth: "500px",
            fontFamily: "Poppins, sans-serif",
            letterSpacing: "1px",
            lineHeight: "1.2",
            marginBottom: "18px",
            textShadow: 
                  "2px 2px 4px rgba(0, 0, 0, 0.9),  /* bright white glow */" +
                   "-2px -2px 4px rgba(255, 255, 255, 0.7)",
          }}
        >
          CSU CLINIC <br />
          APPOINTMENT SYSTEM
        </h1>

        <p
          style={{
            maxWidth: "430px",
            fontSize: "20px",
            lineHeight: "1.7",
            color: "white",
            fontFamily: "Poppins, sans-serif",
            marginTop: "10px",
            textShadow: "0px 0px 6px rgba(0,0,0,0.5)",
          }}
        >
               Trusted Care, Right on Campus!
          <br />
          Get the care you need, right here at CSU.
          Our friendly medic and staff is here to support your health and well-being.
          Whether you're feeling under the weather or just need a check-up for dental health, we're here for you.
        </p>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 15px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: "10px",
        maxWidth: "350px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)"
      }}>
      </div>
      {/* RIGHT SIDE – GLASS BOX */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "right",
        }}
      >
        <div
          style={{
            width: "450px", // WIDER BOX
            padding: "40px 35px",
            borderRadius: "20px",
            backdropFilter: "blur(22px)",
            background: "rgba(255, 255, 255, 0.20)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.28)",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            textAlign: "center",
            height: "auto", // Fit height to content
          }}
        >
          {/* LOGO */}
          <img
            src={csuLogo}
            alt="logo"
            style={{
              width: "90px",
              marginBottom: "10px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              filter: "brightness(1.3) contrast(1.3)",
            }}
          />

          <h2
            style={{
              color: "#66C06E",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "4px",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            WELCOME TO
          </h2>

          <h1
            style={{
              color: "white",
              fontSize: "30px",
              fontWeight: "900",
              marginBottom: "25px",
              letterSpacing: "1px",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            CSU CLINIC
          </h1>

          {/* FORM */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} style={{ textAlign: "left" }}>
            <label
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Username
            </label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: "10px",
                marginBottom: "18px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.8)",
                outline: "none",
                fontSize: "14px",
              }}
            />

            {isSignUp && (
              <>
                <label style={{ color: "white", fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Full Name</label>
                <input type="text" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: "10px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.8)", outline: "none", fontSize: "14px" }} />
                <label style={{ color: "white", fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Email</label>
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: "10px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.8)", outline: "none", fontSize: "14px" }} />
                <label style={{ color: "white", fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Phone</label>
                <input type="text" placeholder="Enter your phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: "10px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.8)", outline: "none", fontSize: "14px" }} />
              </>
            )}

            <label
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: "10px",
                marginBottom: "22px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.8)",
                outline: "none",
                fontSize: "14px",
              }}
            />

            <label style={{ color: "white", fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: "8px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.9)" }}>
              <option value="CLIENT">CLIENT</option>
              <option value="DENTIST">DENTIST</option>
              <option value="PHYSICIAN">PHYSICIAN</option>
              <option value="ADMIN">ADMIN</option>
              
            </select>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#62A55B",
                color: "white",
                border: "none",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#4F874A")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#62A55B")}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "15px",
              fontSize: "12px",
              color: "white",
              opacity: 0.85,
            }}
          >
          </p>
          <p style={{ textAlign: 'center', marginTop: 8 }}>
            {isSignUp ? (
              <>
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }} style={{ color: '#9DDFB4' }}>Sign In</a>
              </>
            ) : (
              <>
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }} style={{ color: '#9DDFB4' }}>Sign Up</a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
