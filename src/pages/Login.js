import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = authData?.user;

    if (!user) {
      alert("Login failed: no user returned");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      alert(profileError?.message || "Profile not found. Check Supabase RLS policies.");
      return;
    }

    if (!profile.is_approved) {
      alert("Wait for admin approval");
      return;
    }

    localStorage.setItem("user", user.id);
    localStorage.setItem("role", profile.role);

    if (profile.role === "admin") {
      window.location = "/admin";
    } else {
      window.location = "/dashboard";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Login</h2>

        <input
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div style={{ position: "relative", width: "100%" }}>
          <input
            style={{ ...styles.input, paddingRight: "40px" }}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "18px",
              userSelect: "none"
            }}
          >
            {showPassword ? "👁️" : "🙈"}
          </span>
        </div>

        <button style={styles.button} onClick={login}>
          Login
        </button>

        <p style={styles.link} onClick={() => (window.location = "/register")}>
          New user? Register
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(to right, #dbeafe, #f0f9ff)"
  },
  card: {
    background: "white",
    padding: "35px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    width: "340px",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
    boxSizing: "border-box" 
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(to right, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  link: {
    marginTop: "10px",
    color: "blue",
    cursor: "pointer"
  }
};
