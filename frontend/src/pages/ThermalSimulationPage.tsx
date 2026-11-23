import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, AlertTriangle, RefreshCw, CheckCircle,
  ChevronDown, ChevronUp, Loader2, Snowflake, Flame, Activity
} from 'lucide-react';

interface RackTemp {
  rack_id: string;
  rack_name: string;
  x: number;
  y: number;
  z: number;
  estimated_temp_c: number;
  risk_level: 'normal' | 'elevated' | 'high' | 'critical';
  power_kw: number;
}

interface Hotspot {
  rack_id: string;
  rack_name: string;
  estimated_temp_c: number;
}

interface CoolingUnit {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  capacity_kw?: number;
}

interface ThermalData {
  rack_temps: RackTemp[];
  hotspots: Hotspot[];
  cooling_units?: CoolingUnit[];
  supply_temp_c: number;
  return_temp_c: number;
  airflow_m3_per_sec: number;
  cooling_coverage_percent: number;
  model_assumptions: string[];
  disclaimer: string;
}

interface ThermalSimulationPageProps {
  activeProjectId: string;
}

const MOCK_THERMAL: ThermalData = {
  rack_temps: [
    { rack_id: 'rack-01', rack_name: 'Rack Row-A-01', x: -7, y: 1.1, z: -3, estimated_temp_c: 22.5, risk_level: 'normal', power_kw: 12.5 },
    { rack_id: 'rack-02', rack_name: 'Rack Row-A-02', x: -5.5, y: 1.1, z: -3, estimated_temp_c: 25.8, risk_level: 'elevated', power_kw: 7 },
    { rack_id: 'rack-03', rack_name: 'Rack Row-A-03', x: -4, y: 1.1, z: -3, estimated_temp_c: 29.1, risk_level: 'high', power_kw: 12.5 },
    { rack_id: 'rack-04', rack_name: 'Rack Row-B-01', x: -7, y: 1.1, z: 3, estimated_temp_c: 31.4, risk_level: 'critical', power_kw: 12.5 },
  ],
  hotspots: [{ rack_id: 'rack-04', rack_name: 'Rack Row-B-01', estimated_temp_c: 31.4 }],
  cooling_units: [
    { id: 'crac-01', name: 'CRAC Unit 1', x: 0, y: 0, z: -6 },
    { id: 'crac-02', name: 'CRAC Unit 2', x: 0, y: 0, z: 6 },
  ],
  supply_temp_c: 18,
  return_temp_c: 28,
  airflow_m3_per_sec: 8.0,
  cooling_coverage_percent: 87,
  model_assumptions: [
    'Supply air temperature: 18°C (ASHRAE A2 class)',
    'Airflow rate: 2.0 m³/s per CRAC unit',
    'T_rack = T_supply + (P_kw / airflow_rate) × 20',
    'Hotspot threshold: 30°C rack outlet temperature',
  ],
  disclaimer: 'Educational thermal model — not validated CFD. All temperatures are estimates.',
};

function getTempColor(temp: number): string {
  if (temp < 24) return '#00B894'; // Controlled Emerald
  if (temp < 28) return '#00D6C9'; // Electric Teal
  if (temp < 30) return '#F59E0B'; // Muted Amber
  return '#EF4444'; // Crimson
}

function getRiskBadge(risk: RackTemp['risk_level']) {
  switch (risk) {
    case 'normal':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30 shadow-[0_0_8px_rgba(0,184,148,0.2)]">
          NORMAL
        </span>
      );
    case 'elevated':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-electric-teal/15 text-electric-teal border border-electric-teal/30 shadow-[0_0_8px_rgba(0,214,201,0.2)]">
          ELEVATED
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          HIGH
        </span>
      );
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
          ● CRITICAL
        </span>
      );
  }
}

interface HeatmapProps {
  data: ThermalData;
}

const SVG_W = 700;
const SVG_H = 400;
const PAD = 40;

function normalise(val: number, min: number, max: number, outMin: number, outMax: number) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((val - min) / (max - min)) * (outMax - outMin);
}

