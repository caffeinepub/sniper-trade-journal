import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const menuCategories = [
  {
    icon: "🍩",
    title: "DONUTS",
    description: "Soft, fluffy, and freshly glazed — the perfect sweet escape.",
    sections: [
      {
        subtitle: "Classic Donuts",
        items: [
          { name: "Classic Glazed", price: "₹49" },
          { name: "Chocolate Dip", price: "₹55" },
          { name: "Strawberry Frosted", price: "₹55" },
          { name: "Caramel Crunch", price: "₹59" },
          { name: "Cinnamon Sugar", price: "₹49" },
        ],
      },
      {
        subtitle: "Premium Donuts",
        items: [
          { name: "Nutella Filled", price: "₹89" },
          { name: "Oreo Blast", price: "₹85" },
          { name: "KitKat Crush", price: "₹85" },
          { name: "White Chocolate Almond", price: "₹79" },
          { name: "Lotus Biscoff", price: "₹89" },
        ],
      },
      {
        subtitle: "Donut Boxes",
        items: [
          { name: "Box of 4", price: "₹199" },
          { name: "Box of 6", price: "₹299" },
          { name: "Party Box (12 pcs)", price: "₹549" },
        ],
      },
    ],
  },
  {
    icon: "🍕",
    title: "PIZZAS",
    description: "Cheesy, flavorful, and baked to perfection.",
    sections: [
      {
        subtitle: "Personal (7 inch)",
        items: [
          { name: "Margherita", price: "₹129" },
          { name: "Farm Fresh", price: "₹159" },
          { name: "Corn & Cheese", price: "₹149" },
          { name: "Paneer Tikka", price: "₹179" },
        ],
      },
      {
        subtitle: "Medium (10 inch)",
        items: [
          { name: "Margherita", price: "₹249" },
          { name: "Farm Fresh", price: "₹299" },
          { name: "Paneer Tikka", price: "₹329" },
          { name: "Loaded Veggie", price: "₹349" },
        ],
      },
      {
        subtitle: "Add-ons",
        items: [
          { name: "Extra Cheese", price: "₹40" },
          { name: "Extra Toppings", price: "₹30" },
        ],
      },
    ],
  },
  {
    icon: "🍔",
    title: "BURGERS",
    description: "Juicy, loaded, and satisfying.",
    sections: [
      {
        subtitle: "Regular Burgers",
        items: [
          { name: "Classic Veg Burger", price: "₹79" },
          { name: "Aloo Tikki", price: "₹69" },
          { name: "Cheese Burger", price: "₹99" },
          { name: "Paneer Burger", price: "₹119" },
        ],
      },
      {
        subtitle: "Premium Burgers",
        items: [
          { name: "Double Patty Cheese", price: "₹149" },
          { name: "Peri Peri Paneer", price: "₹139" },
          { name: "Mexican Burger", price: "₹149" },
        ],
      },
    ],
  },
  {
    icon: "🍟",
    title: "SIDES",
    description: "Perfect add-ons to complete your meal.",
    sections: [
      {
        subtitle: "",
        items: [
          { name: "French Fries", price: "₹89" },
          { name: "Peri Peri Fries", price: "₹109" },
          { name: "Garlic Bread", price: "₹99" },
          { name: "Cheese Garlic Bread", price: "₹129" },
          { name: "Nachos with Dip", price: "₹119" },
        ],
      },
    ],
  },
  {
    icon: "🥤",
    title: "BEVERAGES",
    description: "Cool, refreshing, and irresistible.",
    sections: [
      {
        subtitle: "",
        items: [
          { name: "Cold Coffee", price: "₹99" },
          { name: "Iced Latte", price: "₹109" },
          { name: "Oreo Shake", price: "₹139" },
          { name: "Chocolate Shake", price: "₹129" },
          { name: "Strawberry Shake", price: "₹129" },
          { name: "Fresh Lime", price: "₹49" },
          { name: "Soft Drinks", price: "₹49" },
        ],
      },
    ],
  },
];

export function MenuPreviewSection() {
  return (
    <section id="menu" className="py-16 md:py-24 bg-warm-cream">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-warm-brown mb-4">
            Fresh. Hot. Made for You.
          </h2>
          <p className="text-lg md:text-xl text-warm-brown/80">
            Every item is prepared with care using quality ingredients and bold
            flavors.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {menuCategories.map((category) => (
            <Card
              key={category.title}
              className="border-2 border-warm-brown/10"
            >
              <CardHeader className="bg-warm-yellow/20">
                <CardTitle className="text-2xl md:text-3xl font-bold text-warm-brown flex items-center gap-2">
                  <span className="text-3xl">{category.icon}</span>
                  {category.title}
                </CardTitle>
                <p className="text-warm-brown/80 italic">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {category.sections.map((section) => (
                  <div
                    key={section.subtitle ?? category.title}
                    className="mb-6 last:mb-0"
                  >
                    {section.subtitle && (
                      <h4 className="font-semibold text-lg text-warm-red mb-3">
                        {section.subtitle}
                      </h4>
                    )}
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex justify-between items-center py-1 border-b border-warm-brown/5 last:border-0"
                        >
                          <span className="text-foreground">{item.name}</span>
                          <span className="font-semibold text-warm-red">
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
