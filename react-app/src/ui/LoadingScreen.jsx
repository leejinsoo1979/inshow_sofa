import { useProgress } from "@react-three/drei";

export default function LoadingScreen() {
  const { active, progress, item } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="loading-screen" aria-live="polite">
      <div className="loading-inner">
        <p className="loading-eyebrow">3D CONFIGURATOR</p>
        <h1 className="loading-title">INSHOW SOFA #1</h1>
        <div className="loading-bar">
          <div className="loading-bar-fill" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <p className="loading-status">{item ? `Loading ${item.split("/").pop()}…` : "Loading…"}</p>
      </div>
    </div>
  );
}
