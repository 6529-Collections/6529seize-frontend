"use client";

import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./Header.module.scss";

export default function HeaderThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Activate ${isDark ? "light" : "dark"} theme`}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={styles.themeToggleButton}>
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} height={18} />
    </button>
  );
}

