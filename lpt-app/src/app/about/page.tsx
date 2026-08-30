"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  DollarSign,
  Map,
  Send,
  Users,
} from "lucide-react";

/* ============================================================
   ABOUT PAGE — Client Component (contact form)
   ============================================================ */

/* ——— Team data ——— */
const team = [
  {
    name: "Alex Rivera",
    title: "CEO & Founder",
    initials: "AR",
    bio: "Former county appraiser with 15 years of experience in property valuation. Founded LowPropTax to make the appeal process accessible to every homeowner.",
  },
  {
    name: "Jessica Park",
    title: "Head of Appeals",
    initials: "JP",
    bio: "Licensed property tax consultant who has successfully represented over 300 appeals. Specializes in residential and commercial property assessments.",
  },
  {
    name: "Michael Torres",
    title: "Lead Data Analyst",
    initials: "MT",
    bio: "Data scientist with a background in real estate analytics. Builds the comparable sales models and valuation tools that power our appeal strategy.",
  },
];

/* ——— Company stats ——— */
const stats = [
  { icon: Calendar, value: "2020", label: "Founded" },
  { icon: FileText, value: "500+", label: "Appeals Filed" },
  { icon: DollarSign, value: "$2.1M+", label: "Total Saved" },
  { icon: Map, value: "50+", label: "Counties Served" },
];

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would submit to an API
    alert("Thank you for your message! We will get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <>
      {/* ——— Page Header ——— */}
      <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            About LowPropTax
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            We are on a mission to help every property owner pay only their fair
            share of property taxes.
          </p>
        </div>
      </section>

      {/* ——— Mission Statement ——— */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-10 sm:p-14 text-center">
            <Users className="w-12 h-12 text-teal-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Property taxes are one of the largest expenses homeowners and
              investors face, yet millions of properties are over-assessed every
              year. LowPropTax was founded to level the playing field. We
              combine deep expertise in property valuation with powerful data
              tools to help our clients identify over-assessments and
              successfully appeal for fair values. Whether you are a first-time
              homeowner or a seasoned investor, everyone deserves to pay only
              what they owe.
            </p>
          </div>
        </div>
      </section>

      {/* ——— Team Section ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Meet Our Team</h2>
            <p className="mt-3 text-white/70">
              Experienced professionals dedicated to lowering your property
              taxes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 text-center"
              >
                {/* Avatar (initials) */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/40 to-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-bold text-white">
                    {member.initials}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-teal-400 font-medium mt-1 mb-4">
                  {member.title}
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Company Stats ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-6 text-center"
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

      {/* ——— Contact Section ——— */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Get in Touch</h2>
            <p className="mt-3 text-white/70">
              Have questions? We would love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        className="w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="How can we help?"
                      className="w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us more about your property tax situation..."
                      className="w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-6 py-3 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 space-y-6">
                <h3 className="text-lg font-semibold text-white">
                  Contact Information
                </h3>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Address</p>
                    <p className="text-sm text-white/60">
                      1200 Main Street, Suite 400
                      <br />
                      Houston, TX 77002
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <p className="text-sm text-white/60">(713) 555-0142</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-sm text-white/60">
                      support@lowproptax.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-6 text-center">
                <p className="text-sm text-white/70">
                  <span className="text-white font-medium">Office Hours:</span>
                  <br />
                  Mon - Fri: 8:00 AM - 6:00 PM CST
                  <br />
                  Sat: 9:00 AM - 1:00 PM CST
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
