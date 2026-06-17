import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

export default function ChatBox({ currentUser, selectedUser, messages, setMessages, setSelectedUser }) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault(); 
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(""); 

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: messageText
      }
    ]);

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: messageText,
        is_read: false,
      },
    ]);

    if (error) {
      console.log("Error sending message:", error);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>💬 Chat with {selectedUser.name}</h3>
        
        {setSelectedUser && (
          <button type="button" style={styles.closeButton} onClick={() => setSelectedUser(null)}>
            ✖
          </button>
        )}
      </div>

      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <p style={styles.emptyText}>No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;

            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMe ? "flex-end" : "flex-start", 
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: isMe ? "#2563eb" : "#e5e7eb", 
                    color: isMe ? "white" : "black",
                    borderBottomRightRadius: isMe ? "0px" : "18px", 
                    borderBottomLeftRadius: isMe ? "18px" : "0px",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form style={styles.inputArea} onSubmit={sendMessage}>
        <input
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" style={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  chatContainer: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    height: "500px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    marginTop: "20px",
    overflow: "hidden" 
  },
  chatHeader: {
    background: "#1e3a8a",
    color: "white",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    padding: "4px"
  },
  messagesArea: {
    flex: 1,
    background: "#f3f4f6",
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    margin: "auto"
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "70%",
    padding: "10px 16px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordBreak: "break-word"
  },
  inputArea: {
    display: "flex",
    padding: "15px",
    background: "#ffffff",
    borderTop: "1px solid #e6eaf0",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "20px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f8fafc"
  },
  sendButton: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "0 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.2s"
  }
};
