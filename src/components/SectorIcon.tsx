import {
  Banknote,
  Boxes,
  Cpu,
  Factory,
  Fuel,
  HeartPulse,
  Layers,
  Landmark,
  RadioTower,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  Zap,
  type LucideIcon
} from "lucide-react";

// Maps a root sector name to a clean line icon. Keys are matched case-insensitively
// against substrings so minor naming drift still resolves.
const SECTOR_ICONS: Array<{ match: string; icon: LucideIcon }> = [
  { match: "fast moving consumer", icon: ShoppingCart },
  { match: "consumer discretionary", icon: ShoppingBag },
  { match: "financial", icon: Landmark },
  { match: "industrial", icon: Factory },
  { match: "commodit", icon: Boxes },
  { match: "service", icon: Wrench },
  { match: "health", icon: HeartPulse },
  { match: "information technology", icon: Cpu },
  { match: "utilit", icon: Zap },
  { match: "energy", icon: Fuel },
  { match: "telecom", icon: RadioTower },
  { match: "diversified", icon: Layers }
];

export function sectorIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const { match, icon } of SECTOR_ICONS) {
    if (lower.includes(match)) {
      return icon;
    }
  }
  return Banknote;
}

export function SectorIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = sectorIcon(name);
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
