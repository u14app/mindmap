import { useState } from "react";
import { MindMapHelpDialog } from "./components/MindMap/components/MindMapHelpDialog";
import { IconHelp } from "./components/MindMap/components/icons";
import { useTheme } from "./components/MindMap/hooks/useTheme";

export function DemoHelpButton() {
  const [open, setOpen] = useState(false);
  const theme = useTheme("auto");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Help"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          background: theme.controls.bgColor,
          color: theme.controls.textColor,
          zIndex: 100,
        }}
      >
        <IconHelp size={16} />
      </button>
      {open && (
        <MindMapHelpDialog theme={theme} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
