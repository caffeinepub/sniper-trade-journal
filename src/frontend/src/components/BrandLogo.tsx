interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-12 w-12" }: BrandLogoProps) {
  return (
    <img
      src="/assets/generated/sniper-logo-transparent.dim_512x512.png"
      alt="Sniper Trade Journal Logo"
      className={className}
    />
  );
}
