"use client";

export type ThemeMode = "light" | "dark";

const common = {
  token: {
    // Delegate brand colors to CSS variables so Tenant Admin can override them
    colorPrimary: "var(--primary)",
    colorPrimaryHover: "var(--primary-hover)",
    colorPrimaryActive: "var(--primary-hover)",
    colorLink: "var(--primary)",
    colorLinkHover: "var(--primary-hover)",
    borderRadius: 14,
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 16,
  },
  components: {
    Button: {
      borderRadius: 50,
      controlHeight: 44,
      paddingInline: 24,
      fontWeight: 600,
    },
  },
};

export const lightTheme = {
  tokens: {
    ...common,
    token: {
      ...common.token,
      colorText: "var(--text)",
      colorTextSecondary: "var(--text-muted)",
      colorBgBase: "var(--bg-base)",
      colorBgContainer: "var(--surface)",
      colorBorder: "var(--border)",
      colorBorderSecondary: "var(--border)",
    },
    components: {
      ...common.components,
      DatePicker: {
        colorBgElevated: "var(--card)",
        colorBgContainer: "var(--surface)",
        colorText: "var(--text)",
        colorTextHeading: "var(--text)",
        colorIcon: "var(--text-muted)",
        colorIconHover: "var(--primary)",
      },
    },
  },
  customColors: {
    // Sidebar colors (derived from primary; rest comes from globals.css)
    "sidebar-bg":
      "linear-gradient(180deg, color-mix(in srgb, var(--primary), black 32%) 0%, color-mix(in srgb, var(--primary), black 52%) 100%)",
    "sidebar-text": "var(--text-inverse)",
    "sidebar-muted": "color-mix(in srgb, var(--text-inverse), transparent 40%)",
  },
};

export const darkTheme = {
  tokens: {
    ...common,
    token: {
      ...common.token,
      colorText: "var(--text)",
      colorTextSecondary: "var(--text-muted)",
      colorBgBase: "var(--bg-base)",
      colorBgContainer: "var(--surface)",
      colorBorder: "var(--border)",
      colorBorderSecondary: "var(--border)",
    },
    components: {
      ...common.components,
      Modal: {
        contentBg: "var(--card)",
        headerBg: "var(--card)",
        titleColor: "var(--text)",
      },
      DatePicker: {
        colorBgElevated: "var(--card)",
        colorBgContainer: "var(--surface)",
        colorText: "var(--text)",
        colorTextHeading: "var(--text)",
        colorIcon: "var(--text-muted)",
        colorIconHover: "var(--primary)",
      },
      Card: {
        actionsBg: "var(--card)",
      },
    },
  },
  customColors: {
    // Sidebar colors (derived from primary; rest comes from globals.css)
    "sidebar-bg":
      "linear-gradient(180deg, color-mix(in srgb, var(--primary), black 45%) 0%, color-mix(in srgb, var(--primary), black 65%) 100%)",
    "sidebar-text": "var(--text-inverse)",
    "sidebar-muted": "color-mix(in srgb, var(--text-inverse), transparent 40%)",
  },
};
