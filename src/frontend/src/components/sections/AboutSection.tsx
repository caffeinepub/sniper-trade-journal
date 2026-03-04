export function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-8 text-warm-brown">
            🧁 More Than Just a Café
          </h2>
          <div className="space-y-6 text-lg md:text-xl text-foreground/90 leading-relaxed">
            <p>
              At Donut Bakery Café, we started with one simple idea — serve
              happiness in every bite.
            </p>
            <p>
              What began as a small donut counter quickly became a local
              favorite. Soon, our customers asked for more. So we added
              handcrafted pizzas, loaded burgers, crispy sides, and refreshing
              shakes.
            </p>
            <p>
              Today, we are proud to be your go-to hangout spot — whether you're
              catching up with friends, celebrating something special, or just
              craving something delicious.
            </p>
            <p className="font-semibold text-warm-red text-center text-xl md:text-2xl pt-4">
              We don't just serve food.
              <br />
              We serve comfort, freshness, and flavor — every single day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
