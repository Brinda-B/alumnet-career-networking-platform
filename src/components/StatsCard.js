export default function StatsCard({ title, value, color }) {
  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "15px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
      minWidth: "180px"
    }}>

      <h3 style={{ color: "#6b7280" }}>
        {title}
      </h3>

      <h1 style={{ color: color || "#111827" }}>
        {value}
      </h1>

    </div>
  );
}