import { useEffect, useState } from "react";
import { useConfigurator, baseOptionsForCurrent } from "../state/configurator";
import { sofaColors, trayWoodColors, accentCushionColors } from "../data/colors";
import ModuleCatalog from "./ModuleCatalog";
import Swatches from "./Swatches";
import Cart from "./Cart";

export default function SidePanel() {
  const sofaColor = useConfigurator((s) => s.sofaColor);
  const baseColor = useConfigurator((s) => s.baseColor);
  const trayWood = useConfigurator((s) => s.trayWood);
  const accentCushion = useConfigurator((s) => s.accentCushion);
  const setSofaColor = useConfigurator((s) => s.setSofaColor);
  const setBaseColor = useConfigurator((s) => s.setBaseColor);
  const setTrayWood = useConfigurator((s) => s.setTrayWood);
  const setAccentCushion = useConfigurator((s) => s.setAccentCushion);
  const addOption = useConfigurator((s) => s.addOption);

  const baseOptions = baseOptionsForCurrent(sofaColor);
  const [tab, setTab] = useState("modules");
  const [collapsed, setCollapsed] = useState(false);

  // app-shell에 panel-collapsed 클래스 토글 (:has 셀렉터 미지원 브라우저 호환)
  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    if (collapsed) shell.classList.add("panel-collapsed");
    else shell.classList.remove("panel-collapsed");
  }, [collapsed]);

  const ModulesSection = () => <ModuleCatalog />;
  const MaterialsSection = () => (
    <>
      <section className="control-group">
        <div className="group-title">
          <h3>소파 색상</h3>
          <span>{sofaColor.label}</span>
        </div>
        <Swatches items={sofaColors} active={sofaColor} onSelect={setSofaColor} />
      </section>

      <section className="control-group">
        <div className="group-title">
          <h3>하부 프레임 색상</h3>
          <span>{baseColor.label}</span>
        </div>
        <Swatches items={baseOptions} active={baseColor} onSelect={setBaseColor} />
      </section>

      <section className="control-group">
        <div className="group-title">
          <h3>소파 원목 선반</h3>
          <span>{trayWood.label}</span>
        </div>
        <Swatches items={trayWoodColors} active={trayWood} onSelect={setTrayWood} />
      </section>

      <section className="control-group">
        <div className="group-title">
          <h3>소파 쿠션</h3>
          <span>{accentCushion?.label || "없음"}</span>
        </div>
        <Swatches
          items={accentCushionColors}
          active={accentCushion}
          onSelect={(item) => {
            setAccentCushion(item);
            addOption("cushion", item.label);
          }}
          columns={4}
        />
      </section>
    </>
  );

  return (
    <aside className={`panel${collapsed ? " is-collapsed" : ""}`} aria-label="Configurator options">
      <button
        className="sheet-handle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "패널 열기" : "패널 닫기"}
        type="button"
      />
      <div className="panel-tabs" role="tablist">
        <button
          className={`panel-tab${tab === "modules" ? " is-active" : ""}`}
          onClick={() => setTab("modules")}
          role="tab"
          aria-selected={tab === "modules"}
        >
          모듈
        </button>
        <button
          className={`panel-tab${tab === "materials" ? " is-active" : ""}`}
          onClick={() => setTab("materials")}
          role="tab"
          aria-selected={tab === "materials"}
        >
          재질
        </button>
      </div>
      <div className="panel-scroll" data-tab={tab}>
        <div className="panel-section panel-section--modules">
          <ModulesSection />
        </div>
        <div className="panel-section panel-section--materials">
          <MaterialsSection />
        </div>
      </div>
      <div className="checkout">
        <Cart />
      </div>
    </aside>
  );
}
