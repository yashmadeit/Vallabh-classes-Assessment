import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  PlusCircle,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  PieChart
} from 'lucide-react';
import { FacultyDashboardStats } from '../../types/assessment';
import { questionBankStore } from '../../services/questionBankStore';

interface FacultyOverviewProps {
  stats: FacultyDashboardStats;
  cloudCount?: number;
  isCloudSynchronized?: boolean;
  onNavigateSection: (
    section:
      | 'question-bank'
      | 'add-question'
      | 'bulk-import'
      | 'pending-verification'
      | 'approved'
      | 'archived'
      | 'corrections'
      | 'backups'
      | 'audit-logs'
      | 'settings'
  ) => void;
  onOpenSecurityModal: () => void;
}

export const FacultyOverview: React.FC<FacultyOverviewProps> = ({
  stats,
  cloudCount = 0,
  isCloudSynchronized = false,
  onNavigateSection,
  onOpenSecurityModal,
}) => {
  return (
    <div className="space-y-7 text-left">
      {/* Active Cloud Database Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isCloudSynchronized
            ? 'bg-teal-50/90 border-teal-200 text-teal-950'
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isCloudSynchronized
                ? 'bg-teal-100 text-teal-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isCloudSynchronized ? (
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-bold flex items-center gap-2">
              <span>
                {isCloudSynchronized
                  ? 'Firebase Cloud Database & Real-Time Sync Active'
                  : 'Cloud Database Pending Initialization · Local Fallback Active'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isCloudSynchronized
                    ? 'bg-teal-200 text-teal-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {isCloudSynchronized ? 'Cloud Synced' : 'Local Bank Active'}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-3xl opacity-90">
              {isCloudSynchronized
                ? `Central source of truth is actively synchronized with Cloud Firestore (${cloudCount} questions verified in cloud). Real-time change feeds and automated recovery active.`
                : 'Cloud Firestore currently contains 0 question documents. Live student assessments are safely serving 100 verified questions from the local master fallback repository until the Administrator executes cloud synchronization.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSecurityModal}
          className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          Security Architecture →
        </button>
      </div>

      {/* 4 Primary KPI Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div
          onClick={() => onNavigateSection('question-bank')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-teal-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Questions
            </span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
            {stats.totalQuestions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{isCloudSynchronized ? 'Cloud Repository' : 'Local Master Bank'}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Approved Questions (Live) */}
        <div
          onClick={() => onNavigateSection('approved')}
          className={`bg-white rounded-xl border p-5 shadow-xs transition-all cursor-pointer group ${
            isCloudSynchronized
              ? 'border-teal-200 hover:border-teal-600 bg-teal-50/10'
              : 'border-amber-200 hover:border-amber-500 bg-amber-50/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isCloudSynchronized ? 'text-teal-800' : 'text-amber-800'
              }`}
            >
              Live Approved
            </span>
            <CheckCircle2
              className={`w-4 h-4 ${
                isCloudSynchronized ? 'text-teal-600' : 'text-amber-600'
              }`}
            />
          </div>
          <div
            className={`text-3xl font-extrabold font-mono mt-1 ${
              isCloudSynchronized ? 'text-teal-800' : 'text-amber-800'
            }`}
          >
            {stats.approvedQuestions}
          </div>
          <div
            className={`text-[11px] mt-1 font-mono ${
              isCloudSynchronized ? 'text-teal-700' : 'text-amber-700'
            }`}
          >
            {isCloudSynchronized
              ? 'Stored in Cloud Firestore'
              : 'Local Fallback (0 in Cloud)'}
          </div>
        </div>

        {/* Pending Verification */}
        <div
          onClick={() => onNavigateSection('pending-verification')}
          className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs hover:border-amber-500 transition-all cursor-pointer group bg-amber-50/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-800 font-mono mt-1">
            {stats.pendingVerification}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Awaiting faculty sign-off
          </div>
        </div>

        {/* Drafts & Staging */}
        <div
          onClick={() => onNavigateSection('question-bank')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Drafts & Staging
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
            {stats.draftQuestions + stats.archivedQuestions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.draftQuestions} drafts · {stats.archivedQuestions} archived
          </div>
        </div>
      </div>

      {/* Chapter Breakdown & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chapter-wise Distribution Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Class 10 CBSE Chapter-wise Question Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified question quota per NCERT syllabus unit.
              </p>
            </div>
            <button
              onClick={() => onNavigateSection('question-bank')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              View Full Bank →
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.questionsByChapter).map(([chName, count]) => {
              const target = 20;
              const percent = Math.min(100, Math.round((count / target) * 100));
              return (
                <div key={chName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{chName}</span>
                    <span className="font-mono text-slate-600">
                      <strong>{count}</strong> / {target} questions ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        count >= 20 ? 'bg-teal-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad & Provenance Stats */}
        <div className="space-y-6">
          {/* Quick Launchpad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Faculty Quick Actions
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onNavigateSection('add-question')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-semibold text-slate-800 hover:text-teal-950 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-teal-600" />
                  <span>Author Single Question</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateSection('bulk-import')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-semibold text-slate-800 hover:text-teal-950 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>Bulk Import (CSV / Excel)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateSection('settings')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  <span>Assessment Settings</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Educational Source Provenance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Source Provenance Breakdown
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(stats.questionsBySource).map(([src, count]) => (
                <div key={src} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="font-medium text-slate-700">{src}</span>
                  <span className="font-mono font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
