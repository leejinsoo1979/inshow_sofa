import SidePanel from "./ui/SidePanel";

export default function App() {
  return (
    <main className="app-shell">
      <section className="viewer" aria-label="3D sofa viewer">
        <div className="brand-bar">
          <div>
            <p className="eyebrow">3D Configurator</p>
            <h1>INSHOW SOFA #1</h1>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#666",
            fontSize: 14
          }}
        >
          3D Scene (다음 단계에서 r3f로 마이그레이션 예정)
        </div>
      </section>
      <SidePanel />
    </main>
  );
}
