import Navbar from "../components/Navbar";

export default function Events() {
  return (
    <>
      <Navbar />
      
      <div style={styles.container}>
        <h1 style={styles.title}>📅 Upcoming Events</h1>
        
        <div style={styles.card}>
          <p style={{ color: "#64748b" }}>There are no upcoming events at the moment. Check back later!</p>
        </div>
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
  title: {
    marginBottom: "20px", 
    color: "#1e3a8a", 
    fontSize: "24px"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "14px",
    border: "1px solid #e6eaf0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  }
};
