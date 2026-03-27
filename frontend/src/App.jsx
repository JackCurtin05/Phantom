import { useState } from 'react'
import Navbar from './components/Navbar'
import ImageUpload from './components/ImageUpload'
import Results from './components/Results'
import './App.css'

const CONDITIONS_PREVIEW = [
  { name: 'Atelectasis',        severity: 'moderate' },
  { name: 'Cardiomegaly',       severity: 'moderate' },
  { name: 'Effusion',           severity: 'moderate' },
  { name: 'Infiltration',       severity: 'moderate' },
  { name: 'Mass',               severity: 'high'     },
  { name: 'Nodule',             severity: 'moderate' },
  { name: 'Pneumonia',          severity: 'high'     },
  { name: 'Consolidation',      severity: 'high'     },
  { name: 'Edema',              severity: 'high'     },
  { name: 'Emphysema',          severity: 'moderate' },
  { name: 'Fibrosis',           severity: 'moderate' },
  { name: 'Pleural Thickening', severity: 'low'      },
  { name: 'Hernia',             severity: 'moderate' },
  { name: 'No Finding',         severity: 'none'     },
]

const SEVERITY_COLORS = {
  none:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  low:      'text-sky-400     bg-sky-500/10     border-sky-500/25',
  moderate: 'text-amber-400   bg-amber-500/10   border-amber-500/25',
  high:     'text-red-400     bg-red-500/10     border-red-500/25',
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  async function handleSubmit(file) {
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Navbar onReset={handleReset} />

      <main className="pt-14">
        {result ? (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <Results result={result} onReset={handleReset} />
          </div>
        ) : (
          <>
            {/* ── Hero ─────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Deep Learning · EfficientNet-B4 · Grad-CAM · NIH ChestX-ray14
              </div>

              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                Chest X-Ray
                <span className="text-cyan-400"> Analysis</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                Upload a chest X-ray to screen for 14 pathological conditions using
                deep learning, with Grad-CAM heatmaps showing exactly where the model is looking.
              </p>
            </div>

            {/* ── Upload ──────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6">
              <ImageUpload onSubmit={handleSubmit} loading={loading} />

              {/* Error */}
              {error && (
                <div className="mt-4 max-w-2xl mx-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-red-400 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* ── Conditions grid ──────────────────────────── */}
            {!loading && (
              <div className="max-w-5xl mx-auto px-6 mt-14 pb-16">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-[#1e2128]" />
                  <p className="text-xs text-slate-600 uppercase tracking-widest font-medium">Detectable Conditions</p>
                  <div className="h-px flex-1 bg-[#1e2128]" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {CONDITIONS_PREVIEW.map(({ name, severity }) => (
                    <div
                      key={name}
                      className={`px-2.5 py-2 rounded-lg border text-center text-xs font-medium ${SEVERITY_COLORS[severity]}`}
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 mt-5">
                  {[
                    { label: 'Normal',   cls: 'bg-emerald-400' },
                    { label: 'Low',      cls: 'bg-sky-400'     },
                    { label: 'Moderate', cls: 'bg-amber-400'   },
                    { label: 'High',     cls: 'bg-red-400'     },
                  ].map(({ label, cls }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className={`w-2 h-2 rounded-full ${cls}`} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Model stats strip */}
                <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: '🧠', label: 'EfficientNet-B4',    sub: 'Fine-tuned on NIH dataset'   },
                    { icon: '🔥', label: 'Grad-CAM Heatmaps',  sub: 'Visual attention overlay'    },
                    { icon: '🩺', label: '14 Conditions',       sub: 'Multi-label classification'  },
                  ].map(({ icon, label, sub }) => (
                    <div key={label} className="text-center p-4 rounded-xl border border-[#1e2128] bg-[#111318]">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-slate-500 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
