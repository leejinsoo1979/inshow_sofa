import StudioLightingPanel from "./StudioLightingPanel";
import { useConfigurator } from "../state/configurator";

export default function StudioLightingPopover() {
  const open = useConfigurator((s) => s.openLightingPanel);
  const setOpen = useConfigurator((s) => s.setOpenLightingPanel);

  if (!open) return null;

  return (
    <div className="lighting-popover is-open" role="dialog" aria-label="스튜디오 조명">
      <div className="popover-head">
        <span>스튜디오 조명</span>
        <button onClick={() => setOpen(false)} aria-label="닫기">×</button>
      </div>
      <div className="lighting-popover-body">
        <StudioLightingPanel />
      </div>
    </div>
  );
}
