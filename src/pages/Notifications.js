import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../utils/auth";

export default function Notifications() {

  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

useEffect(() => {
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (data?.user?.id) {
      setUserId(data.user.id);
    }
  };

  getUser();
}, []);

useEffect(() => {
  const init = async () => {
    const user = await getCurrentUser();
    if (user) setUserId(user.id);
  };

  init();
}, []);

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

  const markAsRead = async (id) => {

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    fetchNotifications();
  };

  useEffect(() => {
  if (userId) {
    fetchNotifications();
  }
}, [userId]);

  return (
    <div style={styles.container}>

      <h1>🔔 Notifications</h1>

      {notifications.length === 0 ? (
        <p>No notifications yet</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            style={{
              ...styles.card,
              background: n.is_read ? "#f3f4f6" : "#ffffff"
            }}
          >

            <p>{n.message}</p>

            <small>
              {new Date(n.created_at).toLocaleString()}
            </small>

            {!n.is_read && (
              <button
                style={styles.button}
                onClick={() => markAsRead(n.id)}
              >
                Mark as read
              </button>
            )}

          </div>
        ))
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

  card: {
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  button: {
    marginTop: "10px",
    padding: "8px 12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};