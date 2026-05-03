import SidePanel from "./ui/SidePanel";
import Scene from "./scene/Scene";

export default function App() {
  return (
    <main className="app-shell">
      <section className="viewer" aria-label="3D sofa viewer">
        <Scene />
        <div className="brand-bar">
          <div>
            <p className="eyebrow">3D Configurator</p>
            <h1>INSHOW SOFA #1</h1>
          </div>
        </div>
      </section>
      <SidePanel />
    </main>
  );
}
