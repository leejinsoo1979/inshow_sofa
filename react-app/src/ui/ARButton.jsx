import { useState } from "react";
import QRCode from "qrcode";
import { TbAugmentedReality } from "react-icons/tb";
import { exportSceneToGlb } from "../scene/exportGlb";
import { getAllModuleClones } from "../scene/sceneRefs";

export default function ARButton() {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [arUrl, setArUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    setQrDataUrl("");
    setArUrl("");
    try {
      const clones = getAllModuleClones();
      if (!clones.length) throw new Error("배치된 가구가 없습니다");
      const glbBuffer = await exportSceneToGlb(clones);

      const res = await fetch("/api/ar/upload", {
        method: "POST",
        headers: { "Content-Type": "model/gltf-binary" },
        body: glbBuffer
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`업로드 실패 (${res.status}) ${errText}`);
      }
      const { id } = await res.json();
      const url = `${window.location.origin}/ar.html?id=${id}`;
      setArUrl(url);
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch (e) {
      setError(e.message || "AR 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="icon-btn icon-btn--ar"
        type="button"
        onClick={onClick}
        title="AR로 보기"
        aria-label="AR로 보기"
      >
        <TbAugmentedReality size={24} />
      </button>

      {open && (
        <div className="ar-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ar-modal-close"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >×</button>
            <h2 className="ar-modal-title">QR을 휴대폰으로 스캔하세요</h2>
            <p className="ar-modal-desc">
              카메라 앱으로 QR을 촬영하면 휴대폰에서 AR로 가구를 실측 스케일로 배치할 수 있습니다.
            </p>
            <div className="ar-qr-wrap">
              {loading && <div className="ar-qr-loading">생성 중…</div>}
              {error && <div className="ar-qr-error">{error}</div>}
              {qrDataUrl && (
                <>
                  <img src={qrDataUrl} alt="AR QR" className="ar-qr-img" />
                  <a href={arUrl} target="_blank" rel="noopener noreferrer" className="ar-link">
                    {arUrl}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
