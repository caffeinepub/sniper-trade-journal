import logoUrl from "../assets/logo.png";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-12 w-12" }: BrandLogoProps) {
  return (
    <img src={logoUrl} alt="Sniper Trade Journal Logo" className={className} />
  );
}
