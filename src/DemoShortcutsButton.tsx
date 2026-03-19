import { useState } from "react";
import { MindMapShortcutsDialog } from "./components/MindMap/components/MindMapShortcutsDialog";
import { IconKeyboard } from "./components/MindMap/components/icons";
import { useTheme } from "./components/MindMap/hooks/useTheme";

export function DemoShortcutsButton() {
  const [open, setOpen] = useState(false);
  const theme = useTheme("auto");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Shortcuts"
        style={{
          position: "absolute",
          top: 16,
          right: 56,
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
        <IconKeyboard size={16} />
      </button>
      {open && (
        <MindMapShortcutsDialog
          theme={theme}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
