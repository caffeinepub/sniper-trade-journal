import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const bestSellers = [
  "Nutella Filled Donut",
  "Paneer Tikka Pizza",
  "Double Patty Cheese Burger",
  "Oreo Blast Shake",
  "Peri Peri Fries",
  "Classic Donut Box",
];

export function BestSellersSection() {
  const handleExploreMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  return (
    <section id="best-sellers" className="py-16 md:py-24 bg-warm-cream">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-warm-brown mb-4">
            🔥 Our Crowd Favorites
          </h2>
          <p className="text-lg md:text-xl text-warm-brown/80">
            These are the dishes our customers can't stop ordering.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {bestSellers.map((item) => (
            <Card
              key={item}
              className="border-2 border-warm-brown/10 hover:border-warm-red/30 transition-all hover:shadow-lg"
            >
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-warm-brown">
                  {item}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button
            size="lg"
            className="bg-warm-red hover:bg-warm-red/90 text-white px-8"
            onClick={handleExploreMenu}
          >
            👉 Explore Full Menu
          </Button>
        </div>
      </div>
    </section>
  );
}
