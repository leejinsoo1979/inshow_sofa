import { useEffect } from "react";
import { useConfigurator } from "../state/configurator";

export function useKeyboardShortcuts(onResetCamera) {
  const removeSelected = useConfigurator((s) => s.removeSelected);
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key === " ") {
        e.preventDefault();
        onResetCamera?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [removeSelected, onResetCamera]);
}
