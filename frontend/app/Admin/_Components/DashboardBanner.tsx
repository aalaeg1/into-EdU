"use client";

export function DashboardBanner() {
  const userName = "Admin";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <section className="relative mx-4 mt-4 mb-2 rounded-2xl bg-[#3D5CFF] flex items-center min-h-[140px] px-10 py-7 overflow-hidden shadow-md" style={{borderRadius: '18px'}}>
      <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 900 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle cx="120" cy="60" r="22" fill="#fff" opacity="0.08" />
          <circle cx="300" cy="100" r="14" fill="#fff" opacity="0.06" />
          <circle cx="500" cy="40" r="18" fill="#fff" opacity="0.07" />
          <circle cx="700" cy="120" r="20" fill="#fff" opacity="0.05" />
          <circle cx="820" cy="50" r="10" fill="#fff" opacity="0.07" />
          <circle cx="200" cy="150" r="8" fill="#fff" opacity="0.06" />
          <circle cx="850" cy="150" r="12" fill="#fff" opacity="0.05" />
          <circle cx="400" cy="130" r="10" fill="#fff" opacity="0.07" />
          <g opacity="0.10">
            <path d="M180 80 l4 8 l-8 0 l4 -8" fill="#fff" />
            <path d="M600 60 l5 10 l-10 0 l5 -10" fill="#fff" />
            <path d="M750 100 l3 6 l-6 0 l3 -6" fill="#fff" />
          </g>
        </g>
      </svg>
      <div className="flex flex-col justify-center z-10 text-left">
        <h2 className="text-white font-bold uppercase text-lg md:text-2xl tracking-wider mb-1" style={{letterSpacing: '0.08em'}}>Welcome back, {userName}!</h2>
        <div className="text-xs uppercase text-white opacity-80 mb-2 tracking-widest">{today}</div>
        <div className="text-white text-base md:text-lg font-normal tracking-wide" style={{letterSpacing: '0.04em'}}>Manage Users, Monitor Activity, And Keep The Platform Running Smoothly.</div>
      </div>
      <div className="absolute top-0 right-6 z-20 animate-float" style={{minWidth: '170px'}}>
        <svg width="170" height="110" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="120" rx="60" ry="10" fill="#23233B" opacity="0.18" />
          <rect x="65" y="75" width="70" height="32" rx="8" fill="#23233B" />
          <polygon points="100,30 185,60 100,90 15,60" fill="#23233B" stroke="#181828" strokeWidth="3" />
          <path d="M100 60 Q120 80 140 60" stroke="#FFD600" strokeWidth="4" fill="none" />
          <rect x="138" y="60" width="6" height="28" rx="3" fill="#FFD600" />
          <circle cx="141" cy="92" r="6" fill="#FFD600" />
          <circle cx="140" cy="60" r="3.5" fill="#FFD600" />
        </svg>
      </div>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        .animate-float {
          animation: float 3.2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}