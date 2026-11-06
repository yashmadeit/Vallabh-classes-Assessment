import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Send,
  HelpCircle,
  FileText,
  User,
  Flag,
} from 'lucide-react';
import {
  VerifiedQuestion,
  IssueCategory,
  CorrectionPriority,
} from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService } from '../../services/firebaseAuthService';

interface ReportIssueModalProps {
  question: VerifiedQuestion;
  onClose: () => void;
  onSuccess: () => void;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  'Incorrect question',
  'Incorrect answer',
  'Incorrect explanation',
  'Mathematical calculation error',
  'Incorrect syllabus mapping',
  'Duplicate question',
  'Formatting issue',
  'Other',
];

const PRIORITIES: CorrectionPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  question,
  onClose,
  onSuccess,
}) => {
  const authState = firebaseAuthService.getAuthState();
  const defaultReporter =
    authState.profile?.displayName || authState.user?.displayName || 'Hemang Shah Sir';
  const defaultEmail = authState.user?.email || '';
  const defaultUid = authState.user?.uid || '';

  const [category, setCategory] = useState<IssueCategory>('Mathematical calculation error');
  const [priority, setPriority] = useState<CorrectionPriority>('High');
  const [description, setDescription] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reportedBy, setReportedBy] = useState(defaultReporter);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Please describe the issue in detail (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await firebaseQuestionBankService.reportQuestionIssue({
        questionId: question.id,
        issueCategory: category,
        description: description.trim(),
        suggestedCorrection: suggestedCorrection.trim(),
        priority,
        reportedBy: reportedBy.trim() || defaultReporter,
        reportedByEmail: defaultEmail,
        reportedByUid: defaultUid,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit correction report.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Report Issue & Propose Correction
              </h3>
              <p className="text-xs text-slate-400">
                Question ID: <span className="font-mono text-amber-300 font-bold">{question.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Submitting this report will immediately set this question to{' '}
            <strong className="font-semibold text-amber-950">"Flagged for Correction"</strong> and exclude it from live student assessment generation until verified and approved by the administrator.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Question Summary Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold text-teal-800">
                {question.chapterTitle} · {question.topic}
              </span>
              <span className="font-mono text-slate-400">Version v{question.version || 1}</span>
            </div>
            <p className="text-slate-800 font-medium line-clamp-2">{question.questionText}</p>
            <div className="text-slate-500 text-[11px]">
              Current Answer: <strong className="text-slate-900">Option {question.correctOption}</strong>
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CorrectionPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain exactly what is incorrect (e.g. In step 2 of the calculation, the discriminant formula b²-4ac was miscomputed)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              required
            />
          </div>

          {/* Suggested Correction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Suggested Correction (Optional)
            </label>
            <textarea
              rows={2}
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              placeholder="Provide corrected question statement, revised answer option, or amended explanation steps..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            />
          </div>

          {/* Reporter Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reported By
            </label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Filing Issue...' : 'Submit Issue & Flag Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
