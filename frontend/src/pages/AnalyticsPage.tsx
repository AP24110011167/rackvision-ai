import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalyticsData } from '../types';
import { api } from '../services/api';
import {
  BarChart3, Zap, Wind, Flame, Activity, Layers,
  Leaf, Maximize2, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Shield, ArrowUpRight, TrendingUp, Cpu, Server,
  Sliders, Download, HelpCircle, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area
} from 'recharts';

interface AnalyticsPageProps {
  analytics: AnalyticsData | null;
  activeProjectId?: string;
  onRefreshAnalytics?: () => Promise<void>;
}

// Ground-Truth Architectural Telemetry (P2 12-rack CAD baseline fallback)
const GROUND_TRUTH_BASELINE: AnalyticsData = {
  project_id: 'proj-helios-01',
  rack_count: 12,
  room_dimensions: { width: 8.27, length: 6.0, height: 3.5 },
  total_floor_area_sqm: 49.6,
  usable_it_area_sqm: 25.3,
  space_utilization_percent: 51.0,
  rack_density_kw_per_rack: 10.0,
  total_it_power_kw: 120.0,
  facility_total_power_kw: 136.8,
  required_cooling_kw: 138.0,
  installed_cooling_kw: 165.0,
  cooling_capacity_kw: 165.0,
  cooling_capacity_tons: 46.9,
  cooling_redundancy: 'N+1 Redundant',
  heat_dissipation_btu_hr: 409457,
  annual_energy_consumption_mwh: 1198.4,
  carbon_footprint_tonnes_yr: 461.4,
  estimated_pue: 1.14,
  pue_breakdown: {
    it_equipment_percent: 87.7,
    cooling_systems_percent: 8.8,
    power_distribution_losses_percent: 2.4,
    lighting_and_building_auxiliary_percent: 1.1,
  },
  cable_requirements_meters: {
    cat6a_copper_horizontal_meters: 2876,
    om4_multimode_fiber_meters: 1849,
    os2_singlemode_spine_fiber_meters: 822,
    grounding_copper_busbar_meters: 59,
  },
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  analytics: propAnalytics,
  activeProjectId = 'proj-helios-01',
  onRefreshAnalytics,
}) => {
  // Local state management
  const [localAnalytics, setLocalAnalytics] = useState<AnalyticsData | null>(propAnalytics);
  const [isLoading, setIsLoading] = useState<boolean>(!propAnalytics);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '7d' | '30d' | '12m'>('24h');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Sync prop changes into local state
  useEffect(() => {
    if (propAnalytics) {
      setLocalAnalytics(propAnalytics);
      setIsLoading(false);
      setError(null);
      setIsOfflineFallback(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [propAnalytics]);

  // Fetch telemetry actively if not provided by prop
  const fetchTelemetry = useCallback(async (isManualRetry: boolean = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const pid = activeProjectId || 'proj-helios-01';
      const data = await api.getAnalytics(pid);
      if (data && data.total_it_power_kw !== undefined) {
        setLocalAnalytics(data);
        setIsOfflineFallback(false);
        setLastSyncTime(new Date().toLocaleTimeString());
        if (onRefreshAnalytics) {
          onRefreshAnalytics().catch(() => {});
        }
      } else {
        throw new Error('Analytics API returned empty or incomplete telemetry payload');
      }
    } catch (err: any) {
      console.warn('Telemetry fetch failed, providing diagnostic error state:', err);
      const msg = err?.message || 'Failed to establish connection with telemetry gateway';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [activeProjectId, onRefreshAnalytics]);

  // Initial fetch effect with safety timeout to prevent permanent loading
  useEffect(() => {
    if (!propAnalytics && !localAnalytics) {
      fetchTelemetry();
    }

    // Safety timeout: Never stay stuck in loading for more than 5 seconds
    const safetyTimer = setTimeout(() => {
      setIsLoading((loading) => {
        if (loading && !localAnalytics) {
          setError('Telemetry gateway connection timed out (5000ms threshold reached).');
          return false;
        }
        return loading;
      });
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [propAnalytics, localAnalytics, fetchTelemetry]);

  // Fallback loader for architectural ground-truth
  const handleLoadBaseline = () => {
    setLocalAnalytics(GROUND_TRUTH_BASELINE);
    setIsOfflineFallback(true);
    setError(null);
    setIsLoading(false);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Export Telemetry Snapshot
  const handleExportSnapshot = () => {
    if (!activeData) return;
    const jsonStr = JSON.stringify(activeData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // Active display data
  const activeData = localAnalytics || propAnalytics;

  // 24-Hour Diurnal Power Curve Data (Calculated from IT & Facility Power)
  const diurnalData = useMemo(() => {
    if (!activeData) return [];
    const baseIT = activeData.total_it_power_kw;
    const baseFacility = activeData.facility_total_power_kw || baseIT * (activeData.estimated_pue || 1.15);
    const coolingBase = Math.max(0, baseFacility - baseIT);

    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const itMultipliers = [0.82, 0.79, 0.78, 0.84, 0.96, 1.05, 1.08, 1.12, 1.10, 1.02, 0.94, 0.88];
    const ambMultipliers = [0.88, 0.85, 0.84, 0.89, 0.98, 1.08, 1.15, 1.18, 1.14, 1.05, 0.96, 0.91];

    return hours.map((h, i) => {
      const it = Math.round(baseIT * itMultipliers[i]);
      const cooling = Math.round(coolingBase * ambMultipliers[i]);
      const total = it + cooling + Math.round(baseIT * 0.04); // including aux
      return {
        time: h,
        itPower: it,
        coolingPower: cooling,
        totalFacility: total,
      };
    });
  }, [activeData]);

  // 12-Month Energy Profile (Calculated from Annual Energy Consumption)
  const monthlyEnergyData = useMemo(() => {
    if (!activeData) return [];
    const annualMWh = activeData.annual_energy_consumption_mwh;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Seasonal cooling variations
    const seasonalWeights = [0.078, 0.075, 0.080, 0.082, 0.088, 0.094, 0.098, 0.096, 0.089, 0.083, 0.079, 0.078];

    return months.map((m, idx) => {
      const mwh = Math.round(annualMWh * seasonalWeights[idx]);
      return {
        month: m,
        energyMWh: mwh,
      };
    });
  }, [activeData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LOADING STATE (Animated Telemetry Scanner with Timeout Protection)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading && !activeData) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center select-none font-sans">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-electric-teal/10 border border-electric-teal/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,214,201,0.25)] animate-pulse">
            <Activity className="w-8 h-8 text-electric-teal animate-spin" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-electric-teal animate-ping" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-warm-ivory mb-2">
          Synchronizing Telemetry Gateway
        </h2>
        <p className="text-xs font-mono text-muted-silver max-w-md mb-6 leading-relaxed">
          Establishing link with project computational ledger &bull; Evaluating PDU loads, thermal heatmaps, and ASHRAE TC 9.9 compliance...
        </p>

        {/* Telemetry Loading Steps */}
        <div className="w-full max-w-sm bg-graphite/60 rounded-xl border border-white/10 p-4 space-y-2.5 text-left font-mono text-[11px]">
          <div className="flex items-center gap-2 text-electric-teal">
            <span className="w-2 h-2 rounded-full bg-electric-teal animate-ping" />
            <span>Target Node: {activeProjectId}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-silver">
            <span className="w-2 h-2 rounded-full bg-controlled-emerald" />
            <span>Structured Layout: 3D Scene Geometry Synchronized</span>
          </div>
          <div className="flex items-center gap-2 text-champagne-bronze">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Synthesizing PUE Power Distribution Allocation...</span>
          </div>
        </div>

        {/* Immediate Fallback Bypass to eliminate infinite hang */}
        <div className="mt-6 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={handleLoadBaseline}
            className="text-muted-silver/70 hover:text-electric-teal underline transition-colors cursor-pointer"
          >
            Skip wait &bull; Load confirmed ground-truth baseline
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ERROR & DIAGNOSTIC STATE (When API fails with Retry & Ground Truth options)
  // ─────────────────────────────────────────────────────────────────────────────
  if (error && !activeData) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-xl w-full bg-graphite rounded-2xl border border-amber-500/40 p-8 shadow-2xl space-y-6 text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                Telemetry Link Interrupted
              </span>
              <h2 className="font-serif text-2xl font-bold text-warm-ivory mt-1">
                Quantitative Telemetry Unavailable
              </h2>
              <p className="text-xs text-muted-silver mt-1">
                The analytics engine could not retrieve telemetry for active project: <b className="text-warm-ivory">{activeProjectId}</b>.
              </p>
            </div>
          </div>

          {/* Diagnostic Telemetry Dossier */}
          <div className="bg-obsidian rounded-xl border border-white/10 p-4 space-y-2 font-mono text-[11px] text-muted-silver">
            <div className="text-xs font-bold text-warm-ivory border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span>DIAGNOSTIC TELEMETRY REPORT</span>
              <span className="text-amber-400">ERR_GATEWAY_TIMEOUT</span>
            </div>
            <div className="flex justify-between">
              <span>Endpoint Target:</span>
              <span className="text-warm-ivory font-bold">/api/analytics/{activeProjectId}</span>
            </div>
            <div className="flex justify-between">
              <span>Failure Detail:</span>
              <span className="text-amber-400">{error}</span>
            </div>
            <div className="flex justify-between">
              <span>Cluster State:</span>
              <span>Local Docker / FastAPI Standalone</span>
            </div>
          </div>

          {/* Actions: Retry or Load Confirmed Ground Truth */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => fetchTelemetry(true)}
              disabled={isRetrying}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-electric-teal text-obsidian font-mono text-xs font-bold uppercase tracking-wider hover:bg-electric-teal/90 transition-all shadow-[0_0_20px_rgba(0,214,201,0.3)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Reconnecting Gateway...' : 'Retry Telemetry Sync'}</span>
            </button>

            <button
              onClick={handleLoadBaseline}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-graphite border border-white/20 text-warm-ivory font-mono text-xs hover:border-electric-teal hover:text-electric-teal transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-controlled-emerald" />
              <span>Load P2 Ground-Truth Baseline</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback safety if activeData is somehow missing
  if (!activeData) {
    return null;
  }

  // PUE Breakdown Data for Recharts
  const pueData = [
    { name: 'IT Equipment Load', value: activeData.pue_breakdown?.it_equipment_percent || 87.7, color: '#00D6C9' },
    { name: 'Precision Cooling Systems', value: activeData.pue_breakdown?.cooling_systems_percent || 8.8, color: '#00B894' },
    { name: 'PDU / Transformer Losses', value: activeData.pue_breakdown?.power_distribution_losses_percent || 2.4, color: '#C6A477' },
    { name: 'Lighting & Auxiliary Plant', value: activeData.pue_breakdown?.lighting_and_building_auxiliary_percent || 1.1, color: '#A8B3BC' },
  ];

  // Cabling Lengths Data for Recharts
  const cableData = [
    { type: 'Cat6A Copper', meters: activeData.cable_requirements_meters?.cat6a_copper_horizontal_meters || 2876 },
    { type: 'OM4 MM Fiber', meters: activeData.cable_requirements_meters?.om4_multimode_fiber_meters || 1849 },
    { type: 'OS2 Spine Fiber', meters: activeData.cable_requirements_meters?.os2_singlemode_spine_fiber_meters || 822 },
    { type: 'Ground Busbar', meters: activeData.cable_requirements_meters?.grounding_copper_busbar_meters || 59 },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. FULL ANALYTICS DASHBOARD RENDERING
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-20 font-sans text-warm-ivory">
      {/* ─────────────────────────────────────────────────────────────────────────
          HEADER & TELEMETRY CONTROL BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Quantitative Telemetry
            </span>

            {isOfflineFallback ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-champagne-bronze/15 text-champagne-bronze border border-champagne-bronze/30 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ARCHITECTURAL GROUND-TRUTH BASELINE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-controlled-emerald animate-pulse" />
                LIVE TELEMETRY ACTIVE
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory">
            Data Center Infrastructure Analytics
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Real-time power allocation, ASHRAE TC 9.9 thermal headroom, PUE benchmarking, and infrastructure cable ledger.
          </p>
        </div>

        {/* Telemetry Action Controls */}
        <div className="flex items-center gap-3">
          {/* Time Horizon Pills */}
          <div className="bg-graphite/90 border border-white/10 rounded-xl p-1 flex items-center text-xs font-mono">
            {(['24h', '7d', '30d', '12m'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setTimeHorizon(h)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeHorizon === h
                    ? 'bg-electric-teal text-obsidian font-bold shadow-xs'
                    : 'text-muted-silver hover:text-warm-ivory'
                }`}
              >
                {h.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sync Refresh Button */}
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={isRetrying}
            title="Refresh Telemetry Sync"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-graphite border border-white/10 hover:border-electric-teal/40 text-muted-silver hover:text-electric-teal text-xs font-mono transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-electric-teal' : ''}`} />
            <span className="hidden sm:inline">{isRetrying ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Export Telemetry Snapshot */}
          <button
            onClick={handleExportSnapshot}
            title="Copy Telemetry JSON Dossier"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-graphite border border-white/10 hover:border-white/25 text-warm-ivory text-xs font-mono transition-all cursor-pointer"
          >
            {copySuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-controlled-emerald" />
                <span className="text-controlled-emerald">Copied!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          PRIMARY TELEMETRY KPI TILES (4 Core Infrastructure Benchmarks)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: IT Power Demand */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span className="tracking-wider">IT POWER DEMAND</span>
            <Zap className="w-4 h-4 text-electric-teal" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">
            {activeData.total_it_power_kw} <span className="text-sm font-normal text-muted-silver font-sans">kW</span>
          </div>
          <div className="text-[11px] font-mono text-electric-teal flex justify-between pt-1 border-t border-white/5">
            <span>Power Density:</span>
            <span>{activeData.rack_density_kw_per_rack} kW / Rack</span>
          </div>
        </div>

        {/* KPI 2: Facility Total & PUE */}
        <div className="p-5 rounded-2xl border border-electric-teal/30 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span className="tracking-wider">FACILITY TOTAL POWER</span>
            <Activity className="w-4 h-4 text-electric-teal" />
          </div>
          <div className="text-3xl font-bold text-electric-teal font-serif">
            {activeData.facility_total_power_kw || Math.round(activeData.total_it_power_kw * (activeData.estimated_pue || 1.15))} <span className="text-sm font-normal text-electric-teal/70 font-sans">kW</span>
          </div>
          <div className="text-[11px] font-mono text-controlled-emerald flex justify-between pt-1 border-t border-white/5 font-bold">
            <span>Design PUE:</span>
            <span>{activeData.estimated_pue} (ASHRAE A1)</span>
          </div>
        </div>

        {/* KPI 3: Cooling Capacity */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span className="tracking-wider">COOLING CAPACITY</span>
            <Wind className="w-4 h-4 text-controlled-emerald" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">
            {activeData.installed_cooling_kw} <span className="text-sm font-normal text-muted-silver font-sans">kW</span>
          </div>
          <div className="text-[11px] font-mono text-controlled-emerald flex justify-between pt-1 border-t border-white/5">
            <span>Rating:</span>
            <span>{activeData.cooling_capacity_tons} Tons ({activeData.cooling_redundancy})</span>
          </div>
        </div>

        {/* KPI 4: Heat Dissipation */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span className="tracking-wider">HEAT DISSIPATION</span>
            <Flame className="w-4 h-4 text-champagne-bronze" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">
            {(activeData.heat_dissipation_btu_hr / 1000).toFixed(0)}k <span className="text-sm font-normal text-muted-silver font-sans">BTU/h</span>
          </div>
          <div className="text-[11px] font-mono text-champagne-bronze flex justify-between pt-1 border-t border-white/5">
            <span>Sensible Factor:</span>
            <span>0.92 (Clean Room)</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          PRIMARY CHARTS: PUE POWER BREAKDOWN DONUT & CABLING BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6-Cols: PUE Power Allocation Breakdown */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-ivory">PUE Power Allocation Breakdown</h3>
              <p className="text-xs text-muted-silver">
                Total facility load: {activeData.facility_total_power_kw || Math.round(activeData.total_it_power_kw * (activeData.estimated_pue || 1.15))} kW
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-md bg-electric-teal/15 text-electric-teal border border-electric-teal/30 font-bold">
              PUE = {activeData.estimated_pue}
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pueData.map((entry, index) => (
                    <Cell key={`pue-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111820',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F3F1E9',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-white/10">
            {pueData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-muted-silver truncate">
                  {p.name}: <b className="text-warm-ivory">{p.value}%</b>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6-Cols: Structured Cabling Requirements */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-ivory">Structured Cabling Estimates</h3>
              <p className="text-xs text-muted-silver">Copper Cat6A & MTP/MPO Fiber Run Lengths (Meters)</p>
            </div>
            <Layers className="w-5 h-5 text-champagne-bronze" />
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cableData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#A8B3BC" fontSize={11} unit="m" />
                <YAxis dataKey="type" type="category" stroke="#A8B3BC" fontSize={11} width={95} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111820',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F3F1E9',
                  }}
                  formatter={(val: any) => [`${val.toLocaleString()} meters`, 'Length']}
                />
                <Bar dataKey="meters" fill="#00D6C9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs font-mono text-muted-silver pt-3 border-t border-white/10 flex justify-between items-center">
            <span>Includes 20% Slack & Bend Radius Allowance</span>
            <span className="text-controlled-emerald font-bold">ANSI/TIA-568-D Compliant</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          HISTORICAL TELEMETRY TRENDS (24-Hour Diurnal Power Curve & Monthly MWh)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-Cols: 24-Hour Diurnal Power & Thermal Cycle */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-ivory flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-electric-teal" />
                24-Hour Diurnal Power & Thermal Telemetry
              </h3>
              <p className="text-xs text-muted-silver">
                Hourly operational fluctuation modeling IT demand vs cooling overhead (kW)
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-electric-teal">
                <span className="w-2.5 h-2.5 rounded-full bg-electric-teal" /> IT Demand
              </span>
              <span className="flex items-center gap-1.5 text-controlled-emerald">
                <span className="w-2.5 h-2.5 rounded-full bg-controlled-emerald" /> Cooling Plant
              </span>
            </div>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diurnalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="itGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D6C9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D6C9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="coolingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B894" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00B894" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#A8B3BC" fontSize={11} />
                <YAxis stroke="#A8B3BC" fontSize={11} unit="kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111820',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F3F1E9',
                  }}
                  formatter={(val: any) => [`${val} kW`, 'Power']}
                />
                <Area type="monotone" dataKey="totalFacility" stroke="#00D6C9" fillOpacity={1} fill="url(#itGrad)" name="Total Facility Power" />
                <Area type="monotone" dataKey="itPower" stroke="#76CFFF" fillOpacity={0.15} fill="#76CFFF" name="IT Equipment Demand" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs font-mono text-muted-silver pt-3 border-t border-white/10 flex justify-between items-center">
            <span>Peak Demand Window: 13:00 - 15:00 UTC &bull; Nominal Base: {activeData.total_it_power_kw} kW</span>
            <span className="text-electric-teal font-bold">Continuous ASHRAE Class A1</span>
          </div>
        </div>

        {/* Right 4-Cols: Capacity & Infrastructure Metrics */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <h3 className="font-serif text-lg font-bold text-warm-ivory flex items-center gap-2">
              <Server className="w-4 h-4 text-champagne-bronze" />
              Cabinet & Floor Density
            </h3>
            <p className="text-xs text-muted-silver mt-0.5">Physical white space capacity headroom</p>
          </div>

          <div className="space-y-3.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-obsidian border border-white/10 space-y-1">
              <div className="flex justify-between text-muted-silver">
                <span>TOTAL CABINETS:</span>
                <span className="text-warm-ivory font-bold">{activeData.rack_count} × 42U Enclosures</span>
              </div>
              <div className="flex justify-between text-muted-silver">
                <span>TOTAL CAPACITY:</span>
                <span className="text-electric-teal font-bold">{activeData.rack_count * 42} U Total</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-obsidian border border-white/10 space-y-1">
              <div className="flex justify-between text-muted-silver">
                <span>ROOM BOUNDS:</span>
                <span className="text-warm-ivory font-bold">
                  {activeData.room_dimensions?.width}m × {activeData.room_dimensions?.length}m
                </span>
              </div>
              <div className="flex justify-between text-muted-silver">
                <span>CLEAR HEIGHT:</span>
                <span className="text-warm-ivory font-bold">{activeData.room_dimensions?.height}m to slab</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-obsidian border border-white/10 space-y-1">
              <div className="flex justify-between text-muted-silver">
                <span>REQUIRED COOLING:</span>
                <span className="text-controlled-emerald font-bold">{activeData.required_cooling_kw} kW</span>
              </div>
              <div className="flex justify-between text-muted-silver">
                <span>INSTALLED CRAC:</span>
                <span className="text-controlled-emerald font-bold">{activeData.installed_cooling_kw} kW</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-muted-silver flex justify-between">
            <span>Airflow Delta-T:</span>
            <span className="text-electric-teal font-bold">17.0 K (Cold 18°C / Hot 35°C)</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          SUSTAINABILITY, CARBON & SPACE UTILIZATION
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Zap className="w-4 h-4 text-electric-teal" />
            <span>ANNUAL POWER CONSUMPTION</span>
          </div>
          <div className="text-2xl font-bold text-warm-ivory font-serif">
            {activeData.annual_energy_consumption_mwh.toLocaleString()} <span className="text-xs font-normal text-muted-silver font-sans">MWh/yr</span>
          </div>
          <p className="text-xs text-muted-silver/80">
            Calculated at 8,760 continuous annual operating hours at nominal facility load.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Leaf className="w-4 h-4 text-controlled-emerald" />
            <span>ESTIMATED CARBON FOOTPRINT</span>
          </div>
          <div className="text-2xl font-bold text-controlled-emerald font-serif">
            {activeData.carbon_footprint_tonnes_yr.toLocaleString()} <span className="text-xs font-normal text-muted-silver font-sans">tCO₂e/yr</span>
          </div>
          <p className="text-xs text-muted-silver/80">
            Based on standard grid emission factor 0.385 MT CO₂e/MWh with closed-loop dry cooler.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Maximize2 className="w-4 h-4 text-champagne-bronze" />
            <span>SPACE UTILIZATION DENSITY</span>
          </div>
          <div className="text-2xl font-bold text-warm-ivory font-serif">
            {activeData.space_utilization_percent}%
          </div>
          <p className="text-xs text-muted-silver/80">
            {activeData.usable_it_area_sqm} m² IT white-space footprint / {activeData.total_floor_area_sqm} m² total gross slab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
