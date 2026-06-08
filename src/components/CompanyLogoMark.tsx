import { css } from "@/lib/css-module";
import styles from "./market.module.css";

type LogoSize = "sm" | "md" | "lg";

function logoInitial(name: string, code: string) {
  return (name.trim().charAt(0) || code.trim().charAt(0) || "S").toUpperCase();
}

function logoTone(code: string) {
  const seed = code
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return `logo-tone-${(seed % 8) + 1}`;
}

export function CompanyLogoMark({
  code,
  name,
  size = "md"
}: {
  code: string;
  name: string;
  size?: LogoSize;
}) {
  return (
    <span
      className={css(styles, "company-logo-mark", `company-logo-${size}`, logoTone(code))}
      title={`${name} placeholder logo`}
    >
      {logoInitial(name, code)}
    </span>
  );
}
