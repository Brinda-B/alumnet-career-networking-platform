import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../utils/auth";

import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [alumni, setAlumni] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    company: "",
    job_title: "",
    linkedin: ""
  });

  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();

      if (!user) {
        window.location.assign("/");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser({ ...user, role: profile?.role });
      setMyProfile(profile);
    };

    init();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetch = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("users")
        .select("*")
        .in("role", ["student", "alumni"])
        .eq("is_approved", true)
        .neq("id", currentUser.id);

      setAlumni(data || []);
      setLoading(false);
    };

    fetch();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      fetchRequestStatus();
      fetchRequests();
      fetchUnreadCounts(); 
    }
  }, [currentUser]);

  const fetchUnreadCounts = async () => {
    if (!currentUser?.id) return;

    const { data } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", currentUser.id)
      .eq("is_read", false);

    const counts = {};
    data?.forEach((msg) => {
      counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
    });
    
    setUnreadCounts(counts);
  };

  const fetchRequestStatus = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase
      .from("chat_requests")
      .select("*")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (error) {
      console.log(error);
      return;
    }

    const statusMap = {};

    data?.forEach((r) => {
      const otherUserId =
        r.sender_id === currentUser.id ? r.receiver_id : r.sender_id;

      statusMap[otherUserId] = r.status;
    });

    setRequestStatus(statusMap);
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new;
          const currentChatUser = selectedUserRef.current;

          const isRelevant =
            msg.sender_id === currentUser.id ||
            msg.receiver_id === currentUser.id;

          if (!isRelevant) return;

          if (
            currentChatUser &&
            (msg.sender_id === currentChatUser.id ||
              msg.receiver_id === currentChatUser.id)
          ) {
            fetchMessages(currentChatUser.id);
          } else if (msg.receiver_id === currentUser.id) {
            alert("🔔 You received a new text message!");
            
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]); 

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchMessages = async (receiverId) => {
    if (!currentUser?.id) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setNotifications(data || []);
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const timeAgo = (timestamp) => {
    const date = new Date(timestamp.endsWith('Z') || timestamp.includes('+') ? timestamp : timestamp + 'Z');
    const diff = Math.floor((new Date() - date) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const fetchRequests = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase
      .from("chat_requests")
      .select("*")
      .eq("receiver_id", currentUser.id)
      .eq("status", "pending");

    if (error) {
      console.log(error);
      return;
    }

    const senderIds = data.map((r) => r.sender_id);

    const { data: senders } = await supabase
      .from("users")
      .select("id, name, email, role") 
      .in("id", senderIds);

    const requestsWithSender = data.map((r) => ({
      ...r,
      sender: senders?.find((s) => s.id === r.sender_id)
    }));

    setRequests(requestsWithSender || []);
  };

  const approveRequest = async (request) => {
    const { error } = await supabase
      .from("chat_requests")
      .update({
        status: "approved"
      })
      .eq("id", request.id);

    if (error) {
      console.log(error);
      return;
    }

     if (request.sender?.name) {
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", currentUser.id)
        .like("message", `%${request.sender.name}%`);
    }

    setSelectedUser(request.sender);
    fetchMessages(request.sender.id);
    fetchRequests();
    fetchRequestStatus();
    fetchNotifications();

    alert("Request approved!");
  };

  const rejectRequest = async (request) => {
    const { error } = await supabase
      .from("chat_requests")
      .update({ status: "rejected" })
      .eq("id", request.id);
    if (error) {
      console.log(error);
      return;
    }

     if (request.sender?.name) {
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", currentUser.id)
        .like("message", `%${request.sender.name}%`);
    }

    fetchRequests();
    fetchRequestStatus();
    fetchNotifications();
  };

  const markMessagesAsRead = async (senderId) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", senderId)
      .eq("receiver_id", currentUser.id);
      
    setUnreadCounts((prev) => ({ ...prev, [senderId]: 0 }));
  };

  const filteredAlumni = useMemo(() => {
    return alumni.filter((a) =>
      (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.company || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [alumni, search]);

   const updateProfile = async () => {
    const { error } = await supabase
      .from("users")
      .update({
        company: form.company,
        job_title: form.job_title
      })
      .eq("id", currentUser.id);

    if (error) {
      alert("Error updating profile: " + error.message);
      return;
    }
    setMyProfile({
      ...myProfile,
      company: form.company,
      job_title: form.job_title
    });

    setEditing(false);
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.layout}>
          
          <div style={styles.feed}>
            <div style={styles.header}>
              <h1 style={styles.title}>
                {currentUser.role === "student"
                  ? "Student Dashboard"
                  : "Alumni Dashboard"}
              </h1>
            </div>

            {myProfile && (
               editing ? (
                <div style={styles.editBox}>
                  <h3 style={{ marginBottom: "15px" }}>Edit Profile</h3>
                  <input
                    style={styles.input}
                    placeholder="Company (e.g. Microsoft)"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                  <input
                    style={styles.input}
                    placeholder="Job Title (e.g. Data Analyst)"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  />
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button style={styles.save} onClick={updateProfile}>
                      Save Changes
                    </button>
                    <button 
                      style={{ ...styles.edit, background: "#6b7280" }} 
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
              <div style={styles.profileCard}>
                <div>
                  <h2>{myProfile.name}</h2>
                  <p>{myProfile.email}</p>
                  <p><b>Company:</b> {myProfile.company || "N/A"}</p>
                  <p><b>Job:</b> {myProfile.job_title || "N/A"}</p>
                </div>

                <button style={styles.edit} onClick={() => setEditing(true)}>
                  Edit
                </button>
              </div>
              )
            )}

            <div style={styles.searchBox}>
              <input
                style={styles.input}
                placeholder="Search alumni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : (
              filteredAlumni.map((a) => (
                <div key={a.id} style={styles.card}>
                  <div>
                    <h2 style={{ marginBottom: "5px" }}>
                      {a.name}

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          fontWeight: "400",
                          marginLeft: "6px"
                        }}
                      >
                        (
                        {a.role === "student"
                          ? "Student of CAIAS"
                          : "Alumni of CAIAS"}
                        )
                      </span>
                    </h2>
                    <p>{a.email}</p>
                    <p><b>Company:</b> {a.company}</p>
                    <p><b>Job:</b> {a.job_title}</p>
                  </div>

                  <button
                    style={styles.chatButton}
                    disabled={
                      requestStatus[a.id] === "pending" ||
                      requestStatus[a.id] === "rejected"
                    }
                    onClick={async () => {
                      const status = requestStatus[a.id];

                      if (status === "approved") {
                        setSelectedUser(a);
                        fetchMessages(a.id);
                        markMessagesAsRead(a.id);
                        return;
                      }

                      if (status === "pending") {
                        alert("Request already sent");
                        return;
                      }

                      if (status === "rejected") {
                        alert("Request rejected");
                        return;
                      }

                      const { error } = await supabase
                        .from("chat_requests")
                        .insert([
                          {
                            sender_id: currentUser.id,
                            receiver_id: a.id,
                            status: "pending"
                          }
                        ]);

                      if (error) {
                        alert(error.message);
                        return;
                      }
                      
                      await supabase.from("notifications").insert([
                        {
                          user_id: a.id,
                          message: `${myProfile.name} has sent you a chat request!` 
                        }
                      ]);

                      alert("Request sent!");
                      fetchRequestStatus();
                    }}
                  >
                    {requestStatus[a.id] === "approved" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Chat
                        
                        {unreadCounts && unreadCounts[a.id] > 0 && (
                          <span
                            style={{
                              background: "white",
                              color: "#7c3aed", 
                              borderRadius: "50%",
                              minWidth: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {unreadCounts[a.id] > 99 ? "99+" : unreadCounts[a.id]}
                          </span>
                        )}
                      </div>
                    ) : requestStatus[a.id] === "pending" ? (
                      "Request Sent"
                    ) : requestStatus[a.id] === "rejected" ? (
                      "Rejected"
                    ) : (
                      "Request to Chat"
                    )}
                  </button>
                </div>
              ))
            )}

            {selectedUser && (
              <ChatBox
                currentUser={currentUser}
                selectedUser={selectedUser}
                messages={messages}
                setMessages={setMessages}
                setSelectedUser={setSelectedUser} 
              />
            )}
          </div>

          <div style={styles.rightPanel}>
            <h4>🔔 Notifications</h4>
            
            <>
              <h4 style={{ marginTop: "20px" }}>
                Chat Requests
              </h4>

              {requests.length === 0 ? (
                <p>No requests</p>
              ) : (
                requests.map((r) => (
                  <div
                    key={r.id}
                    style={styles.requestCard}
                  >
                    <p>
                      <b>
                        {r.sender?.name}

                        <span
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            fontWeight: "400"
                          }}
                        >
                          {" "}
                          (
                          {r.sender?.role === "student"
                            ? "Student of CAIAS"
                            : "Alumni of CAIAS"}
                          )
                        </span>
                      </b>
                    </p>

                    <p style={{ fontSize: "13px" }}>
                      {r.sender?.role === "student"
                        ? "wants to chat with you"
                        : "wants to connect with you"}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px"
                      }}
                    >
                      <button
                        style={styles.approveBtn}
                        onClick={() => approveRequest(r)}
                      >
                        Approve
                      </button>

                      <button
                        style={styles.rejectBtn}
                        onClick={() => rejectRequest(r)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>

            <h4 style={{ marginTop: "20px" }}>Recent Alerts</h4>

            {notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ 
                  marginBottom: "10px", 
                  background: "#f8fafc", 
                  padding: "12px", 
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  border: "1px solid #e2e8f0"
                }}>
                  <div>
                    <p style={{ fontSize: "14px", margin: 0, color: "#1e293b", fontWeight: "500" }}>{n.message}</p>

                    <small style={{ color: "#64748b" }}>
                      {timeAgo(n.created_at)} 
                    </small>
                  </div>

                  <button 
                    onClick={() => deleteNotification(n.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 0 0 10px"
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Inter, sans-serif",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: "20px",
    padding: "20px",
    maxWidth: "1100px",
    margin: "0 auto",  
  },
  sidebar: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "14px",
    padding: "20px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  rightPanel: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "14px",
    padding: "20px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "16px 20px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1e3a8a",
  },
  profileCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #e6eaf0",
  },
  searchBox: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #e6eaf0",
    boxSizing: "border-box" 
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    marginTop: "8px",
    boxSizing: "border-box"
  },
  card: {
    background: "#ffffff",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid #e6eaf0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatButton: {
    padding: "10px 14px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  editBox: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #e6eaf0",
  },
  edit: {
    padding: "10px 14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
  },
  save: {
    padding: "10px 14px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "10px",
  },
  requestCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    marginTop: "10px"
  },
  approveBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  rejectBtn: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer"
  } 
};
