export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-12 flex flex-col items-center gap-6">
        {/* Spinning circle */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" />
        </div>

        {/* Pulsing brand text */}
        <div className="animate-pulse">
          <span className="text-2xl font-bold text-white tracking-tight">
            Low<span className="text-teal-400">Prop</span>Tax
          </span>
        </div>

        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}
