import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function Jobs() {

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
  const [applicantsList, setApplicantsList] = useState([]);

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    deadline: "",   
    apply_link: ""  
  });

  const userId = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
       .select(`
        *,
        users ( name )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setJobs(data || []);
    setLoading(false);
  };

  const postJob = async () => {
    if (!form.title || !form.description) {
      alert("Fill required fields");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .insert([
        {
          title: form.title,
          company: form.company,
          location: form.location,
          description: form.description,
          deadline: form.deadline || null,      
          apply_link: form.apply_link || null,  
          posted_by: userId
        }
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      title: "",
      company: "",
      location: "",
      description: "",
      deadline: "",
      apply_link: ""
    });

    fetchJobs();
  };

  const applyJob = async (job) => {
    const { error } = await supabase
      .from("job_applications")
      .insert([
        {
          job_id: job.id,
          applicant_id: userId,
          status: "applied"
        }
      ]);

    if (error) {
      alert("You might have already applied for this job!");
      return;
    }
    
    await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId, 
          message: `You successfully applied for: ${job.title}`,
          is_read: false
        }
      ]);

    if (job.posted_by) {
      
      const applicantType = role === "alumni" ? "An Alumni" : "A Student";

      await supabase
        .from("notifications")
        .insert([
          {
            user_id: job.posted_by, 
            message: `${applicantType} just applied for your job: ${job.title}!`,
            is_read: false
          }
        ]);
    }

    
    alert("Applied successfully!");

    if (job.apply_link) {
      let url = job.apply_link;
      if (!url.startsWith("http")) url = "https://" + url;
      window.open(url, "_blank");
    }
  };

  const deleteJob = async (jobId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job posting?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchJobs(); 
  };

  const fetchApplicants = async (jobId) => {

    if (viewingApplicantsFor === jobId) {
      setViewingApplicantsFor(null);
      setApplicantsList([]);
      return;
    }

    setViewingApplicantsFor(jobId);
    
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        created_at,
        users (
          name,
          email
        )
      `)
      .eq("job_id", jobId);

    if (error) {
      alert("Error fetching applicants. Check database relations.");
      return;
    }

    setApplicantsList(data || []);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <>
      <Navbar />

      <div style={styles.container}>

        <h1 style={{ color: "#1e3a8a", marginBottom: "20px", fontSize: "24px" }}>
          💼 Jobs & Internships
        </h1>

        {(role === "alumni" || role === "admin") && (
          <div style={styles.card}>

            <h2 style={{ marginBottom: "15px" }}>Post a Job</h2>

            <input
              style={styles.input}
              placeholder="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <div style={{ margin: "8px 0" }}>
              <label style={{ fontSize: "14px", color: "#64748b", display: "block", marginBottom: "4px" }}>Application Deadline:</label>
              <input
                type="date"
                style={{ ...styles.input, margin: 0 }}
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>

            <input
              style={styles.input}
              placeholder="External Application Link (Optional, e.g. google.com/jobs)"
              value={form.apply_link}
              onChange={(e) => setForm({ ...form, apply_link: e.target.value })}
            />

            <textarea
              style={{ ...styles.input, height: "80px", resize: "none" }}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <button style={styles.postBtn} onClick={postJob}>
              Post Job
            </button>

          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: "#64748b" }}>No jobs posted yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} style={styles.card}>

              <h2 style={{ marginBottom: "8px" }}>{job.title}</h2>
              
                            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                Posted by: <span style={{ color: "#2563eb", fontWeight: "bold" }}>
                  {job.posted_by === userId ? "Me" : (job.users?.name || "Alumni")}
                </span>
              </p>

              <p><b>Company:</b> {job.company}</p>
              <p><b>Location:</b> {job.location}</p>
              
              {job.deadline && (
                <p style={{ color: "#dc2626", fontWeight: "bold", fontSize: "13px", marginTop: "6px" }}>
                  ⏳ Deadline: {new Date(job.deadline).toLocaleDateString()}
                </p>
              )}

              <p style={{ marginTop: "12px", color: "#374151", lineHeight: "1.5", marginBottom: "10px" }}>
                {job.description}
              </p>

              {job.posted_by !== userId ? (
                <button
                  style={styles.applyBtn}
                  onClick={() => applyJob(job)} 
                >
                  {job.apply_link ? "Apply Externally 🔗" : "Apply Now"}
                </button>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "15px", flexWrap: "wrap" }}>
                    <span style={{ 
                      color: "#15803d", 
                      fontWeight: "bold",
                      background: "#dcfce7",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      border: "1px solid #bbf7d0"
                    }}>
                      ✓ Posted by You
                    </span>

                    <button 
                      onClick={() => fetchApplicants(job.id)}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      👥 {viewingApplicantsFor === job.id ? "Hide Applicants" : "View Applicants"}
                    </button>

                    <button 
                      onClick={() => deleteJob(job.id)}
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      🗑️ Delete Job
                    </button>
                  </div>

                  {viewingApplicantsFor === job.id && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <h3 style={{ fontSize: "15px", marginBottom: "12px", color: "#1e293b" }}>👥 Total Applicants ({applicantsList.length})</h3>
                      
                      {applicantsList.length === 0 ? (
                        <p style={{ fontSize: "14px", color: "#64748b" }}>No one has applied yet.</p>
                      ) : (
                        applicantsList.map(app => (
                          <div key={app.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "white", borderRadius: "8px", marginBottom: "8px", border: "1px solid #cbd5e1" }}>
                            <div>
                              <p style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{app.users?.name || "Unknown Student"}</p>
                              <p style={{ fontSize: "13px", color: "#64748b" }}>{app.users?.email}</p>
                            </div>
                            <p style={{ fontSize: "12px", color: "gray", alignSelf: "center" }}>
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

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
    padding: "24px",
    borderRadius: "14px",           
    marginBottom: "20px",
    border: "1px solid #e6eaf0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box"        
  },
  postBtn: {
    padding: "12px 20px",
    background: "linear-gradient(to right, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px"
  },
  applyBtn: {
    padding: "10px 20px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "15px"
  }
};
