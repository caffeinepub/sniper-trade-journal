import { Check } from "lucide-react";

const reasons = [
  "Fresh ingredients daily",
  "Fast service",
  "Affordable pricing",
  "Perfect for friends & families",
  "Hygienic preparation",
  "Great taste, every time",
];

export function WhyChooseUsSection() {
  return (
    <section className="py-16 md:py-24 bg-warm-cream">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-warm-brown mb-12">
            ⭐ Why Choose Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-3 bg-background p-4 rounded-lg shadow-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warm-red flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-medium text-warm-brown">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
