import React, { useState } from 'react';
import { ConstructionPlan, ConstructionStage } from '../types';
import {
  HardHat, CheckCircle2, Clock, AlertTriangle, ChevronDown,
  ChevronUp, ShieldAlert, Wrench, CheckSquare, FileCheck
} from 'lucide-react';

interface ConstructionGuidePageProps {
  plan: ConstructionPlan | null;
  onUpdateStage: (stageNum: number, progress: number, status: string) => Promise<void>;
  onExportReport: () => void;
}

export const ConstructionGuidePage: React.FC<ConstructionGuidePageProps> = ({
  plan,
  onUpdateStage,
  onExportReport,
}) => {
  const [expandedStage, setExpandedStage] = useState<number>(1);
  const stages = plan?.stages || [];

  const handleProgressChange = async (stageNum: number, newProgress: number) => {
    let newStatus = 'Pending';
    if (newProgress >= 100) newStatus = 'Completed';
    else if (newProgress > 0) newStatus = 'In Progress';
    await onUpdateStage(stageNum, newProgress, newStatus);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30 flex items-center gap-1 shadow-[0_0_8px_rgba(0,184,148,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-controlled-emerald" /> Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-electric-teal/15 text-electric-teal border border-electric-teal/30 flex items-center gap-1 shadow-[0_0_8px_rgba(0,214,201,0.2)]">
            <Clock className="w-3.5 h-3.5 animate-spin text-electric-teal" /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-muted-silver bg-titanium-charcoal border border-white/10">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5" />
            Milestones & Execution Roadmap
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            AI Construction Planning Guide
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Standardized 10-stage sequential engineering timetable, safety protocols, and commissioning checklists.
          </p>
        </div>

        <button
          onClick={onExportReport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory font-mono text-xs border border-white/10 hover:border-electric-teal/40 transition-all cursor-pointer shadow-xs"
        >
          <FileCheck className="w-3.5 h-3.5 text-electric-teal" />
          <span>Export Plan Dossier</span>
        </button>
      </div>

      {/* Progress & Milestone Overview Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-lg">
        <div>
          <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Overall Project Progress</span>
          <div className="text-3xl font-bold text-warm-ivory font-serif mt-1">
            {plan?.overall_progress_percent || 40.5}%
          </div>
          <div className="w-full bg-titanium-charcoal border border-white/10 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-electric-teal h-full transition-all duration-500 shadow-[0_0_8px_#00D6C9]"
              style={{ width: `${plan?.overall_progress_percent || 40}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-xs font-mono">
          <span className="text-muted-silver">Total Project Duration:</span>
          <div className="text-base font-bold text-warm-ivory">{plan?.total_duration_days || 124} Calendar Days</div>
          <span className="text-champagne-bronze">Target Commissioning: {plan?.target_completion_date || '2026-12-15'}</span>
        </div>

        <div className="md:col-span-2 p-4 rounded-xl bg-titanium-charcoal/60 border border-white/10 text-xs text-muted-silver flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-champagne-bronze shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-warm-ivory block mb-0.5 font-mono text-[11px]">SAFETY & COMPLIANCE PROTOCOL</span>
            Sequence conforms to IEEE & TIA-942 specifications. High-voltage arc-flash mitigation (NFPA 70E) and clean-agent lockouts (NFPA 2001) require certified commissioning engineer sign-off.
          </div>
        </div>
      </div>

      {/* 10-Stage Sequential List */}
      <div className="space-y-4">
        {stages.map((stage) => {
          const isExpanded = expandedStage === stage.stage_num;

          return (
            <div
              key={stage.stage_num}
              className={`rounded-2xl border transition-all bg-graphite/80 backdrop-blur-md overflow-hidden ${
                isExpanded ? 'border-electric-teal/50 shadow-[0_0_20px_rgba(0,214,201,0.1)]' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Stage Collapsible Header */}
              <div
                onClick={() => setExpandedStage(isExpanded ? 0 : stage.stage_num)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-titanium-charcoal border border-white/10 text-electric-teal font-mono font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {stage.stage_num}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-warm-ivory">{stage.title}</h3>
                    <div className="text-xs text-muted-silver font-mono flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-electric-teal" /> {stage.duration_days} Days
                      </span>
                      <span>&bull;</span>
                      <span>{stage.progress_percent}% Complete</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(stage.status)}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-silver" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-silver" />
                  )}
                </div>
              </div>

              {/* Stage Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-white/10 space-y-6 text-xs">
                  {/* Progress Slider */}
                  <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-silver">Update Milestone Progress:</span>
                      <span className="text-electric-teal font-bold text-sm">{stage.progress_percent}%</span>
                    </div>
                    <div className="w-full sm:w-64">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={stage.progress_percent}
                        onChange={(e) => handleProgressChange(stage.stage_num, Number(e.target.value))}
                        className="w-full accent-electric-teal cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-silver block mb-1 font-bold">
                      Scope of Execution:
                    </span>
                    <p className="text-warm-ivory/90 text-xs leading-relaxed">{stage.description}</p>
                  </div>

                  {/* 3-Column Technical Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* Tools */}
                    <div className="bg-titanium-charcoal/40 p-4 rounded-xl border border-white/10 space-y-2">
                      <span className="font-bold text-electric-teal flex items-center gap-1.5 uppercase text-[11px]">
                        <Wrench className="w-3.5 h-3.5" /> Tools & Equipment
                      </span>
                      <ul className="space-y-1 text-muted-silver list-disc list-inside">
                        {stage.tools_equipment?.map((t, idx) => (
                          <li key={idx} className="text-[11px] leading-tight">{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Safety Precautions */}
                    <div className="bg-titanium-charcoal/40 p-4 rounded-xl border border-white/10 space-y-2">
                      <span className="font-bold text-champagne-bronze flex items-center gap-1.5 uppercase text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Safety Protocols
                      </span>
                      <ul className="space-y-1 text-muted-silver list-disc list-inside">
                        {stage.safety_precautions?.map((s, idx) => (
                          <li key={idx} className="text-[11px] leading-tight">{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Inspection Checklist */}
                    <div className="bg-titanium-charcoal/40 p-4 rounded-xl border border-white/10 space-y-2">
                      <span className="font-bold text-controlled-emerald flex items-center gap-1.5 uppercase text-[11px]">
                        <CheckSquare className="w-3.5 h-3.5" /> QA Inspection Criteria
                      </span>
                      <ul className="space-y-1 text-muted-silver list-disc list-inside">
                        {stage.inspection_checklist?.map((chk, idx) => (
                          <li key={idx} className="text-[11px] leading-tight">{chk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConstructionGuidePage;
