import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    company: "",
    job_title: "",
    linkedin: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const register = async () => {
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = authData?.user;

    if (!user) {
      alert("Signup failed: no user returned");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: user.id,
        name: form.name,
        email: form.email,
        role: form.role,
        company: form.company || null,
        job_title: form.job_title || null,
        linkedin: form.linkedin || null,
        is_approved: false
      }
    ]);

    if (insertError) {
      alert("Error saving user: " + insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    alert("Registered! Wait for admin approval");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Register</h2>

        <input
          style={styles.input}
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div style={{ position: "relative", width: "100%" }}>
          <input
            style={{ ...styles.input, paddingRight: "40px" }}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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

        <select
          style={styles.input}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="student">Student</option>
          <option value="alumni">Alumni</option>
        </select>

        {form.role === "alumni" && (
          <>
            <input
              style={styles.input}
              placeholder="Company"
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Job Title"
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="LinkedIn URL"
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
          </>
        )}

        <button style={styles.button} onClick={register} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p style={styles.link} onClick={() => (window.location = "/")}>
          Already have an account? Login
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
    background: "linear-gradient(to right, #16a34a, #15803d)",
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
