import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar"; // 👈 We added the Navbar here!

export default function AdminDashboard() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.assign("/");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

         if (!profile) {
      window.location = "/";
      return;
    }

      if (profile?.role !== "admin") {
        window.location = "/dashboard";
        return;
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

       const { data, error } = await supabase
      .from("users")
      .select("*")
      .neq("role", "admin")                
      .order("role", { ascending: true }); 

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const approveUser = async (id) => {
    await supabase
      .from("users")
      .update({ is_approved: true })
      .eq("id", id);

    fetchUsers();
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Delete this user?");
    if (!confirmDelete) return;

    await supabase
      .from("users")
      .delete()
      .eq("id", id);

    fetchUsers();
  };

  return (
    <>
      <Navbar /> {/* 👈 The sleek Navbar with the Black Logout button is now here! */}
      
      <div style={styles.container}>

        <div style={styles.header}>
          <h2>🎓 CAIAS Admin Panel</h2>
          {/* 👈 The old logout button has been completely deleted! */}
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: "center" }}>No users found</p>
        ) : (
          users.map((u) => (
            <div key={u.id} style={styles.card}>

              <div>
                <h3>{u.name}</h3>
                <p style={styles.email}>{u.email}</p>

                <p><b>Role:</b> {u.role}</p>

                <p>
                  <b>Status:</b>{" "}
                  <span style={{
                    color: u.is_approved ? "green" : "orange",
                    fontWeight: "bold"
                  }}>
                    {u.is_approved ? "Approved" : "Pending"}
                  </span>
                </p>
              </div>

              <div style={styles.actions}>

                {!u.is_approved && (
                  <button
                    style={styles.approve}
                    onClick={() => approveUser(u.id)}
                  >
                    Approve
                  </button>
                )}

                {u.role !== "admin" && (
                  <button
                    style={styles.delete}
                    onClick={() => deleteUser(u.id)}
                  >
                    Delete
                  </button>
                )}

              </div>

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
    minHeight: "100vh",
    background: "linear-gradient(to right, #eff6ff, #f8fafc)",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    background: "white",
    padding: "20px 30px",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    padding: "25px",
    marginBottom: "20px",
    borderRadius: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },
  email: {
    color: "#6b7280",
    fontSize: "14px"
  },
  actions: {
    display: "flex",
    gap: "12px"
  },
  approve: {
    padding: "10px 16px",
    background: "linear-gradient(to right, #16a34a, #15803d)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  delete: {
    padding: "10px 16px",
    background: "linear-gradient(to right, #dc2626, #b91c1c)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  }
};
