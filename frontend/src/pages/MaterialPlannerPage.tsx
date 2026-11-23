import React, { useState } from 'react';
import { MaterialItem } from '../types';
import {
  ClipboardList, DollarSign, Download, Edit2, Check,
  Server, Wind, Zap, Building2, Search, SlidersHorizontal
} from 'lucide-react';

interface MaterialPlannerPageProps {
  materials: MaterialItem[];
  onUpdateMaterial: (id: string, payload: { quantity?: number; specification?: string; unit_price?: number }) => Promise<void>;
}

export const MaterialPlannerPage: React.FC<MaterialPlannerPageProps> = ({
  materials,
  onUpdateMaterial,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editSpec, setEditSpec] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Server Infrastructure', 'Cooling Infrastructure', 'Electrical Infrastructure', 'Physical Infrastructure'];

  const filteredMaterials = materials.filter((m) => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalCost = materials.reduce((acc, curr) => acc + curr.total_price, 0);

  const startEdit = (m: MaterialItem) => {
    setEditingId(m.id);
    setEditQty(m.quantity);
    setEditPrice(m.unit_price);
    setEditSpec(m.specification);
  };

  const saveEdit = async (id: string) => {
    await onUpdateMaterial(id, {
      quantity: editQty,
      unit_price: editPrice,
      specification: editSpec,
    });
    setEditingId(null);
  };

  const exportCSV = () => {
    const headers = ['Category', 'Component Name', 'Purpose', 'Specification', 'Quantity', 'Unit', 'Unit Price ($)', 'Total Price ($)', 'Location', 'Selection Criteria'];
    const rows = materials.map((m) => [
      `"${m.category}"`,
      `"${m.name}"`,
      `"${m.purpose}"`,
      `"${m.specification}"`,
      m.quantity,
      `"${m.unit}"`,
      m.unit_price,
      m.total_price,
      `"${m.location}"`,
      `"${m.selection_criteria}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'RackVision_BOM_Estimates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Server')) return <Server className="w-4 h-4 text-electric-teal" />;
    if (category.includes('Cooling')) return <Wind className="w-4 h-4 text-controlled-emerald" />;
    if (category.includes('Electrical')) return <Zap className="w-4 h-4 text-champagne-bronze" />;
    return <Building2 className="w-4 h-4 text-muted-silver" />;
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Procurement & Cost Estimation
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Material Planner (BOM Ledger)
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Componentized Bill of Materials with parametric quantities, specifications, and unit price estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory font-mono text-xs border border-white/10 hover:border-electric-teal/40 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-electric-teal" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Capex Summary Banner */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-lg">
        <div>
          <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Total Estimated Capex</span>
          <div className="text-3xl font-bold text-electric-teal font-serif mt-1">
            ${totalCost.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-silver/80 font-mono">Equipment & Installation</span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Tracked Components</span>
          <div className="text-2xl font-bold text-warm-ivory font-serif mt-1">
            {materials.reduce((acc, curr) => acc + curr.quantity, 0)} Units
          </div>
          <span className="text-[10px] text-controlled-emerald font-mono">100% Parameterized</span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Server Line-Items</span>
          <div className="text-2xl font-bold text-electric-teal font-serif mt-1">
            {materials.filter((m) => m.category.includes('Server')).length} Categories
          </div>
          <span className="text-[10px] text-muted-silver/80 font-mono">Includes Racks & PDUs</span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Cooling & Plant</span>
          <div className="text-2xl font-bold text-controlled-emerald font-serif mt-1">
            {materials.filter((m) => m.category.includes('Cooling')).length} Categories
          </div>
          <span className="text-[10px] text-muted-silver/80 font-mono">InRow / CRAC Infrastructure</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-graphite/80 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-electric-teal text-obsidian font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                  : 'text-muted-silver hover:text-warm-ivory hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-silver absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search BOM items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-titanium-charcoal border border-white/10 text-xs font-mono text-warm-ivory placeholder-muted-silver/50 focus:outline-none focus:border-electric-teal"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-titanium-charcoal/60 text-muted-silver font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Specification</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Price</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-warm-ivory">
              {filteredMaterials.map((m) => {
                const isEditing = editingId === m.id;

                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors font-mono">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {getCategoryIcon(m.category)}
                        <div>
                          <div className="font-bold text-warm-ivory">{m.name}</div>
                          <div className="text-[10px] text-muted-silver/60">{m.purpose}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-silver">
                      {m.category}
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSpec}
                          onChange={(e) => setEditSpec(e.target.value)}
                          className="px-2 py-1 rounded bg-titanium-charcoal border border-white/20 text-xs text-warm-ivory w-full"
                        />
                      ) : (
                        <span className="text-muted-silver text-[11px]">{m.specification}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(Number(e.target.value))}
                          className="px-2 py-1 rounded bg-titanium-charcoal border border-white/20 text-xs text-warm-ivory w-16 text-center"
                        />
                      ) : (
                        <span className="font-bold">{m.quantity} {m.unit}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="px-2 py-1 rounded bg-titanium-charcoal border border-white/20 text-xs text-warm-ivory w-24 text-right"
                        />
                      ) : (
                        <span>${m.unit_price.toLocaleString()}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-electric-teal">
                      ${(isEditing ? editQty * editPrice : m.total_price).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => saveEdit(m.id)}
                          className="p-1.5 rounded-lg bg-electric-teal text-obsidian hover:bg-electric-teal/90 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-lg text-muted-silver hover:text-warm-ivory hover:bg-white/10 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialPlannerPage;
