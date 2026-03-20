export const BRANCH_COLORS = [
  "#FF6B6B", // 珊瑚红
  "#4ECDC4", // 薄荷绿
  "#45B7D1", // 天蓝
  "#96CEB4", // 灰绿
  "#FFEAA7", // 柠黄
  "#DDA0DD", // 梅红
  "#98D8C8", // 水绿
  "#F7DC6F", // 金黄
  "#BB8FCE", // 紫藤
  "#F0B27A", // 柑橙
];

export interface ThemeColors {
  root: {
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    paddingH: number;
    paddingV: number;
    bgColor: string;
    textColor: string;
  };
  node: {
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    paddingH: number;
    paddingV: number;
    textColor: string;
  };
  level1: {
    fontSize: number;
    fontWeight: number;
  };
  connection: {
    strokeWidth: number;
  };
  layout: {
    horizontalGap: number;
    verticalGap: number;
  };
  canvas: {
    bgColor: string;
  };
  controls: {
    bgColor: string;
    textColor: string;
    hoverBg: string;
    activeBg: string;
  };
  contextMenu: {
    bgColor: string;
    textColor: string;
    hoverBg: string;
    borderColor: string;
    shadowColor: string;
  };
  addBtn: {
    fill: string;
    hoverFill: string;
    iconColor: string;
  };
  selection: {
    strokeColor: string;
    fillColor: string;
  };
  highlight: {
    textColor: string;
    bgColor: string;
  };
}

const SHARED = {
  root: {
    fontSize: 20,
    fontWeight: 600,
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    paddingH: 24,
    paddingV: 12,
  },
  node: {
    fontSize: 15,
    fontWeight: 400,
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    paddingH: 8,
    paddingV: 6,
  },
  level1: {
    fontSize: 16,
    fontWeight: 500,
  },
  connection: {
    strokeWidth: 2.5,
  },
  layout: {
    horizontalGap: 80,
    verticalGap: 16,
  },
};

const LIGHT_THEME: ThemeColors = {
  ...SHARED,
  root: { ...SHARED.root, bgColor: "#2C3E50", textColor: "#FFFFFF" },
  node: { ...SHARED.node, textColor: "#333333" },
  canvas: { bgColor: "#fafafa" },
  controls: {
    bgColor: "rgba(255, 255, 255, 0.9)",
    textColor: "#555",
    hoverBg: "rgba(0, 0, 0, 0.08)",
    activeBg: "rgba(0, 0, 0, 0.08)",
  },
  contextMenu: {
    bgColor: "rgba(255, 255, 255, 0.95)",
    textColor: "#333",
    hoverBg: "rgba(0, 0, 0, 0.06)",
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "rgba(0, 0, 0, 0.15)",
  },
  addBtn: {
    fill: "rgba(200, 200, 220, 0.6)",
    hoverFill: "rgba(180, 180, 200, 0.8)",
    iconColor: "#666",
  },
  selection: {
    strokeColor: "#4A90D9",
    fillColor: "rgba(74, 144, 217, 0.08)",
  },
  highlight: {
    textColor: "#fac800", // amber-800
    bgColor: "rgba(252, 211, 77, 0.2)", // amber-300/40
  },
};

const DARK_THEME: ThemeColors = {
  ...SHARED,
  root: { ...SHARED.root, bgColor: "#4A6FA5", textColor: "#FFFFFF" },
  node: { ...SHARED.node, textColor: "#E0E0E0" },
  canvas: { bgColor: "#1a1a2e" },
  controls: {
    bgColor: "rgba(30, 30, 45, 0.9)",
    textColor: "#ccc",
    hoverBg: "rgba(255, 255, 255, 0.1)",
    activeBg: "rgba(255, 255, 255, 0.12)",
  },
  contextMenu: {
    bgColor: "rgba(35, 35, 50, 0.95)",
    textColor: "#ddd",
    hoverBg: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.4)",
  },
  addBtn: {
    fill: "rgba(100, 100, 130, 0.6)",
    hoverFill: "rgba(120, 120, 150, 0.8)",
    iconColor: "#aaa",
  },
  selection: {
    strokeColor: "#5B9BD5",
    fillColor: "rgba(91, 155, 213, 0.15)",
  },
  highlight: {
    textColor: "#fcd34d", // amber-300
    bgColor: "rgba(251, 191, 36, 0.2)", // amber-400/20
  },
};

export function getTheme(mode: "light" | "dark"): ThemeColors {
  return mode === "dark" ? DARK_THEME : LIGHT_THEME;
}

// Backward compatible default export
export const THEME = LIGHT_THEME;
