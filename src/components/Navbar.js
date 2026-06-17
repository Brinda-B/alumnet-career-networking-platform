import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("user");

  const currentPath = window.location.pathname;
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const fetchNotifications = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setNotifications(data || []);
  };

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    const channel = supabase
      .channel("navbar-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getLinkStyle = (path) => ({
    textDecoration: "none",
    color: currentPath === path ? "#1e3a8a" : "#64748b", 
    fontWeight: currentPath === path ? "bold" : "500",  
    borderBottom: currentPath === path ? "2px solid #1e3a8a" : "2px solid transparent", 
    paddingBottom: "4px"
  });

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}>🎓 CAIAS AlumNet </div>

      <div style={styles.right}>
        <a href="/dashboard" style={getLinkStyle("/dashboard")}>Dashboard</a>
        <a href="/jobs" style={getLinkStyle("/jobs")}>Jobs</a>
        <a href="/events" style={getLinkStyle("/events")}>Events</a>
        <a href="/applications" style={getLinkStyle("/applications")}>Applications</a>

        <div style={styles.bellContainer}>
          <span style={styles.bell}>🔔</span>
          {notifications.length > 0 && (
            <span style={styles.badge}>
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </div>

        
        <button 
          onClick={handleLogout}
          style={{
            background: "#0f172a",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            marginLeft: "15px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          Log Out
        </button>

      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "white",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1e3a8a"
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "24px" 
  },
  bellContainer: {
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    marginLeft: "10px"
  },
  bell: {
    fontSize: "22px"
  },
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-8px",
    background: "white",
    color: "#1e3a8a",
    borderRadius: "50%",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    border: "2px solid #1e3a8a",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }
};
