import React from 'react';
import { AnalyticsData } from '../types';
import {
  BarChart3, Zap, Wind, Flame, Activity, Layers,
  Leaf, Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface AnalyticsPageProps {
  analytics: AnalyticsData | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-muted-silver font-mono">
        Loading quantitative analytics telemetry...
      </div>
    );
  }

  // PUE Breakdown Data
  const pueData = [
    { name: 'IT Equipment Load', value: analytics.pue_breakdown.it_equipment_percent, color: '#00D6C9' },
    { name: 'Precision Cooling Systems', value: analytics.pue_breakdown.cooling_systems_percent, color: '#00B894' },
    { name: 'PDU / Transformer Losses', value: analytics.pue_breakdown.power_distribution_losses_percent, color: '#C6A477' },
    { name: 'Lighting & Auxiliary Plant', value: analytics.pue_breakdown.lighting_and_building_auxiliary_percent, color: '#A8B3BC' },
  ];

  // Cabling Lengths Data
  const cableData = [
    { type: 'Cat6A Copper', meters: analytics.cable_requirements_meters.cat6a_copper_horizontal_meters },
    { type: 'OM4 MM Fiber', meters: analytics.cable_requirements_meters.om4_multimode_fiber_meters },
    { type: 'OS2 Spine Fiber', meters: analytics.cable_requirements_meters.os2_singlemode_spine_fiber_meters },
    { type: 'Ground Busbar', meters: analytics.cable_requirements_meters.grounding_copper_busbar_meters },
  ];

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="pb-4 border-b border-white/10">
        <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Quantitative Telemetry
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
          Data Center Infrastructure Analytics
        </h1>
        <p className="text-xs text-muted-silver mt-1">
          Thermal envelopes, PUE efficiency benchmarks, annual energy consumption, and structured cabling estimations.
        </p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: IT Power */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>IT POWER DEMAND</span>
            <Zap className="w-4 h-4 text-electric-teal" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">{analytics.total_it_power_kw} kW</div>
          <div className="text-[11px] font-mono text-electric-teal flex justify-between">
            <span>Avg Density:</span>
            <span>{analytics.rack_density_kw_per_rack} kW / Rack</span>
          </div>
        </div>

        {/* KPI 2: Cooling Capacity */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>COOLING CAPACITY</span>
            <Wind className="w-4 h-4 text-controlled-emerald" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">{analytics.installed_cooling_kw} kW</div>
          <div className="text-[11px] font-mono text-controlled-emerald flex justify-between">
            <span>Installed Rating:</span>
            <span>{analytics.cooling_capacity_tons} Tons ({analytics.cooling_redundancy})</span>
          </div>
        </div>

        {/* KPI 3: Heat Dissipation */}
        <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>HEAT DISSIPATION</span>
            <Flame className="w-4 h-4 text-champagne-bronze" />
          </div>
          <div className="text-3xl font-bold text-warm-ivory font-serif">
            {(analytics.heat_dissipation_btu_hr / 1000).toFixed(0)}k <span className="text-xs font-normal text-muted-silver">BTU/h</span>
          </div>
          <div className="text-[11px] font-mono text-champagne-bronze flex justify-between">
            <span>Thermal Exhaust:</span>
            <span>Sensible Factor 0.92</span>
          </div>
        </div>

        {/* KPI 4: Target PUE */}
        <div className="p-5 rounded-2xl border border-electric-teal/30 bg-graphite/80 backdrop-blur-md space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
            <span>FACILITY PUE</span>
            <Activity className="w-4 h-4 text-electric-teal" />
          </div>
          <div className="text-3xl font-bold text-electric-teal font-serif">{analytics.estimated_pue}</div>
          <div className="text-[11px] font-mono text-controlled-emerald flex justify-between font-bold">
            <span>ASHRAE Class:</span>
            <span>A1 Recommended Envelope</span>
          </div>
        </div>
      </div>

      {/* Main Charts: PUE Breakdown Donut & Cabling Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: PUE Breakdown Chart */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-ivory">PUE Power Allocation Breakdown</h3>
              <p className="text-xs text-muted-silver">Total facility power: {analytics.facility_total_power_kw} kW</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-md bg-electric-teal/15 text-electric-teal border border-electric-teal/30 font-bold">
              PUE = {analytics.estimated_pue}
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111820', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#F3F1E9' }}
                  formatter={(val: any) => [`${val}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-white/10">
            {pueData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-muted-silver truncate">{p.name}: <b className="text-warm-ivory">{p.value}%</b></span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Structured Cabling Requirements */}
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
                <YAxis dataKey="type" type="category" stroke="#A8B3BC" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111820', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#F3F1E9' }}
                  formatter={(val: any) => [`${val.toLocaleString()} meters`, 'Length']}
                />
                <Bar dataKey="meters" fill="#00D6C9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs font-mono text-muted-silver pt-3 border-t border-white/10 flex justify-between">
            <span>Includes 20% Slack & Bend Radius Allowance</span>
            <span className="text-controlled-emerald font-bold">ANSI/TIA-568-D Compliant</span>
          </div>
        </div>
      </div>

      {/* Energy & Environmental Sustainability */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Zap className="w-4 h-4 text-electric-teal" />
            <span>ANNUAL POWER CONSUMPTION</span>
          </div>
          <div className="text-2xl font-bold text-warm-ivory font-serif">
            {analytics.annual_energy_consumption_mwh.toLocaleString()} <span className="text-xs font-normal text-muted-silver">MWh/yr</span>
          </div>
          <p className="text-xs text-muted-silver/80">Continuous 8,760 hours nominal annual operating load</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Leaf className="w-4 h-4 text-controlled-emerald" />
            <span>ESTIMATED CARBON FOOTPRINT</span>
          </div>
          <div className="text-2xl font-bold text-controlled-emerald font-serif">
            {analytics.carbon_footprint_tonnes_yr.toLocaleString()} <span className="text-xs font-normal text-muted-silver">tCO₂e/yr</span>
          </div>
          <p className="text-xs text-muted-silver/80">Based on EU/US grid average 0.385 MT CO2e/MWh</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-silver">
            <Maximize2 className="w-4 h-4 text-champagne-bronze" />
            <span>SPACE UTILIZATION DENSITY</span>
          </div>
          <div className="text-2xl font-bold text-warm-ivory font-serif">
            {analytics.space_utilization_percent}%
          </div>
          <p className="text-xs text-muted-silver/80">
            {analytics.usable_it_area_sqm} m² IT footprint / {analytics.total_floor_area_sqm} m² white space
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
