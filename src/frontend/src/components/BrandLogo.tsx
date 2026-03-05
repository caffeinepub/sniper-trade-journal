interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-12 w-12" }: BrandLogoProps) {
  return (
    <img
      src="/assets/generated/sniper-trade-journal-logo-transparent.dim_256x256.png"
      alt="Sniper Trade Journal Logo"
      className={className}
    />
  );
}
