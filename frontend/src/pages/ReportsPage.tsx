import React, { useState } from 'react';
import { Project, AnalyticsData, ConstructionPlan, MaterialItem } from '../types';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Printer,
  Calendar,
  Building,
  HardHat,
  Cpu,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface ReportsPageProps {
  activeProject: Project | null;
  analytics: AnalyticsData | null;
  plan: ConstructionPlan | null;
  materials: MaterialItem[];
  onGenerateReport: () => Promise<void>;
  downloadUrl: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  activeProject,
  analytics,
  plan,
  materials,
  onGenerateReport,
  downloadUrl
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(true);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerateReport();
      setReportReady(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalCost = materials.reduce((acc, curr) => acc + curr.total_price, 0);

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-electric-teal font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Engineering Documentation Dossier
          </span>
          <h1 className="text-3xl font-serif font-bold text-warm-ivory tracking-tight mt-1">
            Executive Design Package &amp; Reports
          </h1>
          <p className="text-sm text-muted-silver mt-1">
            Automated multi-page engineering specification generated via ReportLab with executive summary, BOM, and construction roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory font-mono text-xs border border-white/10 hover:border-electric-teal/40 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-electric-teal' : 'text-muted-silver'}`} />
            <span>{isGenerating ? 'ASSEMBLING PDF...' : 'REGENERATE DOSSIER'}</span>
          </button>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,214,201,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD STAMPED PDF</span>
          </a>
        </div>
      </div>

      {/* Report Specification Document Preview */}
      <div className="p-8 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-8 shadow-xl">
        {/* Document Header Title Block */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-electric-teal uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> ReportLab Document Assembly Engine v5.1
            </span>
            <h2 className="text-2xl font-serif font-bold text-warm-ivory">
              RackVision AI — Enterprise Data Center Engineering Specification
            </h2>
            <div className="text-xs font-mono text-muted-silver">
              Document Ref: RV-ENG-SPEC-{activeProject?.id?.toUpperCase() || 'PROJ-01'} &bull; Revision 2.0 &bull; ISO/IEC 22237 Compliant
            </div>
          </div>

          <div className="p-4 rounded-xl bg-titanium-charcoal/80 border border-white/10 text-xs font-mono space-y-1.5 min-w-[220px]">
            <div className="text-muted-silver flex justify-between">
              <span>STATUS:</span>
              <span className="text-controlled-emerald font-bold">READY FOR EXPORT</span>
            </div>
            <div className="text-muted-silver flex justify-between">
              <span>TARGET TIER:</span>
              <span className="text-electric-teal font-bold">{activeProject?.target_tier || 'Tier III'}</span>
            </div>
            <div className="text-muted-silver flex justify-between">
              <span>FACILITY ID:</span>
              <span className="text-warm-ivory font-semibold">{activeProject?.id || 'PROJ-01'}</span>
            </div>
          </div>
        </div>

        {/* Table of Contents & Structure */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-warm-ivory font-mono uppercase tracking-wider">
            Report Sections Included in Generated Engineering Dossier:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 1. Project Overview &amp; Site Metadata
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Campus coordinates, owner/operator information, target Uptime Institute tier classification, and white space dimensions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 2. Computer Vision &amp; Floor Plan Analysis
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Source architectural sketch telemetry, bilateral noise reduction filtering, and Canny structural edge maps.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 3. Generative Architectural Visualizations
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Output 1 technical CAD diagram, Output 2 photorealistic preview, and Output 3 Google Colab SDXL + ControlNet master render.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 4. 3D Geometric Space &amp; Containment
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Aisle layout coordinates, cold/hot aisle containment boundaries, CRAH/CRAC unit placements, and raised floor clearances.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 5. Comprehensive Bill of Materials (BOM)
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Itemized {materials.length} line-item procurement schedule totaling ${totalCost.toLocaleString()} USD across power, cooling, and structural racks.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 6. 10-Stage Sequential Construction Plan
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                Milestone durations ({plan?.total_duration_days || 124} days), NFPA/OSHA compliance mandates, commissioning and sign-off criteria.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 7. Quantitative Analytics &amp; PUE Modeling
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                IT load ({analytics?.total_it_power_kw || 195} kW), sensible cooling ({analytics?.cooling_capacity_tons || 63.8} Tons), and design PUE ({analytics?.estimated_pue || 1.22}).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-titanium-charcoal/40 border border-white/10 space-y-2 hover:border-electric-teal/40 transition-colors">
              <span className="text-controlled-emerald font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> 8. Engineering Standards &amp; Legal Disclaimers
              </span>
              <p className="text-muted-silver text-[11px] leading-relaxed">
                ASHRAE TC 9.9 thermal envelopes, ANSI/TIA-942 telecommunication pathways, and professional engineer review advisories.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-5 rounded-xl bg-titanium-charcoal/60 border border-white/10 text-xs text-muted-silver font-mono flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-champagne-bronze shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-warm-ivory block mb-1 uppercase tracking-wider text-[11px]">
              Professional Engineering &amp; Regulatory Compliance Advisory
            </span>
            This documentation is generated by RackVision AI as an architectural and engineering decision support dossier. Final mechanical, electrical, plumbing (MEP), and structural life-safety systems must be stamped and validated by a licensed Professional Engineer (PE) in accordance with local jurisdictional building codes.
          </div>
        </div>

        {/* Big Action Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono text-muted-silver/60">
            Rendered with ReportLab 5.1 &amp; ISO PDF 1.4 Vector Standards
          </span>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-teal flex items-center gap-2 px-6 py-3 rounded-xl font-bold font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,214,201,0.25)]"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD OFFICIAL SPECIFICATION (.PDF)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
