import { theme as antdTheme, ThemeConfig } from 'antd';

export function getAntdTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      fontFamily: '"IBM Plex Sans Thai", system-ui, -apple-system, sans-serif',
      colorPrimary: isDark ? '#007acc' : '#2f6fce',
      colorInfo: '#12a4a0',
      colorSuccess: '#26a65b',
      colorWarning: '#ee8a1f',
      colorError: '#ef4444',
      borderRadius: 6,
      wireframe: false,
      colorBgBase: isDark ? '#1e1e1e' : '#ffffff',
      colorBgContainer: isDark ? '#252526' : '#ffffff',
      colorBgElevated: isDark ? '#2d2d2d' : '#ffffff',
      colorBgLayout: isDark ? '#1e1e1e' : '#f8fafc',
      colorTextBase: isDark ? '#cccccc' : '#0f172a',
      colorTextDescription: isDark ? '#969696' : '#64748b',
      colorBorder: isDark ? '#3c3c3c' : '#e2e8f0',
      colorBorderSecondary: isDark ? '#333333' : '#f1f5f9',
    },
    components: {
      Modal: {
        contentBg: isDark ? '#252526' : '#ffffff',
        headerBg: isDark ? '#252526' : '#ffffff',
        titleColor: isDark ? '#cccccc' : '#0f172a',
      },
      Table: {
        headerBg: isDark ? '#1f1f1f' : '#f8fafc',
        headerColor: isDark ? '#cccccc' : '#475569',
        rowHoverBg: isDark ? '#2a2d2e' : '#f1f5f9',
        borderColor: isDark ? '#3c3c3c' : '#e2e8f0',
        colorBgContainer: isDark ? '#252526' : '#ffffff',
      },
      Card: {
        colorBgContainer: isDark ? '#252526' : '#ffffff',
        colorBorderSecondary: isDark ? '#3c3c3c' : '#e2e8f0',
      },
      Button: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Tabs: {
        itemColor: isDark ? '#969696' : '#64748b',
        itemSelectedColor: isDark ? '#3794ff' : '#2f6fce',
        itemHoverColor: isDark ? '#cccccc' : '#1e293b',
      },
      Select: {
        colorBgContainer: isDark ? '#2d2d2d' : '#ffffff',
        colorBgElevated: isDark ? '#252526' : '#ffffff',
        colorBorder: isDark ? '#3c3c3c' : '#d9d9d9',
        optionSelectedBg: isDark ? '#094771' : '#e6f4ff',
      },
      Input: {
        colorBgContainer: isDark ? '#2d2d2d' : '#ffffff',
        colorBorder: isDark ? '#3c3c3c' : '#d9d9d9',
        colorText: isDark ? '#cccccc' : '#0f172a',
        colorTextPlaceholder: isDark ? '#6e7681' : '#bfbfbf',
      },
      DatePicker: {
        colorBgContainer: isDark ? '#2d2d2d' : '#ffffff',
        colorBgElevated: isDark ? '#252526' : '#ffffff',
        colorBorder: isDark ? '#3c3c3c' : '#d9d9d9',
      },
    },
  };
}

