import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function HeroSection() {
  const handleViewMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.querySelector("#menu");
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleOrderOnline = () => {
    if (siteConfig.orderOnlineUrl) {
      window.open(siteConfig.orderOnlineUrl, "_blank");
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url(/assets/generated/hero-banner.dim_1920x800.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      <div className="container relative z-10 text-center px-4">
        <div className="flex justify-center mb-6">
          <BrandLogo className="h-20 w-20 md:h-24 md:w-24" />
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Freshly Made. Fully Loaded.
          <br />
          Always Delicious.
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
          From soft, fluffy donuts to cheesy pizzas and juicy burgers — your
          favorite comfort food, all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-warm-red hover:bg-warm-red/90 text-white px-8 py-6 text-lg font-semibold"
            onClick={handleOrderOnline}
            disabled={!siteConfig.orderOnlineUrl}
          >
            🔴 Order Online
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-warm-yellow hover:bg-warm-yellow/90 text-warm-brown border-warm-yellow px-8 py-6 text-lg font-semibold"
            onClick={handleViewMenu}
          >
            🟡 View Full Menu
          </Button>
        </div>
      </div>
    </section>
  );
}
