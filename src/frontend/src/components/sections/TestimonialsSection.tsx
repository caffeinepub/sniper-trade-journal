import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  "Best donuts in town!",
  "Pizza was cheesy and fresh.",
  "My go-to place for evening snacks.",
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-warm-cream">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-warm-brown mb-12">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial}
                className="border-2 border-warm-yellow/50 bg-warm-yellow/10 hover:shadow-lg transition-all"
              >
                <CardContent className="p-6 text-center">
                  <Quote className="w-10 h-10 text-warm-red mx-auto mb-4" />
                  <p className="text-lg font-medium text-warm-brown italic">
                    {testimonial}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