const ThermalHeatmap: React.FC<HeatmapProps> = ({ data }) => {
  const allX = data.rack_temps.map((r) => r.x);
  const allZ = data.rack_temps.map((r) => r.z);
  const coolingX = (data.cooling_units ?? []).map((c) => c.x);
  const coolingZ = (data.cooling_units ?? []).map((c) => c.z);

  const minX = Math.min(...allX, ...coolingX) - 2;
  const maxX = Math.max(...allX, ...coolingX) + 2;
  const minZ = Math.min(...allZ, ...coolingZ) - 2;
  const maxZ = Math.max(...allZ, ...coolingZ) + 2;

  const toSvgX = (x: number) => normalise(x, minX, maxX, PAD, SVG_W - PAD);
  const toSvgY = (z: number) => normalise(z, minZ, maxZ, PAD + 20, SVG_H - PAD);

  const RACK_W = 24;
  const RACK_H = 14;
  const COOL_SIZE = 18;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-auto rounded-2xl border border-white/10"
      style={{ background: '#080B0F', fontFamily: 'monospace' }}
    >
      {/* Background CAD grid */}
      <defs>
        <pattern id="thermalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#thermalGrid)" />

      {/* Room boundary */}
      <rect
        x={PAD - 4}
        y={PAD + 16}
        width={SVG_W - PAD * 2 + 8}
        height={SVG_H - PAD * 2 - 20}
        rx={8}
        fill="rgba(17, 24, 32, 0.85)"
        stroke="rgba(0, 214, 201, 0.3)"
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />

      {/* Aisle labels */}
      <text x={SVG_W / 2} y={PAD + 10} textAnchor="middle" fill="#00D6C9" fontSize={10} fontWeight="bold">
        ← COLD AISLE INTAKE (18°C SUPPLY) →
      </text>
      <text x={SVG_W / 2} y={SVG_H - PAD + 18} textAnchor="middle" fill="#EF4444" fontSize={10} fontWeight="bold">
        ← HOT AISLE EXHAUST PLENUM (HOT AIR RETURN) →
      </text>

      {/* Cooling units */}
      {(data.cooling_units ?? []).map((c) => {
        const cx = toSvgX(c.x) - COOL_SIZE / 2;
        const cy = toSvgY(c.z) - COOL_SIZE / 2;
        return (
          <g key={c.id}>
            <rect x={cx} y={cy} width={COOL_SIZE} height={COOL_SIZE} rx={3} fill="#00B894" stroke="#080B0F" strokeWidth={1} />
            <line x1={cx + COOL_SIZE / 2} y1={cy + 3} x2={cx + COOL_SIZE / 2} y2={cy + COOL_SIZE - 3} stroke="#FFFFFF" strokeWidth={1.2} />
            <line x1={cx + 3} y1={cy + COOL_SIZE / 2} x2={cx + COOL_SIZE - 3} y2={cy + COOL_SIZE / 2} stroke="#FFFFFF" strokeWidth={1.2} />
            <title>{c.name}</title>
          </g>
        );
      })}

      {/* Racks */}
      {data.rack_temps.map((r) => {
        const rx = toSvgX(r.x) - RACK_W / 2;
        const ry = toSvgY(r.z) - RACK_H / 2;
        const fill = getTempColor(r.estimated_temp_c);
        return (
          <g key={r.rack_id}>
            <rect
              x={rx}
              y={ry}
              width={RACK_W}
              height={RACK_H}
              rx={2}
              fill={fill}
              stroke="#080B0F"
              strokeWidth={1}
            />
            <text x={rx + RACK_W / 2} y={ry + RACK_H / 2 + 3} textAnchor="middle" fill="#080B0F" fontSize={7} fontWeight="bold">
              {r.estimated_temp_c.toFixed(0)}°
            </text>
            <title>{`${r.rack_name} — ${r.estimated_temp_c.toFixed(1)}°C (${r.risk_level})\nPower: ${r.power_kw} kW`}</title>
          </g>
        );
      })}
    </svg>
  );
};

