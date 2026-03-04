interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-12 w-12" }: BrandLogoProps) {
  return (
    <img
      src="/assets/generated/donut-bakery-logo.dim_512x512.png"
      alt="Donut Bakery Café Logo"
      className={className}
    />
  );
}
