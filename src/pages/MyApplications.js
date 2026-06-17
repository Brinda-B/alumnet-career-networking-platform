import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function MyApplications() {

  const [applications, setApplications] = useState([]);
  const userId = localStorage.getItem("user");

  const fetchApplications = async () => {

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        created_at,
        jobs (
          id,
          title,
          company,
          location,
          description
        )
      `)
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setApplications(data || []);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <>
      <Navbar />

      <div style={styles.container}>

        <h1 style={{ marginBottom: "20px", color: "#1e3a8a", fontSize: "24px" }}>📄 My Applications</h1>

        {applications.length === 0 ? (
          <p style={{ color: "#64748b" }}>You haven't applied to any jobs yet.</p>
        ) : (
          applications.map((app) => (
            <div key={app.id} style={styles.card}>

              <h2 style={{ marginBottom: "8px" }}>{app.jobs?.title}</h2>

              <p><b>Company:</b> {app.jobs?.company}</p>
              <p><b>Location:</b> {app.jobs?.location}</p>

              <p style={{ marginTop: "10px" }}>
                <b>Status:</b>{" "}
                <span style={{
                  color: app.status === "applied" ? "orange" : "green",
                  fontWeight: "bold"
                }}>
                  {app.status}
                </span>
              </p>

              <p style={{ fontSize: "12px", color: "gray", marginTop: "10px" }}>
                Applied on: {new Date(app.created_at).toLocaleString()}
              </p>

            </div>
          ))
        )}

      </div>
    </>
  );
}

const styles = {

  container: {
    padding: "40px",
    fontFamily: "Inter, sans-serif", 
    background: "#f5f7fb",          
    minHeight: "100vh"
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",           
    marginBottom: "15px",
    border: "1px solid #e6eaf0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  }
};
