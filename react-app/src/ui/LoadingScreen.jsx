import { useProgress } from "@react-three/drei";
import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const { active, progress, item } = useProgress();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active && progress >= 100) setDone(true);
  }, [active, progress]);
  if (done) return null;
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
