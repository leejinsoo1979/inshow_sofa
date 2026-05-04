import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useConfigurator } from "../state/configurator";
import { formatTime, getSolarState } from "../scene/lighting";
import RangeControl from "./RangeControl";

const BACKGROUND_SWATCHES = [
  { label: "오프화이트", color: "#f4f2ed" },
  { label: "쿨그레이", color: "#e6ebf1" },
  { label: "웜그레이", color: "#ece3d7" },
  { label: "석재", color: "#dcd7cf" },
  { label: "차콜", color: "#1f1f21" },
  { label: "오프화이트2", color: "#fbfaf7" }
];

const LIGHTING_PRESET_ORDER = ["softbox", "jewelry", "automotive", "interior", "dramatic"];
const LIGHTING_PRESET_LABELS = {
  softbox: "Softbox",
  jewelry: "Jewelry",
  automotive: "Automotive",
  interior: "Interior",
  dramatic: "Dramatic"
};

function LightPresetButton({ id, active, onClick }) {
  return (
    <button
      type="button"
      className={`preset${active ? " active" : ""}`}
      onClick={() => onClick(id)}
    >
      {LIGHTING_PRESET_LABELS[id]}
    </button>
  );
}

export default function StudioLightingPanel() {
  const presetId = useConfigurator((s) => s.lightingPreset);
  const lighting = useConfigurator((s) => s.studioLighting);
  const setLightingPreset = useConfigurator((s) => s.setLightingPreset);
  const setStudioLightingValue = useConfigurator((s) => s.setStudioLightingValue);
  const backgroundColor = useConfigurator((s) => s.backgroundColor);
  const setBackgroundColor = useConfigurator((s) => s.setBackgroundColor);
  const hdri = useConfigurator((s) => s.hdri);
  const setHdri = useConfigurator((s) => s.setHdri);
  const clearHdri = useConfigurator((s) => s.clearHdri);
  const sun = useConfigurator((s) => s.sun);
  const setSunPlaying = useConfigurator((s) => s.setSunPlaying);
  const setSunTime = useConfigurator((s) => s.setSunTime);
  const setSunMonth = useConfigurator((s) => s.setSunMonth);
  const setSunLatitude = useConfigurator((s) => s.setSunLatitude);
  const renderQuality = useConfigurator((s) => s.renderQuality);
  const setRenderQuality = useConfigurator((s) => s.setRenderQuality);
  const fileInputRef = useRef(null);
  const lastHdriUrlRef = useRef(null);

  useEffect(() => {
    const prev = lastHdriUrlRef.current;
    if (prev && prev !== hdri.url && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }
    lastHdriUrlRef.current = hdri.url;
    return () => {
      if (lastHdriUrlRef.current && lastHdriUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(lastHdriUrlRef.current);
      }
    };
  }, [hdri.url]);

  const solar = useMemo(
    () => getSolarState({ hour: sun.time, month: sun.month, latitude: sun.latitude }),
    [sun.time, sun.month, sun.latitude]
  );

  const onUpload = () => fileInputRef.current?.click();
  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const kind = file.name.toLowerCase().endsWith(".hdr") ? "hdr" : "image";
    const url = URL.createObjectURL(file);
    setHdri({ name: file.name, url, kind });
    event.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".hdr,image/*"
        hidden
        onChange={onFileChange}
      />

      <section className="control-group">
        <div className="group-title">
          <h3>렌더링 퀄리티</h3>
          <span>{renderQuality === "high" ? "High" : "Medium"}</span>
        </div>
        <div className="quality-toggle">
          <button
            type="button"
            className={`quality-btn${renderQuality === "high" ? " is-active" : ""}`}
            onClick={() => setRenderQuality("high")}
          >
            High
          </button>
          <button
            type="button"
            className={`quality-btn${renderQuality === "medium" ? " is-active" : ""}`}
            onClick={() => setRenderQuality("medium")}
          >
            Medium
          </button>
        </div>
      </section>

      <section className="control-group">
        <div className="group-title">
          <h3>스튜디오 조명</h3>
          <span>{LIGHTING_PRESET_LABELS[presetId]}</span>
        </div>

        <div className="preset-grid">
          {LIGHTING_PRESET_ORDER.map((id) => (
            <LightPresetButton
              key={id}
              id={id}
              active={presetId === id}
              onClick={setLightingPreset}
            />
          ))}
        </div>

        <div className="lighting-actions">
          <button type="button" className="ghost-btn" onClick={onUpload}>HDRI 업로드</button>
          <button type="button" className="ghost-btn" onClick={clearHdri} disabled={!hdri.url}>HDRI 해제</button>
        </div>

        <div className="badge-row">
          <span className="file-badge">{hdri.name || "Room Environment"}</span>
          <span className="file-badge is-subtle">{hdri.kind ? hdri.kind.toUpperCase() : "PMREM"}</span>
        </div>

        <div className="background-grid">
          {BACKGROUND_SWATCHES.map((item) => {
            const active = item.color.toLowerCase() === backgroundColor.toLowerCase();
            return (
              <button
                key={item.color}
                type="button"
                className={`background-swatch${active ? " active" : ""}`}
                style={{ "--swatch": item.color }}
                title={item.label}
                aria-label={item.label}
                onClick={() => setBackgroundColor(item.color)}
              />
            );
          })}
        </div>

        <div className="lighting-grid">
          <RangeControl
            label="Exposure"
            value={lighting.exposure}
            min={0.5}
            max={1.6}
            step={0.01}
            onChange={(value) => setStudioLightingValue("exposure", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Environment"
            value={lighting.environmentIntensity}
            min={0}
            max={2}
            step={0.01}
            onChange={(value) => setStudioLightingValue("environmentIntensity", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Key Light"
            value={lighting.keyLight}
            min={0}
            max={5}
            step={0.01}
            onChange={(value) => setStudioLightingValue("keyLight", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Fill Light"
            value={lighting.fillLight}
            min={0}
            max={3}
            step={0.01}
            onChange={(value) => setStudioLightingValue("fillLight", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Rim Light"
            value={lighting.rimLight}
            min={0}
            max={3}
            step={0.01}
            onChange={(value) => setStudioLightingValue("rimLight", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Top Softbox"
            value={lighting.topSoftbox}
            min={0}
            max={5}
            step={0.01}
            onChange={(value) => setStudioLightingValue("topSoftbox", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Spot Light"
            value={lighting.spotLight}
            min={0}
            max={4}
            step={0.01}
            onChange={(value) => setStudioLightingValue("spotLight", value)}
            formatValue={(value) => value.toFixed(2)}
          />
          <RangeControl
            label="Point Light"
            value={lighting.pointLight}
            min={0}
            max={2}
            step={0.01}
            onChange={(value) => setStudioLightingValue("pointLight", value)}
            formatValue={(value) => value.toFixed(2)}
          />
        </div>
      </section>

      <section className="control-group">
        <div className="group-title">
          <h3>태양 타임라인</h3>
          <span>{formatTime(sun.time)} · Alt {Math.round(THREE.MathUtils.radToDeg(solar.altitude))}°</span>
        </div>

        <div className="timeline-actions">
          <button
            type="button"
            className={`ghost-btn${sun.playing ? " is-active" : ""}`}
            onClick={() => setSunPlaying(!sun.playing)}
          >
            {sun.playing ? "Pause" : "Play"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => { setSunPlaying(false); setSunTime(6); }}>
            Sunrise
          </button>
          <button type="button" className="ghost-btn" onClick={() => { setSunPlaying(false); setSunTime(12); }}>
            Noon
          </button>
          <button type="button" className="ghost-btn" onClick={() => { setSunPlaying(false); setSunTime(18); }}>
            Sunset
          </button>
        </div>

        <div className="lighting-grid">
          <RangeControl
            label="Time"
            value={sun.time}
            min={0}
            max={24}
            step={0.01}
            onChange={setSunTime}
            formatValue={(value) => formatTime(value)}
          />
          <RangeControl
            label="Month"
            value={sun.month}
            min={1}
            max={12}
            step={1}
            onChange={setSunMonth}
            formatValue={(value) => String(value).padStart(2, "0")}
          />
          <RangeControl
            label="Latitude"
            value={sun.latitude}
            min={-66}
            max={66}
            step={0.1}
            onChange={setSunLatitude}
            formatValue={(value) => value.toFixed(1)}
            suffix="°"
          />
        </div>

        <div className="sun-readout">
          <span>현재 {formatTime(sun.time)}</span>
          <span>Alt {THREE.MathUtils.radToDeg(solar.altitude).toFixed(1)}°</span>
          <span>Azi {THREE.MathUtils.radToDeg(solar.azimuth).toFixed(1)}°</span>
        </div>
      </section>
    </>
  );
}
