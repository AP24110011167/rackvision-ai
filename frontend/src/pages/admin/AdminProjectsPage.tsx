import React, { useState, useEffect } from 'react';
import { FolderGit2, Building2, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await api.getAdminProjects();
        setProjects(data);
      } catch (e) {
        console.error('Failed to load admin projects:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl font-sans-ui text-[#F4F3EE]">
      <div>
        <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00A99D]">
          Facility Portfolio
        </span>
        <h1 className="font-editorial text-3xl font-bold text-white mt-1">
          Master Project Ledger
        </h1>
        <p className="text-xs text-[#87939B] font-mono-code mt-1">
          Cross-enterprise index of active data center architectures, floor plates, and generation artifacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-[#20272D] border border-[#2A3744] rounded-xl p-5 hover:border-[#00A99D]/50 transition-colors shadow-xs">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono-code text-[#00A99D] font-bold">{p.id}</span>
                <h3 className="font-editorial text-xl font-bold text-white">{p.name}</h3>
                <div className="text-xs text-[#87939B]">{p.client} &bull; {p.location || 'Frankfurt Campus'}</div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#269B72]/20 border border-[#269B72]/40 text-[#269B72] text-[10px] font-mono-code">
                {p.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#2A3744] text-xs font-mono-code my-3">
              <div>
                <span className="text-[#87939B] block text-[10px]">TARGET TIER</span>
                <span className="text-white font-bold">{p.target_tier || 'Tier III'}</span>
              </div>
              <div>
                <span className="text-[#87939B] block text-[10px]">WHITE SPACE</span>
                <span className="text-white font-bold">49.6 m²</span>
              </div>
              <div>
                <span className="text-[#87939B] block text-[10px]">EST. PUE</span>
                <span className="text-[#00A99D] font-bold">1.14</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono-code text-[#87939B] pt-2">
              <span>Updated: {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Active'}</span>
              <button className="text-[#00A99D] hover:underline flex items-center gap-1 cursor-pointer">
                <span>View Dossier</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
