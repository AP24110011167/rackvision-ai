import React from 'react';
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl font-sans-ui text-[#F4F3EE]">
      <div>
        <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00A99D]">
          Compute Telemetry
        </span>
        <h1 className="font-editorial text-3xl font-bold text-white mt-1">
          Platform Compute & Generation Analytics
        </h1>
        <p className="text-xs text-[#87939B] font-mono-code mt-1">
          Inference throughput, token cost metrics, and latency distribution across model tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'DAILY INFERENCES', value: '184 runs', change: '+18% vs yesterday' },
          { label: 'AVG OUTPUT 3 LATENCY', value: '14.2s', change: 'SDXL 1024x1024' },
          { label: 'FAIL RATE', value: '0.04%', change: 'Resilience guard active' },
          { label: 'GPU HOURS BILLED', value: '26.4 hrs', change: 'Across 3 nodes' },
        ].map((item, i) => (
          <div key={i} className="bg-[#20272D] border border-[#2A3744] rounded-xl p-5 shadow-xs">
            <span className="text-[10px] font-mono-code text-[#87939B] uppercase block mb-1">{item.label}</span>
            <div className="text-2xl font-bold text-white font-editorial">{item.value}</div>
            <div className="text-[11px] font-mono-code text-[#00A99D] mt-1">{item.change}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#20272D] border border-[#2A3744] rounded-xl p-6 shadow-xs">
        <h3 className="font-editorial text-lg font-bold text-white mb-4">
          Engine Generation Volume Breakdown
        </h3>
        <div className="space-y-4 text-xs font-mono-code">
          <div>
            <div className="flex justify-between mb-1.5 text-[#87939B]">
              <span>Output 3: Colab SDXL + ControlNet Canny</span>
              <span className="font-bold text-[#00A99D]">62% (886 calls)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#111C27] overflow-hidden">
              <div className="h-full bg-[#00A99D]" style={{ width: '62%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5 text-[#87939B]">
              <span>Output 1: Technical CAD Vector Synthesis</span>
              <span className="font-bold text-white">26% (371 calls)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#111C27] overflow-hidden">
              <div className="h-full bg-[#269B72]" style={{ width: '26%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5 text-[#87939B]">
              <span>Output 2: Neural Fast Preview</span>
              <span className="font-bold text-[#B87954]">12% (172 calls)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#111C27] overflow-hidden">
              <div className="h-full bg-[#B87954]" style={{ width: '12%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