export const ThermalSimulationPage: React.FC<ThermalSimulationPageProps> = ({ activeProjectId }) => {
  const [data, setData] = useState<ThermalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const fetchThermal = useCallback(async () => {
    setLoading(true);
    setUsingMock(false);
    try {
      const res = await fetch(`/api/thermal/${activeProjectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ThermalData = await res.json();
      setData(json);
    } catch {
      setData(MOCK_THERMAL);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchThermal();
  }, [fetchThermal]);

  const sortedRacks = data ? [...data.rack_temps].sort((a, b) => b.estimated_temp_c - a.estimated_temp_c) : [];
  const avgTemp = data ? data.rack_temps.reduce((s, r) => s + r.estimated_temp_c, 0) / (data.rack_temps.length || 1) : 0;

  return (
    <div className="space-y-6 pb-16 font-sans text-warm-ivory">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5" />
            Fluid Dynamics & Thermodynamics
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Thermal & Airflow Simulation
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Cold/hot aisle containment modeling, Delta-T gradients, and ASHRAE TC 9.9 thermal envelope compliance.
          </p>
        </div>

        <button
          onClick={fetchThermal}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal border border-white/10 hover:border-electric-teal/40 text-warm-ivory text-xs font-mono transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-electric-teal' : ''}`} />
          <span>Reload Simulation</span>
        </button>
      </div>

      {/* Main Content */}
      {!loading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'AVG RACK INLET', value: `${avgTemp.toFixed(1)}°C`, icon: Thermometer, color: 'text-electric-teal' },
              { label: 'SUPPLY AIR TEMP', value: `${data.supply_temp_c}°C`, icon: Snowflake, color: 'text-controlled-emerald' },
              { label: 'RETURN PLENUM TEMP', value: `${data.return_temp_c}°C`, icon: Flame, color: 'text-champagne-bronze' },
              { label: 'COOLING COVERAGE', value: `${data.cooling_coverage_percent}%`, icon: Snowflake, color: 'text-controlled-emerald' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-1 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                    <span>{kpi.label}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className={`text-2xl font-bold font-serif ${kpi.color}`}>{kpi.value}</div>
                </div>
              );
            })}
          </div>

          {/* Heatmap Section */}
          <div className="rounded-2xl border border-white/10 p-6 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-warm-ivory">
                2D Thermal Contour Map
              </h2>
              <span className="text-xs font-mono text-controlled-emerald px-2.5 py-0.5 rounded-md bg-controlled-emerald/15 border border-controlled-emerald/30 font-bold">
                ASHRAE A2 CLASS ENVELOPE
              </span>
            </div>

            <ThermalHeatmap data={data} />

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-muted-silver">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-controlled-emerald shadow-[0_0_6px_#00B894]" /> Normal (&lt;24°C)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-electric-teal shadow-[0_0_6px_#00D6C9]" /> Elevated (24-28°C)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400" /> High (28-30°C)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse" /> Critical (&gt;30°C)
                </span>
              </div>
              <span>Airflow: {data.airflow_m3_per_sec} m³/s</span>
            </div>
          </div>

          {/* Rack Temperature Table */}
          <div className="rounded-2xl border border-white/10 p-5 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
            <h2 className="font-serif text-lg font-bold text-warm-ivory">Rack Temperature Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted-silver/80">
                    <th className="pb-2 pr-4">RACK ID</th>
                    <th className="pb-2 pr-4">RACK NAME</th>
                    <th className="pb-2 pr-4">POWER (kW)</th>
                    <th className="pb-2 pr-4">TEMP (°C)</th>
                    <th className="pb-2">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-warm-ivory">
                  {sortedRacks.map((r) => (
                    <tr key={r.rack_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 font-bold text-electric-teal">{r.rack_id}</td>
                      <td className="py-2.5 pr-4">{r.rack_name}</td>
                      <td className="py-2.5 pr-4">{r.power_kw.toFixed(1)} kW</td>
                      <td className="py-2.5 pr-4 font-bold" style={{ color: getTempColor(r.estimated_temp_c) }}>
                        {r.estimated_temp_c.toFixed(1)}°C
                      </td>
                      <td className="py-2.5">{getRiskBadge(r.risk_level)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThermalSimulationPage;
