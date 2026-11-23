import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

interface ComponentInfoPanelProps {
  componentId: string | null;
  projectId: string;
  onClose: () => void;
  onViewConstructionGuide: () => void;
}

interface ComponentDetail {
  component_name: string;
  category: string;
  purpose: string;
  installation_location?: string;
  dimensions: { width: number; depth: number; height: number };
  specifications: Record<string, string>;
  materials: { name: string; quantity: number; unit: string }[];
  installation_procedure: string[];
  safety_considerations: string[];
  estimated_cost_usd: number;
  construction_stage: number;
}

const MOCK_DETAIL: ComponentDetail = {
  component_name: 'Server Rack',
  category: 'Server Infrastructure',
  purpose: 'Houses server blades, network switches, and storage units in organized rack units',
  installation_location: 'Row-A, Position 1 — Cold Aisle Facing',
  dimensions: { width: 0.8, depth: 1.0, height: 2.2 },
  specifications: {
    'Form Factor': '42U Standard 19-inch Rail',
    'Load Capacity': '1500 kg',
    'Airflow': 'Front-to-rear',
  },
  materials: [
    { name: 'Steel Rack Frame', quantity: 1, unit: 'unit' },
    { name: 'Cable Management Arm', quantity: 2, unit: 'pcs' },
  ],
  installation_procedure: [
    'Mark rack footprint on raised floor',
    'Anchor to floor with seismic bolts',
    'Install PDU rail',
    'Mount servers top-to-bottom',
    'Connect power and data cables',
  ],
  safety_considerations: [
    'Use anti-tip straps',
    'Two-person lift for heavy equipment',
    'Ground all equipment before powering',
  ],
  estimated_cost_usd: 12500,
  construction_stage: 3,
};

function categoryColor(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('server') || lower.includes('compute')) {
    return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
  }
  if (lower.includes('cool')) {
    return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
  }
  if (lower.includes('electrical') || lower.includes('pdu') || lower.includes('ups')) {
    return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
  }
  return 'bg-violet-500/20 text-violet-300 border border-violet-500/40';
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-200 font-mono">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 bg-black/20 space-y-2 text-xs font-mono text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
}

export const ComponentInfoPanel: React.FC<ComponentInfoPanelProps> = ({
  componentId,
  projectId,
  onClose,
  onViewConstructionGuide,
}) => {
  const [detail, setDetail] = useState<ComponentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!componentId) return;

    setDetail(null);
    setError(null);
    setLoading(true);

    fetch(`/api/simulator/${projectId}/component/${componentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ComponentDetail) => {
        setDetail(data);
      })
      .catch(() => {
        // Fallback to mock
        setDetail(MOCK_DETAIL);
        setError('Using demo data (API unavailable)');
      })
      .finally(() => setLoading(false));
  }, [componentId, projectId]);

  if (!componentId) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={componentId}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-96 z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(10,11,16,0.97) 0%, rgba(15,18,30,0.97) 100%)',
          borderLeft: '1px solid rgba(0,240,255,0.15)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex-1 pr-3">
            {loading ? (
              <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                  {detail?.component_name ?? 'Component'}
                </h2>
                {detail && (
                  <span
                    className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${categoryColor(detail.category)}`}
                  >
                    {detail.category}
                  </span>
                )}
              </>
            )}
            {error && (
              <p className="text-[10px] text-yellow-400/70 mt-1 font-mono">{error}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Loading component data…</p>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Overview */}
              <CollapsibleSection title="📋 Overview">
                <p className="text-slate-300 leading-relaxed">{detail.purpose}</p>
                {detail.installation_location && (
                  <div className="mt-2 flex gap-2">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-cyan-300">{detail.installation_location}</span>
                  </div>
                )}
              </CollapsibleSection>

              {/* Specifications */}
              <CollapsibleSection title="⚙️ Specifications">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Dimensions</span>
                  <span className="text-slate-200">
                    {detail.dimensions.width}m × {detail.dimensions.depth}m × {detail.dimensions.height}m
                  </span>
                </div>
                {Object.entries(detail.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-200 text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </CollapsibleSection>

              {/* Materials */}
              <CollapsibleSection title="🏗️ Materials Required">
                {detail.materials.map((mat, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-300">{mat.name}</span>
                    <span className="text-cyan-300 font-semibold">
                      {mat.quantity} {mat.unit}
                    </span>
                  </div>
                ))}
              </CollapsibleSection>

              {/* Installation Procedure */}
              <CollapsibleSection title="🔧 Installation Procedure">
                <ol className="space-y-2 list-none">
                  {detail.installation_procedure.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] flex items-center justify-center font-bold border border-cyan-500/30">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 leading-tight">{step}</span>
                    </li>
                  ))}
                </ol>
              </CollapsibleSection>

              {/* Safety Considerations */}
              <CollapsibleSection title="⚠️ Safety Considerations">
                {detail.safety_considerations.map((item, i) => (
                  <div key={i} className="flex gap-2 py-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </CollapsibleSection>

              {/* Cost Estimate */}
              <CollapsibleSection title="💰 Cost Estimate">
                <div className="text-center py-2">
                  <span className="text-2xl font-black text-cyan-300">
                    ${detail.estimated_cost_usd.toLocaleString()}
                  </span>
                  <span className="text-slate-400 ml-1 text-xs">USD (estimated)</span>
                </div>
                <p className="text-slate-500 text-[10px] text-center leading-tight">
                  Construction Stage {detail.construction_stage} · Estimate may vary based on market conditions
                </p>
              </CollapsibleSection>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!loading && detail && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onViewConstructionGuide}
              className="w-full py-3 rounded-xl font-bold text-sm font-mono tracking-widest text-black flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg shadow-cyan-500/20"
              style={{
                background: 'linear-gradient(90deg, #00F0FF 0%, #0EA5E9 100%)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              VIEW CONSTRUCTION GUIDE
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
