import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, HelpCircle, GraduationCap } from 'lucide-react';
import { SAMPLE_QUESTIONS } from '../data/chaptersData';

interface SampleQuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SampleQuestionPreviewModal: React.FC<SampleQuestionPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSelectOption = (questionId: string, optionLabel: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionLabel }));
    setShowExplanations((prev) => ({ ...prev, [questionId]: true }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-left">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
              Demonstration Preview · Hemang Shah Sir's Question Bank
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Sample Conceptual Diagnostic Checkpoints
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950">
            <span className="font-bold">Pedagogical Note:</span> Hemang Shah Sir designs questions that test whether a student understands the foundational definitions and boundary conditions, rather than simply mechanically memorizing routine steps.
          </div>

          {SAMPLE_QUESTIONS.map((q, idx) => {
            const chosen = selectedAnswers[q.id];
            const hasAnswered = !!chosen;
            const isCorrect = chosen === q.correctOption;

            return (
              <div key={q.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-teal-800">{q.classLabel} · {q.chapterTitle}</span>
                  <span className="font-mono text-[11px] text-slate-400">Sample {idx + 1} of {SAMPLE_QUESTIONS.length}</span>
                </div>

                <div className="text-xs font-medium text-slate-500 italic">
                  Concept: {q.conceptTested}
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isThisSelected = chosen === opt.label;
                    const isThisCorrect = opt.label === q.correctOption;

                    let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
                    if (hasAnswered) {
                      if (isThisCorrect) {
                        btnStyle = 'border-teal-600 bg-teal-50 text-teal-950 ring-1 ring-teal-600 font-semibold';
                      } else if (isThisSelected && !isThisCorrect) {
                        btnStyle = 'border-red-400 bg-red-50 text-red-900';
                      }
                    }

                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleSelectOption(q.id, opt.label)}
                        className={`p-3 rounded-lg border text-xs text-left transition-all flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                      >
                        <span className="font-bold font-mono shrink-0">{opt.label}.</span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Teacher Explanation */}
                {hasAnswered && (
                  <div className={`mt-3 p-3.5 rounded-lg border text-xs leading-relaxed ${
                    isCorrect ? 'bg-teal-50/80 border-teal-200 text-teal-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-700" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                      )}
                      <span>
                        {isCorrect ? 'Correct!' : `Correct Answer is (${q.correctOption})`}
                      </span>
                    </div>
                    <div className="text-slate-700 text-xs mt-1">
                      <span className="font-semibold text-slate-900">Hemang Shah Sir’s Note: </span>
                      {q.hemangSirNote}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Vallabh Classes · Harni–Sama Link Road, Vadodara
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};
