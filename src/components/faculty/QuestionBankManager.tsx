import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Archive,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Lock,
  ArrowUpDown,
  BookOpen,
  Award,
  Flag,
  History,
  CloudCheck,
} from 'lucide-react';
import {
  VerifiedQuestion,
  VerificationStatus,
  StudentClass,
  QuestionDifficulty,
  QuestionSourceType,
} from '../../types/assessment';
import { questionBankStore } from '../../services/questionBankStore';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { QuestionPreviewModal } from './QuestionPreviewModal';
import { ReportIssueModal } from './ReportIssueModal';
import { VersionHistoryModal } from './VersionHistoryModal';

interface QuestionBankManagerProps {
  initialStatusFilter?: VerificationStatus | 'All';
  onOpenSecurityModal?: () => void;
  onRefresh?: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  initialStatusFilter = 'All',
  onOpenSecurityModal,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'All'>(initialStatusFilter);
  const [classFilter, setClassFilter] = useState<StudentClass | 'All'>('All');
  const [chapterFilter, setChapterFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<QuestionSourceType | 'All'>('All');
  const [previewQuestion, setPreviewQuestion] = useState<VerifiedQuestion | null>(null);
  const [reportingQuestion, setReportingQuestion] = useState<VerifiedQuestion | null>(null);
  const [historyQuestion, setHistoryQuestion] = useState<VerifiedQuestion | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load all questions with real-time cloud synchronisation
  const [allQuestions, setAllQuestions] = useState<VerifiedQuestion[]>(() =>
    firebaseQuestionBankService.getAllQuestions()
  );

  useEffect(() => {
    firebaseQuestionBankService.initRealtimeSync();
    const unsubscribe = firebaseQuestionBankService.subscribeQuestions((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setAllQuestions(cloudList);
      }
    });
    return () => unsubscribe();
  }, []);

