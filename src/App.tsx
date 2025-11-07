import React, { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, Label } from 'recharts'
import { Save, RefreshCw, Search, Settings, BookOpen, FileSpreadsheet, BarChart3, Tag, Trash2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

// Your company's color theme
const THEME = {
  navy: '#2C3550',
  cyan: '#03B1ED',
  black: '#000000',
  darkGray: '#989898',
  lightGray: '#D2D2D2',
  white: '#FFFFFF',
}

// Criteria based on GSAIF framework
const DEFAULT_CRITERIA = [
  { key: 'businessValue', label: 'Business Value', help: 'ROI potential, revenue impact, cost savings', weight: 0.25 },
  { key: 'strategicAlignment', label: 'Strategic Alignment', help: 'Fit with corporate objectives, competitive advantage', weight: 0.20 },
  { key: 'technicalFeasibility', label: 'Technical Feasibility', help: 'Data availability, complexity, technology readiness', weight: 0.20 },
  { key: 'implementationEffort', label: 'Implementation Effort', help: 'Time, cost, resources required', weight: 0.15 },
  { key: 'changeImpact', label: 'Change Impact', help: 'Organizational readiness, user adoption risk', weight: 0.10 },
  { key: 'ethicalRisk', label: 'Ethical Risk', help: 'Bias, privacy, regulatory compliance concerns', weight: 0.10 },
]

const DEFAULT_WEIGHTS = {
  businessValue: 0.25,
  strategicAlignment: 0.20,
  technicalFeasibility: 0.20,
  implementationEffort: 0.15,
  changeImpact: 0.10,
  ethicalRisk: 0.10,
}

const DEFAULT_THRESHOLDS = { immediate: 7.5, strong: 5.5 }

function clamp(n: number, min = 0, max = 10) { return Math.max(min, Math.min(max, n)) }
function round2(n: number) { return Math.round(n * 100) / 100 }

function computeWeightedScore(scores: any, weights: any) {
  const invEffort = 10 - clamp(scores.implementationEffort ?? 0)
  const total =
    (scores.businessValue ?? 0) * (weights.businessValue ?? 0) +
    (scores.strategicAlignment ?? 0) * (weights.strategicAlignment ?? 0) +
    (scores.technicalFeasibility ?? 0) * (weights.technicalFeasibility ?? 0) +
    invEffort * (weights.implementationEffort ?? 0) +
    (scores.changeImpact ?? 0) * (weights.changeImpact ?? 0) +
    (scores.ethicalRisk ?? 0) * (weights.ethicalRisk ?? 0)
  return round2(total)
}

function classify(score: number, thresholds: any) {
  if (score >= thresholds.immediate) return { label: 'Quick Win', tone: 'navy', priority: 'High' }
  if (score >= thresholds.strong) return { label: 'Strategic Bet', tone: 'cyan', priority: 'Medium' }
  return { label: 'Fill-In', tone: 'gray', priority: 'Low' }
}

function toImpactEffort(scores: any) {
  const impact = round2(((scores.businessValue ?? 0) + (scores.strategicAlignment ?? 0)) / 2)
  const effort = round2(scores.implementationEffort ?? 0)
  return { impact, effort }
}

export default function App() {
  const [tab, setTab] = useState('score')
  const [title, setTitle] = useState('Untitled Use Case')
  const [owner, setOwner] = useState('')
  const [tags, setTags] = useState('')
  const [scores, setScores] = useState({
    businessValue: 8, strategicAlignment: 7, technicalFeasibility: 6,
    implementationEffort: 5, changeImpact: 5, ethicalRisk: 5,
  })
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [search, setSearch] = useState('')

  const total = useMemo(() => computeWeightedScore(scores, weights), [scores, weights])
  const label = useMemo(() => classify(total, thresholds), [total, thresholds])
  const { impact, effort } = useMemo(() => toImpactEffort(scores), [scores])

  function updateScore(key: string, val: number) { setScores(s => ({ ...s, [key]: clamp(val) })) }
  function updateWeight(key: string, val: string) { setWeights(w => ({ ...w, [key]: Math.max(0, Math.min(1, Number(val))) })) }
  function resetForm() {
    setTitle('Untitled Use Case'); setOwner(''); setTags('');
    setScores({ businessValue: 0, strategicAlignment: 0, technicalFeasibility: 0, implementationEffort: 0, changeImpact: 0, ethicalRisk: 0 })
  }
  function saveToPortfolio() {
    const item = {
      id: crypto.randomUUID(),
      title, owner, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      scores: { ...scores }, weights: { ...weights }, thresholds: { ...thresholds },
      total, label, impact, effort, createdAt: new Date().toISOString(),
    }
    setPortfolio(p => [item, ...p])
  }
  function removeFromPortfolio(id: string) { setPortfolio(p => p.filter(x => x.id !== id)) }

  const filtered = portfolio.filter(item => {
    const q = search.trim().toLowerCase(); if (!q) return true
    return item.title.toLowerCase().includes(q) || (item.owner||'').toLowerCase().includes(q) || (item.tags||[]).some((t: string) => t.toLowerCase().includes(q))
  })

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0)
  const isWeightValid = Math.abs(weightSum - 1) < 0.01

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to br, #F8F9FA, #E9ECEF)', color: THEME.black}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: `linear-gradient(135deg, ${THEME.navy}, ${THEME.cyan})`}}>
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{color: THEME.navy}}>AI Incubator Scorecard</h1>
                <p className="text-sm mt-1" style={{color: THEME.darkGray}}>GSAIF Framework • Use Case Prioritization</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border bg-white hover:bg-gray-50 transition-all shadow-sm" style={{borderColor: THEME.lightGray, color: THEME.black}}>
                <RefreshCw size={16}/> Reset
              </button>
              <button onClick={saveToPortfolio} className="px-4 py-2 rounded-xl text-sm text-white inline-flex items-center gap-2 hover:opacity-90 transition-all shadow-md" style={{background: `linear-gradient(135deg, ${THEME.cyan}, #029ACF)`}}>
                <Save size={16}/> Save to Portfolio
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-lg" style={{borderColor: THEME.lightGray}}>
          <div className="flex overflow-x-auto border-b" style={{borderColor: THEME.lightGray}}>
            <Tab label="Score Use Case" id="score" active={tab==='score'} onClick={()=>setTab('score')} icon={FileSpreadsheet} />
            <Tab label="Configure Weights" id="weights" active={tab==='weights'} onClick={()=>setTab('weights')} icon={Settings} />
            <Tab label="Results & Matrix" id="result" active={tab==='result'} onClick={()=>setTab('result')} icon={BarChart3} />
            <Tab label="Portfolio View" id="portfolio" active={tab==='portfolio'} onClick={()=>setTab('portfolio')} icon={BookOpen} />
          </div>

          {tab==='score' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{color: THEME.navy}}>Use Case Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField label="Use Case Title" value={title} onChange={setTitle} placeholder="e.g., AI-Powered Customer Churn Prediction" />
                  <TextField label="Owner / Team" value={owner} onChange={setOwner} placeholder="e.g., Data Science Team" />
                  <TextField label="Tags" value={tags} onChange={setTags} placeholder="e.g., NLP, Customer Analytics" />
                </div>
              </div>
              
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{color: THEME.navy}}>Evaluation Criteria (1-10 Scale)</h2>
                <div className="text-xs px-3 py-1.5 rounded-full" style={{background: THEME.cyan + '20', color: THEME.cyan}}>
                  Based on GSAIF Framework
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {DEFAULT_CRITERIA.map(c => (
                  <NumberInput key={c.key} label={c.label} help={c.help} weight={c.weight} value={scores[c.key as keyof typeof scores] ?? 0} onChange={v => updateScore(c.key, v)} />
                ))}
              </div>
            </div>
          )}

          {tab==='weights' && (
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{color: THEME.navy}}>Criterion Weights</h2>
                  <div className={`text-sm px-3 py-1.5 rounded-full flex items-center gap-2 ${isWeightValid ? 'bg-green-50' : 'bg-orange-50'}`} style={{color: isWeightValid ? '#059669' : '#EA580C'}}>
                    {isWeightValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    Total: {round2(weightSum)} {isWeightValid ? '✓' : '(Must equal 1.0)'}
                  </div>
                </div>
                <p className="text-sm mb-6" style={{color: THEME.darkGray}}>Adjust the relative importance of each criterion. All weights must sum to 1.0.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {DEFAULT_CRITERIA.map(c => (
                  <div key={c.key} className="p-4 rounded-xl border" style={{borderColor: THEME.lightGray, background: '#FAFBFC'}}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" style={{color: THEME.navy}}>{c.label}</label>
                      <input type="number" step="0.01" min="0" max="1" className="w-24 border rounded-lg px-3 py-1.5 text-right font-mono text-sm" style={{borderColor: THEME.lightGray, color: THEME.black}} value={weights[c.key as keyof typeof weights] ?? 0} onChange={e => updateWeight(c.key, e.target.value)} />
                    </div>
                    <p className="text-xs" style={{color: THEME.darkGray}}>{c.help}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl" style={{background: THEME.navy + '08', border: `1px solid ${THEME.navy}20`}}>
                <h3 className="font-medium mb-4" style={{color: THEME.navy}}>Classification Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white">
                    <label className="text-sm font-medium" style={{color: THEME.darkGray}}>Quick Win (Immediate) ≥</label>
                    <input type="number" step="0.1" min="0" max="10" className="w-24 border rounded-lg px-3 py-1.5 text-right font-mono" style={{borderColor: THEME.lightGray}} value={thresholds.immediate} onChange={e => setThresholds(t => ({ ...t, immediate: Number(e.target.value) }))} />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white">
                    <label className="text-sm font-medium" style={{color: THEME.darkGray}}>Strategic Bet ≥</label>
                    <input type="number" step="0.1" min="0" max="10" className="w-24 border rounded-lg px-3 py-1.5 text-right font-mono" style={{borderColor: THEME.lightGray}} value={thresholds.strong} onChange={e => setThresholds(t => ({ ...t, strong: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='result' && (
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-semibold mb-4" style={{color: THEME.navy}}>Impact-Effort Matrix</h2>
                  <Matrix name={title} impact={impact} effort={effort} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold" style={{color: THEME.navy}}>Evaluation Summary</h2>
                  
                  <div className="p-5 rounded-xl border" style={{borderColor: THEME.lightGray, background: 'linear-gradient(135deg, #FAFBFC, #FFFFFF)'}}>
                    <div className="text-xs uppercase tracking-wide mb-2" style={{color: THEME.darkGray}}>Weighted Score</div>
                    <div className="text-4xl font-bold mb-1" style={{color: THEME.cyan}}>{total}</div>
                    <div className="text-xs" style={{color: THEME.darkGray}}>out of 10.0</div>
                  </div>

                  <div className="p-5 rounded-xl border" style={{borderColor: THEME.lightGray, background: 'white'}}>
                    <div className="text-xs uppercase tracking-wide mb-3" style={{color: THEME.darkGray}}>Classification</div>
                    <Pill tone={label.tone} size="lg">{label.label}</Pill>
                    <div className="mt-3 pt-3 border-t" style={{borderColor: THEME.lightGray}}>
                      <div className="text-xs" style={{color: THEME.darkGray}}>Priority: <span className="font-medium" style={{color: THEME.black}}>{label.priority}</span></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border" style={{borderColor: THEME.lightGray, background: 'white'}}>
                    <div className="text-xs uppercase tracking-wide mb-3" style={{color: THEME.darkGray}}>Key Metrics</div>
                    <div className="space-y-2">
                      <MetricRow label="Impact Score" value={impact} max={10} color={THEME.cyan} />
                      <MetricRow label="Effort Score" value={effort} max={10} color={THEME.darkGray} />
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs" style={{borderColor: THEME.lightGray, color: THEME.darkGray}}>
                      Impact = avg(Business Value, Strategic Alignment)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='portfolio' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold" style={{color: THEME.navy}}>Portfolio Overview</h2>
                  <p className="text-sm mt-1" style={{color: THEME.darkGray}}>{portfolio.length} use case{portfolio.length !== 1 ? 's' : ''} saved</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color: THEME.darkGray}} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, owner, or tags..." className="pl-10 pr-4 py-2.5 text-sm border rounded-xl bg-white w-80" style={{borderColor: THEME.lightGray, color: THEME.black}} />
                </div>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: THEME.lightGray + '50'}}>
                    <BookOpen size={32} style={{color: THEME.darkGray}} />
                  </div>
                  <p className="text-sm" style={{color: THEME.darkGray}}>
                    {portfolio.length === 0 ? 'No use cases saved yet. Start by scoring a use case!' : 'No results found.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map(item => (
                    <PortfolioItem key={item.id} item={item} onRemove={() => removeFromPortfolio(item.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Tab({ id, label, active, onClick, icon: Icon }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-all hover:bg-gray-50 ${active ? 'text-white' : ''}`} style={{borderColor: active ? THEME.cyan : 'transparent', color: active ? THEME.white : THEME.darkGray, background: active ? THEME.navy : 'transparent'}}>
      {Icon && <Icon size={18} />} {label}
    </button>
  )
}

function Pill({ children, tone = 'navy', size = 'md' }: any) {
  const map: any = { navy: THEME.navy, cyan: THEME.cyan, gray: THEME.darkGray }
  const bg = map[tone] || THEME.navy
  const fg = tone === 'gray' ? THEME.black : '#ffffff'
  const padding = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'
  return <span className={`inline-flex items-center rounded-full font-medium ${padding}`} style={{background: bg, color: fg}}>{children}</span>
}

function TextField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" style={{color: THEME.navy}}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-all" style={{borderColor: THEME.lightGray, color: THEME.black}} placeholder={placeholder} />
    </div>
  )
}

function NumberInput({ value, onChange, min = 0, max = 10, step = 1, label, help, weight }: any) {
  return (
    <div className="p-5 rounded-xl border" style={{borderColor: THEME.lightGray, background: 'white'}}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{color: THEME.navy}}>{label}</span>
            {weight && <span className="text-xs px-2 py-0.5 rounded" style={{background: THEME.cyan + '20', color: THEME.cyan}}>Weight: {Math.round(weight * 100)}%</span>}
          </div>
          <p className="text-xs" style={{color: THEME.darkGray}}>{help}</p>
        </div>
        <input type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(clamp(Number(e.target.value), min, max))} className="w-16 border rounded-lg px-2 py-1.5 text-center font-semibold ml-3" style={{borderColor: THEME.lightGray, color: THEME.black, fontSize: '16px'}} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(clamp(Number(e.target.value), min, max))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{accentColor: THEME.cyan, background: `linear-gradient(to right, ${THEME.cyan} 0%, ${THEME.cyan} ${value * 10}%, ${THEME.lightGray} ${value * 10}%, ${THEME.lightGray} 100%)`}} />
    </div>
  )
}

function MetricRow({ label, value, max, color }: any) {
  const percentage = (value / max) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{color: THEME.darkGray}}>{label}</span>
        <span className="text-sm font-semibold" style={{color: THEME.black}}>{value}/{max}</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{background: THEME.lightGray}}>
        <div className="h-full rounded-full transition-all" style={{width: `${percentage}%`, background: color}} />
      </div>
    </div>
  )
}

function Matrix({ name, impact = 0, effort = 0 }: any) {
  const QUADRANT = { impact: 5, effort: 5 }
  const dot = [{ x: impact, y: effort, name }]
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{background: 'white', borderColor: THEME.lightGray}}>
          <p className="text-sm font-medium mb-1" style={{color: THEME.navy}}>{payload[0].payload.name}</p>
          <p className="text-xs" style={{color: THEME.darkGray}}>Impact: {payload[0].payload.x}</p>
          <p className="text-xs" style={{color: THEME.darkGray}}>Effort: {payload[0].payload.y}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full aspect-square bg-white rounded-2xl p-6 border shadow-sm" style={{borderColor: THEME.lightGray}}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" domain={[0,10]} tick={{ fontSize: 12, fill: THEME.darkGray }} tickLine={false}>
            <Label value="Impact →" position="insideBottom" offset={-10} style={{ fill: THEME.navy, fontWeight: 600, fontSize: 13 }} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[0,10]} tick={{ fontSize: 12, fill: THEME.darkGray }} tickLine={false} reversed>
            <Label value="Effort →" angle={-90} position="insideLeft" offset={10} style={{ fill: THEME.navy, fontWeight: 600, fontSize: 13 }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={QUADRANT.impact} stroke={THEME.darkGray} strokeDasharray="3 3" strokeWidth={1.5} />
          <ReferenceLine y={QUADRANT.effort} stroke={THEME.darkGray} strokeDasharray="3 3" strokeWidth={1.5} />
          
          <ReferenceArea x1={QUADRANT.impact} x2={10} y1={0} y2={QUADRANT.effort} fill={THEME.cyan} fillOpacity={0.15} />
          <ReferenceArea x1={0} x2={QUADRANT.impact} y1={0} y2={QUADRANT.effort} fill={THEME.lightGray} fillOpacity={0.25} />
          <ReferenceArea x1={QUADRANT.impact} x2={10} y1={QUADRANT.effort} y2={10} fill={THEME.navy} fillOpacity={0.12} />
          <ReferenceArea x1={0} x2={QUADRANT.impact} y1={QUADRANT.effort} y2={10} fill={THEME.darkGray} fillOpacity={0.15} />
          
          <Scatter name={name} data={dot} fill={THEME.cyan} stroke={THEME.navy} strokeWidth={2} r={8} />
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-xs font-medium" style={{color: THEME.darkGray}}>■ Fill-Ins</div>
        <div className="text-xs font-medium" style={{color: THEME.cyan}}>■ Quick Wins</div>
        <div className="text-xs font-medium" style={{color: THEME.darkGray}}>■ Avoid</div>
        <div className="text-xs font-medium" style={{color: THEME.navy}}>■ Strategic Bets</div>
      </div>
    </div>
  )
}

function PortfolioItem({ item, onRemove }: any) {
  const { title, owner, tags = [], total, label, impact, effort, createdAt } = item
  return (
    <div className="rounded-xl p-5 flex items-start justify-between hover:shadow-md transition-all bg-white border" style={{borderColor: THEME.lightGray}}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-base" style={{color: THEME.navy}}>{title}</span>
          <Pill tone={label.tone}>{label.label}</Pill>
        </div>
        <div className="flex items-center gap-4 text-xs mb-3" style={{color: THEME.darkGray}}>
          <span>Owner: <span className="font-medium" style={{color: THEME.black}}>{owner || 'Unassigned'}</span></span>
          <span>Score: <span className="font-medium" style={{color: THEME.cyan}}>{total}</span></span>
          <span>Impact: {impact}</span>
          <span>Effort: {effort}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {tags.map((t: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{border: `1px solid ${THEME.lightGray}`, color: THEME.darkGray, background: '#FAFBFC'}}>
                <Tag size={11} /> {t}
              </span>
            ))}
          </div>
        )}
        <div className="text-[10px]" style={{color: THEME.darkGray}}>Saved {new Date(createdAt).toLocaleString()}</div>
      </div>
      <button onClick={onRemove} className="px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 hover:bg-red-50 transition-all ml-4" style={{border: `1px solid ${THEME.lightGray}`, color: '#DC2626'}}>
        <Trash2 size={14}/> Remove
      </button>
    </div>
  )
}