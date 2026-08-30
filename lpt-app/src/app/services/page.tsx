"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Wrench,
  Building2,
  Check,
  ChevronDown,
  ArrowRight,
  X,
} from "lucide-react";
import { mockServices } from "@/lib/data/services";

/* ============================================================
   SERVICES PAGE — Client Component (FAQ toggle)
   ============================================================ */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Wrench,
  Building2,
};

/* ——— FAQ Data ——— */
const faqs = [
  {
    q: "How long does the property tax appeal process take?",
    a: "The timeline varies by county, but most appeals take 2-6 months from filing to resolution. Our Full Service team manages the entire timeline so you don't have to worry about deadlines or follow-ups.",
  },
  {
    q: "What if my appeal is unsuccessful?",
    a: "With our Full Service plan, we offer a money-back guarantee. If we don't reduce your assessment, you don't pay. For DIY customers, we provide all the tools and data you need to make the strongest possible case.",
  },
  {
    q: "Do I need to attend the hearing in person?",
    a: "With Full Service, our experts attend the hearing on your behalf. You never need to take time off work or appear in person. With DIY, you may need to attend, but we provide thorough preparation materials.",
  },
  {
    q: "How do you determine if my property is over-assessed?",
    a: "We analyze your property's assessed value against comparable recent sales in your area, adjusting for differences in size, condition, location, and features. If the data suggests your assessment is higher than it should be, there is a strong case for appeal.",
  },
  {
    q: "Can I appeal my property taxes every year?",
    a: "Yes! Property assessments change annually, and you have the right to appeal each year. Many of our clients appeal annually to ensure their assessment stays fair. We make the process easy to repeat year after year.",
  },
  {
    q: "What areas do you serve?",
    a: "We currently serve properties across Texas, Illinois, Arizona, Georgia, and Florida, covering 50+ counties. We are expanding to more states soon. Contact us to check if your county is supported.",
  },
];

/* ——— FAQ Item Component ——— */
function FAQItem({ q, a }: { q: string; a: string }) {
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

/* ——— Comparison Features ——— */
const comparisonFeatures = [
  { feature: "Property Data Access", diy: true, full: true, investor: true },
  { feature: "Comparable Sales Report", diy: true, full: true, investor: true },
  { feature: "Assessment Analysis", diy: true, full: true, investor: true },
  { feature: "Filing Instructions", diy: true, full: true, investor: true },
  { feature: "Email Support", diy: true, full: true, investor: true },
  { feature: "Appeal Preparation", diy: false, full: true, investor: true },
  { feature: "Hearing Representation", diy: false, full: true, investor: true },
  { feature: "Money-Back Guarantee", diy: false, full: true, investor: true },
  { feature: "Dedicated Account Manager", diy: false, full: false, investor: true },
  { feature: "Portfolio Dashboard", diy: false, full: false, investor: true },
  { feature: "Batch Processing", diy: false, full: false, investor: true },
  { feature: "Priority Support", diy: false, full: false, investor: true },
  { feature: "Volume Discounts", diy: false, full: false, investor: true },
];

export default function ServicesPage() {
  return (
    <>
      {/* ——— Page Header ——— */}
      <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            Our Services
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            From DIY tools to full-service management, we offer the right
            solution for every property owner. Choose your path to lower taxes.
          </p>
        </div>
      </section>

      {/* ——— Service Detail Cards ——— */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {mockServices.map((service) => {
            const Icon = iconMap[service.icon] || Shield;
            return (
              <div
                key={service.id}
                className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 sm:p-10"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  {/* Left — Icon + Title + Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-7 h-7 text-teal-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        {service.name}
                      </h2>
                    </div>
                    <p className="text-white/70 leading-relaxed mb-6">
                      {service.longDescription}
                    </p>
                    <p className="text-sm text-white/50 italic">
                      <span className="text-teal-400 font-medium not-italic">
                        Ideal for:
                      </span>{" "}
                      {service.idealFor}
                    </p>
                  </div>

                  {/* Right — Features list + CTA */}
                  <div className="lg:w-80 shrink-0">
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                      What&apos;s included
                    </h4>
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2 text-sm text-white/80"
                        >
                          <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/pricing"
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-5 py-2.5 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
                    >
                      View Pricing
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ——— Comparison Table ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">
              Compare Our Plans
            </h2>
            <p className="mt-3 text-white/70">
              See exactly what each plan includes side by side.
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] rounded-[16px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white/60">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-white">
                      DIY
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-teal-400">
                      Full Service
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-white">
                      Investor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={
                        idx < comparisonFeatures.length - 1
                          ? "border-b border-white/5"
                          : ""
                      }
                    >
                      <td className="py-3 px-6 text-sm text-white/80">
                        {row.feature}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.diy ? (
                          <Check className="w-4 h-4 text-teal-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-white/20 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-teal-500/5">
                        {row.full ? (
                          <Check className="w-4 h-4 text-teal-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-white/20 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.investor ? (
                          <Check className="w-4 h-4 text-teal-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-white/20 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ——— FAQ Section ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-white/70">
              Everything you need to know about our services.
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] rounded-[16px] px-6 sm:px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-10 sm:p-14">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
              Choose the plan that works for you and start saving on your
              property taxes today.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-8 py-3 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