  // Unique chapters present in bank
  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(allQuestions.map((q) => q.chapterTitle))).sort();
  }, [allQuestions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (statusFilter !== 'All' && q.verificationStatus !== statusFilter) return false;
      if (classFilter !== 'All' && q.classId !== classFilter) return false;
      if (chapterFilter !== 'All' && q.chapterTitle !== chapterFilter) return false;
      if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) return false;
      if (sourceFilter !== 'All' && q.sourceType !== sourceFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inText = q.questionText.toLowerCase().includes(query);
        const inTopic = q.topic.toLowerCase().includes(query);
        const inRef = q.sourceReference.toLowerCase().includes(query);
        const inId = q.id.toLowerCase().includes(query);
        const inCh = q.chapterTitle.toLowerCase().includes(query);
        if (!inText && !inTopic && !inRef && !inId && !inCh) return false;
      }

      return true;
    });
  }, [allQuestions, statusFilter, classFilter, chapterFilter, difficultyFilter, sourceFilter, searchQuery]);

  const handleArchive = (id: string) => {
    questionBankStore.archiveQuestion(id);
    setAllQuestions(questionBankStore.getAllQuestions());
    setActionNotice(`Question ${id} has been moved to Archived.`);
    if (onRefresh) onRefresh();
  };

  const handleApprove = (id: string) => {
    questionBankStore.approveQuestion(id);
    setAllQuestions(questionBankStore.getAllQuestions());
    setActionNotice(`Question ${id} approved in local repository.`);
    if (onRefresh) onRefresh();
  };

  const handleReject = (id: string) => {
    questionBankStore.rejectQuestion(id);
    setAllQuestions(questionBankStore.getAllQuestions());
    setActionNotice(`Question ${id} marked as Rejected.`);
    if (onRefresh) onRefresh();
  };

  const handleSendForVerification = (id: string) => {
    questionBankStore.updateQuestion(id, { verificationStatus: 'Pending Verification' });
    setAllQuestions(questionBankStore.getAllQuestions());
    setActionNotice(`Question ${id} submitted for verification.`);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-left space-y-6">
      {/* Title & Count */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Repository Management
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Centralised Question Bank Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {filteredQuestions.length} of {allQuestions.length} registered questions.
          </p>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              'All',
              'Approved',
              'Flagged for Correction',
              'Under Correction',
              'Pending Verification',
              'Draft',
              'Archived',
            ] as const
          ).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-teal-700 hover:text-teal-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search statement, topic, citation, ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {/* Chapter Filter */}
        <div>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="All">All Chapters</option>
            {uniqueChapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="All">All Difficulties</option>
            <option value="Foundational">Foundational / Easy</option>
            <option value="Moderate">Moderate / Medium</option>
            <option value="Advanced">Advanced / Hard</option>
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="All">All Sources</option>
            <option value="NCERT">NCERT</option>
            <option value="CBSE">CBSE Official</option>
            <option value="Teacher Created">Teacher Created</option>
            <option value="GSEB">GSEB</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">ID / Status</th>
                <th className="py-3 px-3">Chapter & Topic</th>
                <th className="py-3 px-3.5">Question Statement</th>
                <th className="py-3 px-2 text-center">Key</th>
                <th className="py-3 px-3">Source Reference</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID & Status */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{q.id}</div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            q.verificationStatus === 'Approved'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : q.verificationStatus === 'Pending Verification'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : q.verificationStatus === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : q.verificationStatus === 'Flagged for Correction'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                              : q.verificationStatus === 'Under Correction'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : q.verificationStatus === 'Archived'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {q.verificationStatus}
                        </span>
                      </div>
                    </td>

                    {/* Chapter & Topic */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{q.chapterTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{q.topic}</div>
                      <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                        Class {q.classId} {q.board} · {q.difficulty} · <span className="font-mono text-slate-500">v{q.version || 1}</span>
                      </div>
                    </td>

                    {/* Question Statement */}
                    <td className="py-3.5 px-3.5 max-w-md">
                      <p className="text-slate-800 font-medium line-clamp-2" title={q.questionText}>
                        {q.questionText}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        4 Options (A: {q.options[0]?.text.slice(0, 15)}... | B: {q.options[1]?.text.slice(0, 15)}...)
                      </div>
                    </td>

                    {/* Correct Option */}
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-teal-900 bg-teal-50/40">
                      {q.correctOption}
                    </td>

                    {/* Source Citation */}
                    <td className="py-3.5 px-3 text-[11px] text-slate-600 max-w-xs">
                      <div className="font-semibold text-slate-800">{q.sourceType}</div>
                      <div className="text-[10px] text-slate-500 truncate" title={q.sourceReference}>
                        {q.sourceReference}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Report Issue Button (Faculty & Admin) */}
                        <button
                          onClick={() => setReportingQuestion(q)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Report an Issue & Flag Question for Correction"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>

                        {/* Version History Button */}
                        <button
                          onClick={() => setHistoryQuestion(q)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={`Version v${q.version || 1} - View Version History & Restore`}
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Student Preview Button */}
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Preview student question layout"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {q.verificationStatus === 'Pending Verification' && (
                          <>
                            <button
                              onClick={() => handleApprove(q.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
                              title="Approve for live student assessment"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(q.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer"
                              title="Reject question"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {q.verificationStatus === 'Draft' && (
                          <button
                            onClick={() => handleSendForVerification(q.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
                            title="Submit draft question for verification"
                          >
                            Submit
                          </button>
                        )}

                        {q.verificationStatus !== 'Archived' && (
                          <button
                            onClick={() => handleArchive(q.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Archive question"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    No questions match the selected filters or search terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      <QuestionPreviewModal
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
      />

      {/* Report Issue Modal */}
      {reportingQuestion && (
        <ReportIssueModal
          question={reportingQuestion}
          onClose={() => setReportingQuestion(null)}
          onSuccess={() => {
            setActionNotice(
              `Question ${reportingQuestion.id} flagged for correction and excluded from live assessments.`
            );
            setReportingQuestion(null);
          }}
        />
      )}

      {/* Version History Modal */}
      {historyQuestion && (
        <VersionHistoryModal
          question={historyQuestion}
          onClose={() => setHistoryQuestion(null)}
          onVersionRestored={() => {
            setActionNotice(`Question ${historyQuestion.id} successfully restored from version history.`);
            setHistoryQuestion(null);
          }}
        />
      )}
    </div>
  );
};

