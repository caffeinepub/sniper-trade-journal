import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { Clock, MapPin, Phone } from "lucide-react";

export function VisitUsSection() {
  const handleCall = () => {
    if (siteConfig.phone) {
      window.location.href = `tel:${siteConfig.phone}`;
    }
  };

  const handleWhatsApp = () => {
    const phone = siteConfig.whatsappPhone || siteConfig.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
    }
  };

  const handleOrderOnline = () => {
    if (siteConfig.orderOnlineUrl) {
      window.open(siteConfig.orderOnlineUrl, "_blank");
    }
  };

  return (
    <section id="visit" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-warm-brown mb-12">
            📍 Visit Us
          </h2>
          <Card className="border-2 border-warm-brown/10 mb-8">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-warm-red flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Location</h3>
                    <p className="text-muted-foreground">
                      {siteConfig.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-warm-red flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Opening Hours
                    </h3>
                    <p className="text-muted-foreground">
                      Mon – Sun: 11:00 AM – 10:30 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-warm-red flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                    <p className="text-muted-foreground">
                      {siteConfig.phone || "[Phone Number]"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-warm-red hover:bg-warm-red/90"
              onClick={handleCall}
              disabled={!siteConfig.phone}
            >
              📞 Call Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-warm-red text-warm-red hover:bg-warm-red/10"
              onClick={handleWhatsApp}
              disabled={!siteConfig.phone && !siteConfig.whatsappPhone}
            >
              📲 Order on WhatsApp
            </Button>
            <Button
              size="lg"
              className="bg-warm-yellow hover:bg-warm-yellow/90 text-warm-brown"
              onClick={handleOrderOnline}
              disabled={!siteConfig.orderOnlineUrl}
            >
              🛵 Order Online
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
