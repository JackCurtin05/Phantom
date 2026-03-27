export default function Navbar({ onReset }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2128] bg-[#0a0c10]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <button onClick={onReset} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/60 transition-colors">
            {/* Lung / scan icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
              <path d="M12 3v3M12 3C9 3 4 5 4 12c0 4 2 7 5 8v-5l3-2 3 2v5c3-1 5-4 5-8 0-7-5-9-8-9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-wide text-sm">Phantom</span>
          <span className="hidden sm:inline text-[10px] text-cyan-500/70 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            X-RAY AI
          </span>
        </button>

        {/* Right side info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-600">
            <span className="px-2 py-1 rounded bg-[#111318] border border-[#1e2128] text-slate-500">EfficientNet-B4</span>
            <span className="px-2 py-1 rounded bg-[#111318] border border-[#1e2128] text-slate-500">14 conditions</span>
            <span className="px-2 py-1 rounded bg-[#111318] border border-[#1e2128] text-slate-500">NIH ChestX-ray14</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Research Preview</span>
          </div>
        </div>

      </div>
    </nav>
  )
}
