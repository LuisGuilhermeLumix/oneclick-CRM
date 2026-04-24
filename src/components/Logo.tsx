import logoFull from "@/assets/lumix-logo.png";
import logoIcon from "@/assets/lumix-icon.png";

export function Logo({ variant = "full", className = "" }: { variant?: "full" | "icon"; className?: string }) {
  if (variant === "icon") {
    return <img src={logoIcon} alt="Lumix" className={className} />;
  }
  return <img src={logoFull} alt="Lumix" className={className} />;
}
