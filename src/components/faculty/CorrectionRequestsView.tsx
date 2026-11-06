import React, { useState, useEffect } from 'react';
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  QuestionCorrection,
  CorrectionStatus,
  CorrectionPriority,
  VerifiedQuestion,
} from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { ReviewCorrectionModal } from './ReviewCorrectionModal';

interface CorrectionRequestsViewProps {
  onRefresh?: () => void;
}

export const CorrectionRequestsView: React.FC<CorrectionRequestsViewProps> = () => {
  const [corrections, setCorrections] = useState<QuestionCorrection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [activeCorrection, setActiveCorrection] = useState<QuestionCorrection | null>(null);
  const [targetQuestion, setTargetQuestion] = useState<VerifiedQuestion | null>(null);

  useEffect(() => {
    const unsubscribe = firebaseQuestionBankService.subscribeCorrections((list) => {
      setCorrections(list);
    });
    return () => unsubscribe();
  }, []);

  const filteredCorrections = corrections.filter((c) => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.questionId.toLowerCase().includes(q);
      const matchChapter = c.chapterTitle.toLowerCase().includes(q);
      const matchCat = c.issueCategory.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchReporter = c.reportedBy.toLowerCase().includes(q);
      if (!matchId && !matchChapter && !matchCat && !matchDesc && !matchReporter) return false;
    }
    return true;
  });

  const handleOpenReview = (correction: QuestionCorrection) => {
    const q = firebaseQuestionBankService.getQuestionById(correction.questionId);
    if (q) {
      setTargetQuestion(q);
      setActiveCorrection(correction);
    } else {
      alert(`Question ${correction.questionId} could not be loaded.`);
    }
  };

  const flaggedCount = corrections.filter((c) => c.status === 'Flagged for Correction').length;
  const underCorrectionCount = corrections.filter((c) => c.status === 'Under Correction').length;
  const resolvedCount = corrections.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Flagged for Correction
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950 mt-1">
              {flaggedCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Excluded from active assessment pool
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
            <Flag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Under Correction
            </div>
            <div className="text-2xl font-bold font-mono text-blue-950 mt-1">
              {underCorrectionCount}
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Draft revisions being prepared
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-200/60 text-blue-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Resolved & Approved
            </div>
            <div className="text-2xl font-bold font-mono text-teal-950 mt-1">
              {resolvedCount}
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5">
              Restored to live question bank
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-200/60 text-teal-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question ID, chapter, category, reporter..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="all">All Statuses ({corrections.length})</option>
              <option value="Flagged for Correction">Flagged for Correction</option>
              <option value="Under Correction">Under Correction</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Correction Requests */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Correction Requests & Issue Queue ({filteredCorrections.length})
          </div>
          <div className="text-[11px] text-slate-500">
            Real-time cloud synchronized with Firestore
          </div>
        </div>

        {filteredCorrections.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
            <div className="font-bold text-slate-800 text-sm">No Pending Correction Requests</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All question bank items have either been verified or resolved. When faculty members report an issue, it will immediately show here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCorrections.map((corr) => {
              const isFlagged = corr.status === 'Flagged for Correction';
              const isResolved = corr.status === 'Resolved';
              const isUnder = corr.status === 'Under Correction';

              return (
                <div
                  key={corr.id}
                  className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {corr.questionId}
                      </span>
                      <span className="text-xs font-bold text-teal-900">
                        {corr.chapterTitle}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600">{corr.topic}</span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          corr.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : corr.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Priority: {corr.priority}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isFlagged
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isUnder
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : isResolved
                            ? 'bg-teal-100 text-teal-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {corr.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800">
                      <span className="text-slate-500 font-normal">Category: </span>
                      {corr.issueCategory}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {corr.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Reported by: <strong className="text-slate-700">{corr.reportedBy}</strong></span>
                      <span>·</span>
                      <span>{new Date(corr.createdAt).toLocaleDateString()} {new Date(corr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {corr.resolvedBy && (
                        <>
                          <span>·</span>
                          <span className="text-teal-800 font-semibold">Resolved by: {corr.resolvedBy}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReview(corr)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer ${
                        isResolved
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      <span>{isResolved ? 'Inspect Resolution' : 'Review & Resolve'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Resolution Modal */}
      {activeCorrection && targetQuestion && (
        <ReviewCorrectionModal
          correction={activeCorrection}
          question={targetQuestion}
          onClose={() => {
            setActiveCorrection(null);
            setTargetQuestion(null);
          }}
          onSuccess={() => {
            setActiveCorrection(null);
            setTargetQuestion(null);
          }}
        />
      )}
    </div>
  );
};
