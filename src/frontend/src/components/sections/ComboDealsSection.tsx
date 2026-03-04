import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const combos = [
  {
    name: "Student Combo",
    price: "₹199",
    items: ["1 Veg Burger", "Fries", "Soft Drink"],
  },
  {
    name: "Sweet Treat Combo",
    price: "₹149",
    items: ["2 Donuts", "Cold Coffee"],
  },
  {
    name: "Family Feast",
    price: "₹599",
    items: ["1 Medium Pizza", "2 Burgers", "4 Donuts", "2 Drinks"],
  },
];

export function ComboDealsSection() {
  return (
    <section id="combos" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-warm-brown mb-4">
            🎉 Better Together
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {combos.map((combo) => (
            <Card
              key={combo.name}
              className="border-2 border-warm-red/20 hover:border-warm-red/40 transition-all hover:shadow-lg"
            >
              <CardHeader className="bg-warm-yellow/10">
                <CardTitle className="text-2xl font-bold text-warm-brown">
                  {combo.name}
                </CardTitle>
                <p className="text-3xl font-bold text-warm-red">
                  {combo.price}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {combo.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-warm-red">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-muted-foreground italic">
          Limited time offers available in-store and online.
        </p>
      </div>
    </section>
  );
}
