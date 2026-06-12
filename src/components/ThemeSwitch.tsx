import { Laptop, Moon, Sun } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./layout.module.css";

// Stateless segmented control. The theme script in layout.tsx wires every
// [data-theme-option] button globally (click delegation + data-active sync),
// so this just needs to render the buttons.
const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Auto", Icon: Laptop }
] as const;

export function ThemeSwitch() {
  return (
    <div className={css(styles, "theme-switch")} role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          data-theme-option={value}
          aria-pressed="false"
          aria-label={label}
          title={label}
          suppressHydrationWarning
          className={css(styles, "theme-switch-btn")}
        >
          <Icon size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
