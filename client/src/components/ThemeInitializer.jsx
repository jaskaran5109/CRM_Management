import { useEffect } from "react";
import { useSelector } from "react-redux";
import { applyTheme } from "../utils/themeUtils";

/**
 * ThemeInitializer Component
 * Applies the theme from Redux state to the document on mount and when it changes
 */
export function ThemeInitializer() {
  const { mode: theme } = useSelector((state) => state.theme);

  useEffect(() => {
    // Apply theme to document on mount and whenever theme changes
    applyTheme(theme);
  }, [theme]);

  // This component doesn't render anything, it just manages theme state
  return null;
}

export default ThemeInitializer;
