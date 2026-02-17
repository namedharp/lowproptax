"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Shield,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { mockPricing } from "@/lib/data/pricing";

/* ============================================================
   PRICING PAGE — Client Component (FAQ toggle)
   ============================================================ */

/* ——— Pricing FAQ Data ——— */
const pricingFaqs = [
  {
    q: "What does the money-back guarantee cover?",
    a: "Our Full Service and Investor Portfolio plans include a money-back guarantee. If we do not achieve a reduction in your property tax assessment, you pay nothing. The guarantee covers our service fee only, not any government filing fees.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. Our pricing is transparent and all-inclusive. The price you see is the price you pay. There are no hidden fees, setup charges, or surprise costs. Government filing fees, if any, are disclosed upfront before you commit.",
  },
  {
    q: "Can I switch plans after signing up?",
    a: "Yes, you can upgrade your plan at any time. If you start with DIY and decide you want Full Service representation, we can seamlessly transition your appeal. Contact our team to discuss your options.",
  },
  {
    q: "Do you offer volume discounts for investors?",
    a: "Absolutely. Our Investor Portfolio plan includes volume discounts that increase with the size of your portfolio. Contact us for a custom quote based on the number of properties in your portfolio.",
  },
];

/* ——— FAQ Item ——— */
function PricingFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-white font-medium pr-4 group-hover:text-teal-400 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-white/50 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-white/70 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* ——— Page Header ——— */}
      <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
            Only pay when you save.
          </p>
        </div>
      </section>

      {/* ——— Pricing Cards ——— */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
            {mockPricing.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-[16px] p-8 flex flex-col ${
                  tier.highlighted
                    ? "bg-[rgba(255,255,255,0.2)] backdrop-blur-[16px] border-2 border-teal-400/50 shadow-[0_0_30px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,0,0,0.15)]"
                    : "bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                }`}
              >
                {/* Most Popular badge */}
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name + tagline */}
                <h3 className="text-xl font-bold text-white mt-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-white/60 mt-1 mb-6">
                  {tier.tagline}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">
                    {tier.price}
                  </span>
                  {tier.pricePeriod && (
                    <span className="text-sm text-white/50 ml-2">
                      {tier.pricePeriod}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href={tier.ctaHref}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition-all duration-300 ${
                    tier.highlighted
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-lg"
                      : "bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white hover:from-teal-500/60 hover:to-emerald-500/60"
                  }`}
                >
                  {tier.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Guarantee Section ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Savings, No Fee Guarantee
              </h3>
              <p className="text-white/70 leading-relaxed">
                We stand behind our work. If we do not successfully reduce your
                property tax assessment, you do not pay a dime. Our Full Service
                and Investor Portfolio plans are backed by our money-back
                guarantee, so you can appeal with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Pricing FAQ ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Pricing FAQ</h2>
            <p className="mt-3 text-white/70">
              Common questions about our pricing and plans.
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] rounded-[16px] px-6 sm:px-8">
            {pricingFaqs.map((faq) => (
              <PricingFAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
