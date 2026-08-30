import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-12 text-center max-w-md w-full">
        {/* Large 404 */}
        <h1 className="text-8xl font-extrabold text-white/20 leading-none">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Page Not Found
        </h2>
        <p className="mt-3 text-white/70">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Back to home button */}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/40 to-emerald-500/40 backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] text-white rounded-xl px-6 py-3 font-medium hover:from-teal-500/60 hover:to-emerald-500/60 transition-all duration-300"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
