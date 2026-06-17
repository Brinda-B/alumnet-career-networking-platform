import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminJobs() {

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);

  const userId = localStorage.getItem("user");

  const fetchJobs = async () => {

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setJobs(data || []);
  };

  const fetchApplicants = async (jobId) => {

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        created_at,
        users (
          id,
          name,
          email,
          company,
          job_title
        )
      `)
      .eq("job_id", jobId);

    if (error) {
      console.log(error);
      return;
    }

    setApplications(data || []);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div style={styles.container}>

      <h1>📊 Admin Jobs Panel</h1>

      <div style={styles.grid}>

        {jobs.map((job) => (
          <div
            key={job.id}
            style={styles.card}
            onClick={() => {
              setSelectedJob(job);
              fetchApplicants(job.id);
            }}
          >

            <h2>{job.title}</h2>
            <p>{job.company}</p>
            <p>{job.location}</p>

            <button style={styles.button}>
              View Applicants
            </button>

          </div>
        ))}

      </div>

      {selectedJob && (
        <div style={styles.applicantBox}>

          <h2>
            Applicants for: {selectedJob.title}
          </h2>

          {applications.length === 0 ? (
            <p>No applicants yet</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} style={styles.applicantCard}>

                <h3>{app.users?.name}</h3>
                <p>{app.users?.email}</p>
                <p><b>Company:</b> {app.users?.company}</p>
                <p><b>Job:</b> {app.users?.job_title}</p>

                <p>
                  <b>Status:</b> {app.status}
                </p>

              </div>
            ))
          )}

        </div>
      )}

    </div>
  );
}

const styles = {

  container: {
    padding: "40px",
    fontFamily: "Arial",
    background: "#f9fafb",
    minHeight: "100vh"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px"
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    cursor: "pointer"
  },

  button: {
    marginTop: "10px",
    padding: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px"
  },

  applicantBox: {
    marginTop: "30px",
    padding: "20px",
    background: "white",
    borderRadius: "12px"
  },

  applicantCard: {
    padding: "15px",
    borderBottom: "1px solid #eee"
  }
};