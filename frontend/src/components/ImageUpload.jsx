import { useState, useRef, useEffect } from 'react'

const ACCEPTED = '.jpg,.jpeg,.png,.webp'
const MAX_MB = 20

const LOADING_STEPS = [
  { label: 'Preprocessing X-ray image',        duration: 600  },
  { label: 'Running EfficientNet-B4 inference', duration: 1800 },
  { label: 'Generating Grad-CAM heatmap',       duration: 1200 },
  { label: 'Computing confidence scores',       duration: 600  },
]

function LoadingOverlay() {
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalDuration = LOADING_STEPS.reduce((s, st) => s + st.duration, 0)
    const start = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / totalDuration) * 100, 95)
      setProgress(pct)

      let cumulative = 0
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        cumulative += LOADING_STEPS[i].duration
        if (elapsed < cumulative) {
          setActiveStep(i)
          break
        }
        if (i === LOADING_STEPS.length - 1) setActiveStep(i)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/20 bg-[#0d1117] p-5 overflow-hidden relative">
      {/* Scan line animation */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none"
        style={{ top: `${progress}%`, transition: 'top 0.1s linear' }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-60" />
        </div>
        <span className="text-sm text-white font-medium">Scanning X-ray…</span>
        <span className="ml-auto text-xs text-slate-500 font-mono">{Math.round(progress)}%</span>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-5">
        {LOADING_STEPS.map((step, i) => {
          const done = i < activeStep
          const active = i === activeStep
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                done ? 'bg-cyan-500/20 border border-cyan-500/50' :
                active ? 'bg-cyan-500/10 border border-cyan-400/60' :
                'bg-[#1e2128] border border-[#2a2f3a]'
              }`}>
                {done ? (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : active ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                )}
              </div>
              <span className={`text-xs transition-colors duration-300 ${
                done ? 'text-slate-500 line-through decoration-slate-600' :
                active ? 'text-white' :
                'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#1e2128] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default function ImageUpload({ onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  function handleFile(f) {
    setError(null)
    if (!f) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(f.type)) {
      setError('Please upload a JPEG or PNG image.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max size is ${MAX_MB} MB.`)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleSubmit() {
    if (!file || loading) return
    onSubmit(file)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">

      {!file ? (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center gap-5 p-16
            ${dragging
              ? 'border-cyan-400 bg-cyan-400/5 scale-[1.01]'
              : 'border-[#1e2128] hover:border-cyan-500/40 hover:bg-white/[0.02]'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {/* Lung icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            dragging ? 'bg-cyan-400/15 border border-cyan-400/30' : 'bg-[#111318] border border-[#1e2128]'
          }`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className={dragging ? 'text-cyan-400' : 'text-slate-500'}>
              {/* Lungs outline */}
              <path d="M12 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 6C10 6 7 7 6 9c-1 2-1 4-1 6 0 2 1 3.5 2.5 3.5S10 17 10 15v-3l2-1.5 2 1.5v3c0 2 1 3.5 2.5 3.5S19 17 19 15c0-2 0-4-1-6-1-2-4-3-6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="text-center">
            <p className="text-white font-semibold text-base mb-1.5">
              {dragging ? 'Drop X-ray here' : 'Drop a chest X-ray here'}
            </p>
            <p className="text-slate-500 text-sm mb-3">or <span className="text-cyan-400 hover:text-cyan-300">click to browse</span></p>
            <p className="text-slate-600 text-xs">JPEG · PNG · WebP · up to {MAX_MB} MB</p>
          </div>

          {/* Corner decoration */}
          {dragging && (
            <>
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
            </>
          )}
        </div>
      ) : (
        /* Preview card */
        <div className="rounded-2xl border border-[#1e2128] bg-[#111318] overflow-hidden">
          {/* Image */}
          <div className="relative bg-black flex items-center justify-center" style={{ minHeight: 320 }}>
            <img
              src={preview}
              alt="X-ray preview"
              className="max-h-80 w-auto object-contain"
              style={{ filter: 'contrast(1.15) brightness(1.05)' }}
            />
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)' }}
            />
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-cyan-400/40 rounded-tl" />
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-cyan-400/40 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-cyan-400/40 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-cyan-400/40 rounded-br" />
          </div>

          {/* Actions bar */}
          <div className="px-5 py-4 flex items-center justify-between gap-4 border-t border-[#1e2128]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#1a1f2a] border border-[#2a2f3a] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · ready to analyze</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setFile(null); setPreview(null); setError(null) }}
                disabled={loading}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-[#1e2128] hover:border-slate-500 rounded-lg transition-colors disabled:opacity-40"
              >
                Replace
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
              >
                {loading ? 'Analyzing…' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 justify-center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-red-400 shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && <LoadingOverlay />}
    </div>
  )
}
