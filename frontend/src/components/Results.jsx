import { useState } from 'react'

const SEVERITY_STYLES = {
  none:     { badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', bar: 'from-emerald-600 to-emerald-400', ring: '#10b981', dot: 'bg-emerald-400' },
  low:      { badge: 'bg-sky-500/10     border-sky-500/30     text-sky-400',     bar: 'from-sky-600     to-sky-400',     ring: '#38bdf8', dot: 'bg-sky-400'     },
  moderate: { badge: 'bg-amber-500/10   border-amber-500/30   text-amber-400',   bar: 'from-amber-600   to-amber-400',   ring: '#f59e0b', dot: 'bg-amber-400'   },
  high:     { badge: 'bg-red-500/10     border-red-500/30     text-red-400',     bar: 'from-red-600     to-red-400',     ring: '#ef4444', dot: 'bg-red-400'     },
}

const CONDITION_INFO = {
  'No Finding':         { severity: 'none',     description: 'No significant abnormalities detected. Lung fields appear clear.' },
  'Atelectasis':        { severity: 'moderate', description: 'Partial or complete collapse of lung tissue, reducing oxygen exchange.' },
  'Cardiomegaly':       { severity: 'moderate', description: 'Enlarged cardiac silhouette, may indicate heart failure or other cardiac conditions.' },
  'Effusion':           { severity: 'moderate', description: 'Excess fluid between the lung and chest wall (pleural effusion).' },
  'Infiltration':       { severity: 'moderate', description: 'Substance denser than air detected in lung tissue — may be fluid, pus, or blood.' },
  'Mass':               { severity: 'high',     description: 'Abnormal opacity larger than 3cm. Requires follow-up to rule out malignancy.' },
  'Nodule':             { severity: 'moderate', description: 'Small round opacity (<3cm). May require monitoring depending on characteristics.' },
  'Pneumonia':          { severity: 'high',     description: 'Lung infection causing consolidation and inflammation.' },
  'Consolidation':      { severity: 'high',     description: 'Lung tissue filled with fluid or pus instead of air, impairing gas exchange.' },
  'Edema':              { severity: 'high',     description: 'Excess fluid accumulation in lung tissue, often from cardiac or renal causes.' },
  'Emphysema':          { severity: 'moderate', description: 'Damaged and enlarged air sacs reducing breathing efficiency.' },
  'Fibrosis':           { severity: 'moderate', description: 'Scarring of lung tissue that progressively reduces lung capacity.' },
  'Pleural Thickening': { severity: 'low',      description: 'Thickening of the pleural membrane surrounding the lungs.' },
  'Hernia':             { severity: 'moderate', description: 'Organ or tissue displaced through an abnormal opening into the chest cavity.' },
}

const ALL_CONDITIONS = [
  'No Finding', 'Atelectasis', 'Cardiomegaly', 'Effusion',
  'Infiltration', 'Mass', 'Nodule', 'Pneumonia',
  'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
  'Pleural Thickening', 'Hernia'
]

/* ── SVG confidence ring ─────────────────────────────────── */
function ConfidenceRing({ score, severity, size = 140 }) {
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.none
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1e2128"
          strokeWidth="10"
        />
        {/* Glow under ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={styles.ring}
          strokeWidth="10"
          strokeOpacity="0.12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `blur(4px)` }}
        />
        {/* Ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={styles.ring}
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="monospace">
          {score.toFixed(0)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="10">
          confidence
        </text>
      </svg>
    </div>
  )
}

/* ── Horizontal condition bar ───────────────────────────── */
function ConditionRow({ name, score, flagged, expanded, onToggle }) {
  const info = CONDITION_INFO[name] || { severity: 'none' }
  const sev = flagged ? info.severity : 'none'
  const styles = SEVERITY_STYLES[sev]

  return (
    <div className={`rounded-lg transition-colors ${flagged ? 'bg-[#141920] border border-[#252b35]' : ''}`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        onClick={flagged ? onToggle : undefined}
        style={{ cursor: flagged ? 'pointer' : 'default' }}
      >
        {/* Dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${flagged ? styles.dot : 'bg-slate-700'}`} />

        {/* Name */}
        <span className={`text-xs flex-1 ${flagged ? 'text-white font-medium' : 'text-slate-600'}`}>{name}</span>

        {/* Score */}
        <span className={`text-xs font-mono shrink-0 ${flagged ? styles.badge.split(' ').pop() : 'text-slate-700'}`}>
          {score.toFixed(1)}%
        </span>

        {/* Chevron (flagged only) */}
        {flagged && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div className="h-1 bg-[#1e2128] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${flagged ? styles.bar : 'from-slate-800 to-slate-700'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Expandable description */}
      {flagged && expanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-xs text-slate-400 leading-relaxed border-t border-[#1e2128] pt-2.5">
            {info.description}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Main Results component ─────────────────────────────── */
export default function Results({ result, onReset }) {
  const [showHeatmap, setShowHeatmap]   = useState(false)
  const [showAll, setShowAll]           = useState(false)
  const [expandedRow, setExpandedRow]   = useState(null)

  const { primary, primary_info, flagged, scores, original_image, heatmap_image, disclaimer } = result
  const severity   = primary_info?.severity || 'none'
  const styles     = SEVERITY_STYLES[severity]
  const primaryScore = scores[primary] || 0

  const flaggedNonNormal = flagged.filter(c => c !== 'No Finding')
  const hasFindings = flaggedNonNormal.length > 0

  const sortedConditions = [...ALL_CONDITIONS].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
  const visibleConditions = showAll ? sortedConditions : sortedConditions.slice(0, 8)

  function toggleRow(name) {
    setExpandedRow(prev => prev === name ? null : name)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">

      {/* Disclaimer */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-400 shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-amber-300/70">{disclaimer}</p>
      </div>

      {/* ── Top row: image + primary finding ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Image viewer */}
        <div className="rounded-xl border border-[#1e2128] bg-[#111318] overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[#1e2128]">
            {['Original', 'Grad-CAM'].map((label, i) => (
              <button
                key={label}
                onClick={() => setShowHeatmap(i === 1)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  showHeatmap === (i === 1)
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Image */}
          <div className="relative bg-black flex items-center justify-center p-4" style={{ minHeight: 280 }}>
            <img
              src={showHeatmap ? heatmap_image : original_image}
              alt={showHeatmap ? 'Grad-CAM heatmap' : 'X-ray'}
              className="max-h-64 w-auto object-contain rounded"
              style={!showHeatmap ? { filter: 'contrast(1.1) brightness(1.05)' } : {}}
            />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-cyan-400/25 rounded-tl" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-cyan-400/25 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-cyan-400/25 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-cyan-400/25 rounded-br" />
          </div>

          {showHeatmap && (
            <div className="px-4 py-2.5 border-t border-[#1e2128]">
              <p className="text-xs text-slate-500">
                Red/yellow regions indicate highest activation for <span className="text-white">{primary}</span> prediction.
              </p>
            </div>
          )}
        </div>

        {/* Primary finding + confidence ring */}
        <div className="space-y-4">

          {/* Primary card with ring */}
          <div className="rounded-xl border border-[#1e2128] bg-[#111318] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Primary Finding</p>
            <div className="flex items-center gap-5">
              <ConfidenceRing score={primaryScore} severity={severity} size={130} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h2 className={`text-xl font-bold ${styles.badge.split(' ').pop()}`}>{primary}</h2>
                  <span className={`shrink-0 px-2 py-0.5 rounded-md border text-xs font-medium uppercase tracking-wide ${styles.badge}`}>
                    {severity === 'none' ? 'normal' : severity}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{primary_info?.description}</p>
              </div>
            </div>
          </div>

          {/* Flagged conditions chips */}
          {hasFindings && (
            <div className="rounded-xl border border-[#1e2128] bg-[#111318] p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Flagged</p>
                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] border border-red-500/20 font-mono">
                  {flaggedNonNormal.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {flaggedNonNormal.map(cond => {
                  const info = CONDITION_INFO[cond] || { severity: 'moderate' }
                  const s = SEVERITY_STYLES[info.severity]
                  return (
                    <span key={cond} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${s.badge}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {cond}
                      <span className="opacity-60">·</span>
                      {scores[cond]?.toFixed(0)}%
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Normal result summary */}
          {!hasFindings && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-400 text-sm font-medium">No abnormalities detected</p>
                  <p className="text-slate-500 text-xs mt-0.5">All 14 conditions below detection threshold</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── All 14 conditions breakdown ──── */}
      <div className="rounded-xl border border-[#1e2128] bg-[#111318] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">All Conditions</p>
          <p className="text-xs text-slate-600">Click flagged conditions to expand</p>
        </div>
        <div className="space-y-1">
          {visibleConditions.map(cond => (
            <ConditionRow
              key={cond}
              name={cond}
              score={scores[cond] || 0}
              flagged={flagged.includes(cond)}
              expanded={expandedRow === cond}
              onToggle={() => toggleRow(cond)}
            />
          ))}
        </div>
        {sortedConditions.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            {showAll ? '↑ Show fewer' : `↓ Show all ${ALL_CONDITIONS.length} conditions`}
          </button>
        )}
      </div>

      {/* ── Footer ─────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onReset}
          className="px-6 py-2.5 text-sm font-medium border border-[#1e2128] hover:border-slate-500 text-slate-400 hover:text-white rounded-xl transition-colors"
        >
          ← Analyze another X-ray
        </button>
      </div>

    </div>
  )
}
