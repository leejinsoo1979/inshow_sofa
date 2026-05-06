// 저사양 기기 감지: 안드로이드 저가 칩 등에서 렌더 품질 자동 하향
let cached = null;

export function isLowEndDevice() {
  if (cached !== null) return cached;
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    cached = false;
    return cached;
  }
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) {
    cached = false;
    return cached;
  }
  const isAndroid = /Android/i.test(ua);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (isAndroid && (cores <= 6 || mem <= 4)) {
    cached = true;
    return cached;
  }
  if (coarse && !isIOS && mem <= 4) {
    cached = true;
    return cached;
  }
  cached = false;
  return cached;
}
