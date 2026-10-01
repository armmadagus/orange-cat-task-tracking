export default function Loading() {
  return (
    <div style={{ padding: 32 }} aria-label="กำลังโหลด" aria-busy="true">
      <div className="page-container">
        <div style={{ height: 42, width: "36%", borderRadius: 10, background: "#e5edff", marginBottom: 28 }} />
        <div className="summary-strip">
          {[0, 1, 2].map((item) => <div key={item} className="summary-card" style={{ background: "#eef3fb" }} />)}
        </div>
      </div>
    </div>
  );
}
