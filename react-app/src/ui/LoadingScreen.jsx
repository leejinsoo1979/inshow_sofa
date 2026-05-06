import { useProgress } from "@react-three/drei";
import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const { active, progress } = useProgress();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active && progress >= 100) {
      // HDRI/텍스처 GPU 업로드 + 첫 프레임 렌더 후 페이드아웃 → 깜빡임 방지
      const t = setTimeout(() => setDone(true), 400);
      return () => clearTimeout(t);
    }
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
        <p className="loading-status">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
