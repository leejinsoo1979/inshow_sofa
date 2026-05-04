import { useState } from "react";
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
    <aside className="panel" aria-label="Configurator options">
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
