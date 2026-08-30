import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  FileSearch,
  FileText,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { mockProcessSteps } from "@/lib/data/process-steps";

export const metadata: Metadata = {
  title: "How It Works",
};

/* ============================================================
   HOW IT WORKS PAGE — Server Component
   ============================================================ */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  FileSearch,
  FileText,
  Users,
  DollarSign,
};

export default function HowItWorksPage() {
  return (
    <>
      {/* ——— Page Header ——— */}
      <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            How It Works
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Our simple, proven process makes it easy to lower your property
            taxes. Here is exactly what happens from start to finish.
          </p>
        </div>
      </section>

      {/* ——— Process Steps — Desktop Horizontal / Mobile Vertical ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* ---- Desktop: Horizontal layout ---- */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-teal-500/40 via-emerald-500/40 to-teal-500/40" />

              <div className="grid grid-cols-5 gap-6">
                {mockProcessSteps.map((step) => {
                  const Icon = iconMap[step.icon] || Search;
                  return (
                    <div key={step.step} className="text-center relative">
                      {/* Numbered circle */}
                      <div className="w-32 h-32 mx-auto rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] flex items-center justify-center mb-6 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex flex-col items-center justify-center">
                          <Icon className="w-7 h-7 text-teal-400" />
                          <span className="text-xs font-bold text-teal-400 mt-1">
                            {step.step}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---- Mobile / Tablet: Vertical timeline ---- */}
          <div className="lg:hidden">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500/40 via-emerald-500/40 to-teal-500/40" />

              <div className="space-y-10">
                {mockProcessSteps.map((step) => {
                  const Icon = iconMap[step.icon] || Search;
                  return (
                    <div key={step.step} className="relative flex gap-6">
                      {/* Circle on timeline */}
                      <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-teal-400" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.15)] rounded-[16px] p-6 flex-1">
                        <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                          Step {step.step}
                        </span>
                        <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— CTA Section ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-10 sm:p-14">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Saving?
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
              Search your property to see how much you could save on your next
              tax bill. It takes less than a minute.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-8 py-3 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
              >
                Search Your Property
                <Search className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-transparent border border-[rgba(255,255,255,0.3)] text-white rounded-xl px-8 py-3 font-medium hover:bg-[rgba(255,255,255,0.1)] transition-all duration-300"
              >
                View Services
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
