import { css } from "@/lib/css-module";
import styles from "./market.module.css";
import { COMPANY_LOGO_CODES } from "./company-logos";

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
  if (COMPANY_LOGO_CODES.has(code)) {
    return (
      <img
        className={css(styles, "company-logo-mark", `company-logo-${size}`, "company-logo-img")}
        src={`/logos/${code}.svg`}
        alt={`${name} logo`}
        width={34}
        height={34}
        loading="lazy"
      />
    );
  }

  return (
    <span
      className={css(styles, "company-logo-mark", `company-logo-${size}`, logoTone(code))}
      title={`${name} placeholder logo`}
    >
      {logoInitial(name, code)}
    </span>
  );
}
