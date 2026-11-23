import React from 'react';
import { OptimizationData } from '../types';
import {
  Sliders, TrendingUp, ShieldCheck, Sparkles, Wind,
  Layers, AlertCircle, ArrowRight
} from 'lucide-react';

interface OptimizerPageProps {
  optimization: OptimizationData | null;
  onApplyOptimizationTo3D: () => void;
}

export const OptimizerPage: React.FC<OptimizerPageProps> = ({
  optimization,
  onApplyOptimizationTo3D,
}) => {
  if (!optimization) {
    return (
      <div className="p-12 text-center text-muted-silver font-mono">
        Running ASHRAE TC 9.9 compliance audit...
      </div>
    );
  }

  const { efficiency_score, thermal_balance_score, compliance_score, suggestions, layout_diff_summary } = optimization;

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Heuristic Algorithmic Optimization
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Design Optimizer & Compliance Engine
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Spatial reasoning and clearance evaluations based on ASHRAE TC 9.9, ANSI/TIA-942, and NFPA 70 standards.
          </p>
        </div>

        <button
          onClick={onApplyOptimizationTo3D}
          className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,214,201,0.25)] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Recommended 3D Layout</span>
        </button>
      </div>

      {/* Benchmark Compliance Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Score 1 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>EFFICIENCY RATING</span>
            <TrendingUp className="w-4 h-4 text-electric-teal" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-electric-teal font-serif">{efficiency_score}</span>
            <span className="text-muted-silver text-xs font-mono">/ 100</span>
          </div>
          <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-electric-teal h-full shadow-[0_0_8px_#00D6C9]" style={{ width: `${efficiency_score}%` }} />
          </div>
          <span className="text-[11px] font-mono text-electric-teal block">+14% potential gain through containment</span>
        </div>

        {/* Score 2 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>THERMAL BALANCE</span>
            <Wind className="w-4 h-4 text-controlled-emerald" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-controlled-emerald font-serif">{thermal_balance_score}</span>
            <span className="text-muted-silver text-xs font-mono">/ 100</span>
          </div>
          <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-controlled-emerald h-full shadow-[0_0_8px_#00B894]" style={{ width: `${thermal_balance_score}%` }} />
          </div>
          <span className="text-[11px] font-mono text-controlled-emerald block">Delta-T across aisle: 11.2°C nominal</span>
        </div>

        {/* Score 3 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>STANDARDS COMPLIANCE</span>
            <ShieldCheck className="w-4 h-4 text-champagne-bronze" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-champagne-bronze font-serif">{compliance_score}</span>
            <span className="text-muted-silver text-xs font-mono">/ 100</span>
          </div>
          <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-champagne-bronze h-full shadow-[0_0_8px_#C6A477]" style={{ width: `${compliance_score}%` }} />
          </div>
          <span className="text-[11px] font-mono text-warm-ivory block font-bold">ASHRAE TC 9.9 & TIA-942 Tier III</span>
        </div>
      </div>

      {/* Differential Analysis Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
        <h3 className="font-serif text-xl font-bold text-warm-ivory flex items-center gap-2">
          <Sliders className="w-5 h-5 text-electric-teal" />
          Layout Differential Analysis (Current vs Optimized)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-muted-silver">Current PUE</span>
            <div className="text-2xl font-bold text-warm-ivory">{layout_diff_summary.current_pue}</div>
            <span className="text-controlled-emerald font-bold block">Optimized: {layout_diff_summary.optimized_pue}</span>
          </div>

          <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-muted-silver">Rack Capacity</span>
            <div className="text-2xl font-bold text-warm-ivory">{layout_diff_summary.current_rack_count} Cabinets</div>
            <span className="text-electric-teal font-bold block">Max: {layout_diff_summary.optimized_rack_capacity} Cabinets</span>
          </div>

          <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-muted-silver">Annual Power Savings</span>
            <div className="text-2xl font-bold text-electric-teal">
              {(layout_diff_summary.potential_annual_power_savings_kwh / 1000).toFixed(1)}k kWh
            </div>
            <span className="text-muted-silver/80 block">~$11,500 / year</span>
          </div>

          <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-muted-silver">Thermal Headroom</span>
            <div className="text-2xl font-bold text-controlled-emerald">
              +{layout_diff_summary.thermal_headroom_margin_c}°C
            </div>
            <span className="text-muted-silver/80 block">{layout_diff_summary.cooling_redundancy_level}</span>
          </div>
        </div>
      </div>

      {/* Actionable Improvement Suggestions */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-warm-ivory">Actionable Engineering Recommendations</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md hover:border-electric-teal/40 transition-colors space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-electric-teal uppercase tracking-wider">
                  {s.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase bg-titanium-charcoal border-white/10 text-warm-ivory">
                  {s.severity} Priority
                </span>
              </div>

              <h4 className="font-serif text-base font-bold text-warm-ivory">{s.title}</h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-mono text-muted-silver uppercase text-[10px] block font-bold">Current Geometry:</span>
                  <p className="text-muted-silver/90 mt-0.5">{s.current_state}</p>
                </div>

                <div>
                  <span className="font-mono text-electric-teal uppercase text-[10px] block font-bold">Recommended Action:</span>
                  <p className="text-warm-ivory mt-0.5 font-medium">{s.recommended_action}</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col gap-0.5 text-[11px] font-mono text-controlled-emerald">
                  <span>Gain: {s.expected_gain}</span>
                  <span className="text-muted-silver">Standard: {s.ashrae_standard}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OptimizerPage;
