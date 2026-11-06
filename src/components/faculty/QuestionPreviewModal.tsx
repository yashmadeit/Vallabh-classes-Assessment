import React from 'react';
import { X, CheckCircle2, BookOpen, FileText, Award, Calendar, ExternalLink } from 'lucide-react';
import { VerifiedQuestion } from '../../types/assessment';

interface QuestionPreviewModalProps {
  question: VerifiedQuestion | null;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({ question, onClose }) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-teal-400 font-bold text-xs">{question.id}</span>
              <span className="text-slate-400">·</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  question.verificationStatus === 'Approved'
                    ? 'bg-teal-500/20 text-teal-300'
                    : question.verificationStatus === 'Pending Verification'
                    ? 'bg-amber-500/20 text-amber-300'
                    : question.verificationStatus === 'Draft'
                    ? 'bg-slate-500/20 text-slate-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {question.verificationStatus}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {question.chapterTitle} — {question.topic}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
          {/* Question Text */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Question Statement</span>
              <span className="font-mono text-slate-700">Marks: {question.marks} · Difficulty: {question.difficulty}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {question.questionText}
            </p>
          </div>

          {/* MCQ Options */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              MCQ Options (Student Presentation)
            </span>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {question.options.map((opt) => {
                const isCorrect = opt.label === question.correctOption;
                return (
                  <div
                    key={opt.label}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                      isCorrect
                        ? 'bg-teal-50/80 border-teal-500 text-teal-950 font-semibold ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-bold font-mono text-xs">{opt.label}.</span>
                    <span className="text-xs">{opt.text}</span>
                    {isCorrect && (
                      <span className="ml-auto text-[10px] font-mono uppercase bg-teal-200/80 px-1.5 py-0.5 rounded text-teal-900 font-bold shrink-0">
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Mathematical Explanation */}
          <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200 space-y-2">
            <div className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Step-by-Step Mathematical Explanation</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">
              {question.explanation}
            </p>
            {question.hemangSirTip && (
              <div className="pt-2 border-t border-teal-200/60 text-xs">
                <span className="font-bold text-teal-800">Hemang Shah Sir's Board Tip: </span>
                <span className="italic text-slate-700">{question.hemangSirTip}</span>
              </div>
            )}
          </div>

          {/* Source Attribution & Educational Citation */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>Official Educational Source Reference</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400">Source Type: </span>
                <span className="font-semibold text-slate-800">{question.sourceType}</span>
              </div>
              <div>
                <span className="text-slate-400">Curriculum: </span>
                <span className="font-semibold text-slate-800">Class {question.classId} {question.board}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Official Document Citation: </span>
                <span className="font-medium text-slate-800 font-mono text-[11px]">{question.sourceReference}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Created: {new Date(question.createdAt).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
