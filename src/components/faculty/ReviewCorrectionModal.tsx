import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Eye,
  History,
  FileCheck,
  Flag,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  QuestionCorrection,
  VerifiedQuestion,
  QuestionOption,
} from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService } from '../../services/firebaseAuthService';

interface ReviewCorrectionModalProps {
  correction: QuestionCorrection;
  question: VerifiedQuestion;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewCorrectionModal: React.FC<ReviewCorrectionModalProps> = ({
  correction,
  question,
  onClose,
  onSuccess,
}) => {
  const authState = firebaseAuthService.getAuthState();
  const adminName =
    authState.profile?.displayName || authState.user?.displayName || 'Administrator';
  const adminUid = authState.user?.uid;

  const [questionText, setQuestionText] = useState(question.questionText);
  const [options, setOptions] = useState<QuestionOption[]>(
    question.options.map((o) => ({ ...o }))
  );
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>(
    question.correctOption
  );
  const [explanation, setExplanation] = useState(question.explanation);
  const [hemangSirTip, setHemangSirTip] = useState(question.hemangSirTip || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOptionChange = (idx: number, text: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], text };
      return next;
    });
  };

  const handleApplyResolution = async (
    targetStatus: 'Under Correction' | 'Pending Verification' | 'Approved'
  ) => {
    if (!questionText.trim() || questionText.trim().length < 8) {
      setErrorMsg('Question text must be at least 8 characters.');
      return;
    }
    if (!explanation.trim() || explanation.trim().length < 15) {
      setErrorMsg('Explanation must provide step-by-step mathematical reasoning (min 15 chars).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await firebaseQuestionBankService.saveQuestionCorrectionRevision({
        questionId: question.id,
        correctionId: correction.id,
        revisedQuestion: {
          questionText: questionText.trim(),
          options,
          correctOption,
          explanation: explanation.trim(),
          hemangSirTip: hemangSirTip.trim(),
        },
        targetStatus,
        resolutionNotes:
          resolutionNotes.trim() ||
          (targetStatus === 'Approved'
            ? 'Correction resolved, verified, and released to live assessment pool.'
            : `Question updated by ${adminName} to status '${targetStatus}'`),
        performedBy: adminName,
        performedByUid: adminUid,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply resolution.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Review Correction Request
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                  {correction.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  v{question.version || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Question ID: <span className="font-mono text-teal-300">{question.id}</span> · {question.chapterTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                previewMode
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? 'Edit Mode' : 'Live Preview'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Reported Issue Information Card */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-950 font-bold">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-600" />
                <span>Issue Category: {correction.issueCategory}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-[10px] font-bold text-amber-900">
                  Priority: {correction.priority}
                </span>
              </div>
              <span className="text-slate-500 font-normal">
                Reported by: <strong>{correction.reportedBy}</strong> ({new Date(correction.createdAt).toLocaleDateString()})
              </span>
            </div>

            <p className="text-slate-800 text-xs leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
              <strong>Reported Description:</strong> {correction.description}
            </p>

            {correction.suggestedCorrection && (
              <p className="text-teal-950 text-xs leading-relaxed bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
                <strong>Suggested Correction by Faculty:</strong> {correction.suggestedCorrection}
              </p>
            )}
          </div>

          {previewMode ? (
            /* Live Assessment MCQ Preview Card */
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-semibold text-teal-800">
                  {question.chapterTitle} · {question.topic}
                </span>
                <span className="font-mono text-slate-400">Marks: {question.marks || 1}</span>
              </div>

              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {questionText}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {options.map((opt) => {
                  const isCorrect = opt.label === correctOption;
                  return (
                    <div
                      key={opt.label}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        isCorrect
                          ? 'border-teal-500 bg-teal-50/50 font-semibold text-teal-950 ring-1 ring-teal-500'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {opt.label}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200 text-xs space-y-1">
                <div className="font-bold text-teal-950">Verified Mathematical Explanation:</div>
                <p className="text-slate-800 leading-relaxed">{explanation}</p>
              </div>

              {hemangSirTip && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">Hemang Sir's Board Tip: </span>
                  <span className="text-slate-700">{hemangSirTip}</span>
                </div>
              )}
            </div>
          ) : (
            /* Edit Revision Form */
            <div className="space-y-4">
              {/* Question Statement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                  required
                />
              </div>

              {/* 4 MCQ Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  MCQ Options & Correct Answer Designation <span className="text-red-500">*</span>
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {options.map((opt, idx) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        opt.label === correctOption
                          ? 'border-teal-500 bg-teal-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(opt.label)}
                        className={`w-6 h-6 rounded font-bold text-xs shrink-0 cursor-pointer ${
                          opt.label === correctOption
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Click to designate as correct option"
                      >
                        {opt.label}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-600"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Step-by-Step Mathematical Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              {/* Hemang Sir Tip */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hemang Shah Sir's Board Tip (Optional)
                </label>
                <input
                  type="text"
                  value={hemangSirTip}
                  onChange={(e) => setHemangSirTip(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Resolution Log / Reason for Change
                </label>
                <input
                  type="text"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Corrected sign in step 2; verified against CBSE marking scheme..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Current status:{' '}
            <strong className="text-amber-800">{correction.status}</strong> (Excluded from live testing)
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Stage 1: Under Correction */}
            <button
              type="button"
              onClick={() => handleApplyResolution('Under Correction')}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Save as 'Under Correction'
            </button>

            {/* Stage 2: Pending Verification */}
            <button
              type="button"
              onClick={() => handleApplyResolution('Pending Verification')}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Submit for Verification
            </button>

            {/* Stage 3: Approve & Restore to Live Pool */}
            <button
              type="button"
              onClick={() => handleApplyResolution('Approved')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Release to Live Bank</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
