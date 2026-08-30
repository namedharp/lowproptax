import Link from "next/link";
import {
  Shield,
  Wrench,
  Building2,
  Search,
  FileSearch,
  FileText,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { mockTestimonials } from "@/lib/data/testimonials";

/* ============================================================
   HOME PAGE — Server Component
   ============================================================ */

export default function HomePage() {
  return (
    <>
      {/* ——— HERO SECTION ——— */}
      <section className="min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Lower Your Property Taxes.{" "}
              <span className="text-teal-400">
                Keep More of What&apos;s Yours.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed">
              Professional property tax appeal services for homeowners and
              investors. Save thousands annually with our proven approach.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-6 py-3 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="bg-transparent backdrop-blur-[12px] border border-[rgba(255,255,255,0.3)] text-white rounded-xl px-6 py-3 font-medium hover:bg-[rgba(255,255,255,0.1)] transition-all duration-300"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Right — Floating stats card */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 space-y-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-white/90">
                Proven Results
              </h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">$3,200</p>
                    <p className="text-sm text-white/60">Average Savings</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">92%</p>
                    <p className="text-sm text-white/60">Success Rate</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-sm text-white/60">Appeals Filed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— TRUST BAR ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: FileText,
                value: "500+",
                label: "Appeals Filed",
              },
              {
                icon: DollarSign,
                value: "$2.1M+",
                label: "Total Saved",
              },
              {
                icon: TrendingUp,
                value: "92%",
                label: "Success Rate",
              },
              {
                icon: Star,
                value: "4.9/5",
                label: "Client Rating",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-5 text-center"
              >
                <stat.icon className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— SERVICES OVERVIEW ——— */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How We Can Help
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
              Choose the service level that fits your needs. From DIY tools to
              full-service management, we have you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Full Service */}
            <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Full Service
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                We manage your entire property tax appeal from start to finish,
                including filing and hearing representation.
              </p>
              <Link
                href="/services"
                className="text-teal-400 text-sm font-medium inline-flex items-center gap-1 hover:text-teal-300 transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* DIY Tools */}
            <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5">
                <Wrench className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                DIY Tools
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Use our data and tools to file your own appeal and save. Get
                professional-grade reports at an affordable price.
              </p>
              <Link
                href="/services"
                className="text-teal-400 text-sm font-medium inline-flex items-center gap-1 hover:text-teal-300 transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Investor Portfolio */}
            <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Investor Portfolio
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Bulk property tax appeals for real estate investors. Maximize
                savings across your entire portfolio.
              </p>
              <Link
                href="/services"
                className="text-teal-400 text-sm font-medium inline-flex items-center gap-1 hover:text-teal-300 transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ——— HOW IT WORKS PREVIEW ——— */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
              Lower your property taxes in four simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-teal-500/40 via-emerald-500/40 to-teal-500/40" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  step: 1,
                  icon: Search,
                  title: "Search Property",
                  desc: "Enter your address to pull your property details and assessment data.",
                },
                {
                  step: 2,
                  icon: FileSearch,
                  title: "Review Assessment",
                  desc: "We analyze your assessment against comparables to find over-valuations.",
                },
                {
                  step: 3,
                  icon: FileText,
                  title: "File Appeal",
                  desc: "Choose DIY or Full Service and we help prepare and file your appeal.",
                },
                {
                  step: 4,
                  icon: DollarSign,
                  title: "Save Money",
                  desc: "Get a reduced assessment and enjoy lower property taxes every year.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  {/* Numbered circle */}
                  <div className="w-24 h-24 mx-auto rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] flex items-center justify-center mb-5 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-teal-400" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    Step {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— TESTIMONIALS ——— */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              What Our Clients Say
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
              Hear from homeowners and investors who have saved thousands with
              LowPropTax.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {mockTestimonials.slice(0, 3).map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 flex flex-col"
              >
                {/* Star rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-white/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-white/80 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author + Savings */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-white/50">
                      {testimonial.role}, {testimonial.location}
                    </p>
                  </div>
                  <div className="bg-teal-500/20 rounded-lg px-3 py-1">
                    <span className="text-teal-400 text-sm font-semibold">
                      {testimonial.savings}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA SECTION ——— */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-10 sm:p-14 text-center">
            <Award className="w-12 h-12 text-teal-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Lower Your Property Taxes?
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
              Join hundreds of homeowners and investors who save thousands every
              year with LowPropTax. Get started in minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-8 py-3.5 font-medium text-lg hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-white/50">
              No credit card required. Free property assessment.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
