import { siteConfig } from "@/config/site";
import { Heart } from "lucide-react";
import { SiInstagram } from "react-icons/si";

export function FooterSection() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== "undefined"
      ? window.location.hostname
      : "donut-bakery-cafe",
  );

  return (
    <footer className="bg-warm-brown text-white py-12">
      <div className="container px-4">
        <div className="text-center space-y-6">
          <p className="text-2xl md:text-3xl font-bold">
            Good Food. Good Mood. Great Company.
          </p>
          {siteConfig.instagramUrl ? (
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg hover:text-warm-yellow transition-colors"
            >
              <SiInstagram className="w-6 h-6" />
              Follow us on Instagram & stay updated with new flavors and offers.
            </a>
          ) : (
            <p className="text-lg flex items-center justify-center gap-2">
              <SiInstagram className="w-6 h-6" />
              Follow us on Instagram & stay updated with new flavors and offers.
            </p>
          )}
          <div className="pt-6 border-t border-white/20">
            <p className="text-sm text-white/80 flex items-center justify-center gap-1 flex-wrap">
              © {currentYear} Donut Bakery Café. Built with{" "}
              <Heart className="w-4 h-4 text-warm-red fill-warm-red inline" />{" "}
              using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-warm-yellow transition-colors underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
