import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  RotateCcw,
  ListFilter
} from 'lucide-react';
import { AssessmentSession, SanitizedQuestion } from '../types/assessment';

interface AssessmentEngineViewProps {
  session: AssessmentSession;
  onSubmitTest: (userAnswers: Record<string, string>, timeSpentSeconds: number) => void;
  onExitTest: () => void;
  onSyncState?: (userAnswers: Record<string, string>, marked: string[]) => void;
}

export const AssessmentEngineView: React.FC<AssessmentEngineViewProps> = ({
  session,
  onSubmitTest,
  onExitTest,
  onSyncState,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    // Attempt restoring from sessionStorage if previously saved
    try {
      const saved = sessionStorage.getItem(`vc_answers_${session.sessionId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return session.userAnswers || {};
  });

  const [markedForReview, setMarkedForReview] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem(`vc_marked_${session.sessionId}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(session.markedForReview || []);
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(session.timeRemainingSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isPaletteOpenMobile, setIsPaletteOpenMobile] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalQuestions = session.questions.length;
  const currentQuestion: SanitizedQuestion = session.questions[currentIndex];

  // Persist answers to sessionStorage whenever updated
  useEffect(() => {
    try {
      sessionStorage.setItem(`vc_answers_${session.sessionId}`, JSON.stringify(userAnswers));
      if (onSyncState) {
        onSyncState(userAnswers, Array.from(markedForReview));
      }
    } catch {}
  }, [userAnswers, session.sessionId]);

  // Persist marked reviews to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `vc_marked_${session.sessionId}`,
        JSON.stringify(Array.from(markedForReview))
      );
      if (onSyncState) {
        onSyncState(userAnswers, Array.from(markedForReview));
      }
    } catch {}
  }, [markedForReview, session.sessionId]);

  // 25-Minute Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timeSpentSeconds = session.timeAllowedSeconds - timeRemaining;

  const handleAutoSubmit = () => {
    // Clean up session storage keys
    try {
      sessionStorage.removeItem(`vc_answers_${session.sessionId}`);
      sessionStorage.removeItem(`vc_marked_${session.sessionId}`);
    } catch {}
    onSubmitTest(userAnswers, session.timeAllowedSeconds);
  };

  const handleManualSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      sessionStorage.removeItem(`vc_answers_${session.sessionId}`);
      sessionStorage.removeItem(`vc_marked_${session.sessionId}`);
    } catch {}
    onSubmitTest(userAnswers, timeSpentSeconds);
  };

  // Option selection
  const handleSelectOption = (optionLabel: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionLabel,
    }));
  };

  const handleClearAnswer = () => {
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const handleToggleMarkReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  // Progress metrics
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const reviewCount = markedForReview.size;

  // Format time as MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining <= 300; // < 5 mins

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      
      {/* Top Test Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Branding & Student Context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitModal(true)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              title="Exit Assessment"
            >
              Exit
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-900">Vallabh Classes Assessment</span>
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-xs text-slate-600 font-medium">
                {session.student.name} · Class 10 CBSE
              </span>
            </div>
          </div>

          {/* Center: Live 25-Minute Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base transition-colors ${
              isLowTime
                ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-600' : 'text-teal-700'}`} />
            <span>{formatTime(timeRemaining)}</span>
            <span className="text-[10px] uppercase font-sans font-medium text-slate-500 hidden md:inline">
              remaining
            </span>
          </div>

          {/* Right: Palette Toggle & Submit Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPaletteOpenMobile(!isPaletteOpenMobile)}
              className="lg:hidden p-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ListFilter className="w-4 h-4 text-teal-700" />
              <span>Palette</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-teal-300" />
              <span>Submit Test</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Assessment Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center Zone: Question Card (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-5 text-left">
          
          {/* Question Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs relative">
            
            {/* Header: Question Meta & Review Flag */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-teal-800">
                  {currentQuestion.chapterTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  {currentQuestion.topic}
                </span>
                <button
                  onClick={handleToggleMarkReview}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    markedForReview.has(currentQuestion.id)
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-5">
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed font-sans">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* 4 Options Grid */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = userAnswers[currentQuestion.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(opt.label)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/80 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'border border-slate-300 text-slate-600 bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-sm font-medium text-slate-800 leading-snug pt-0.5">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clear Choice helper */}
            {userAnswers[currentQuestion.id] && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleClearAnswer}
                  className="text-xs text-slate-500 hover:text-red-700 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Response</span>
                </button>
              </div>
            )}

          </div>

          {/* Navigation Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                currentIndex === 0
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {currentIndex + 1} / {totalQuestions}
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-teal-300" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Review & Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Right Zone: Question Navigation Palette (4 cols on desktop) */}
        <div
          className={`lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5 text-left ${
            isPaletteOpenMobile ? 'block' : 'hidden lg:block'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Question Palette</h3>
            <p className="text-xs text-slate-500">Jump to any question instantly.</p>
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-teal-700"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border border-slate-300 bg-white"></span>
              <span>Unanswered ({unansweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-400"></span>
              <span>Marked for Review ({reviewCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded ring-2 ring-slate-900 bg-white"></span>
              <span>Current</span>
            </div>
          </div>

          {/* 20 Question Buttons Grid */}
          <div className="grid grid-cols-5 gap-2.5">
            {session.questions.map((q, qIdx) => {
              const isCurrent = qIdx === currentIndex;
              const isAnswered = !!userAnswers[q.id];
              const isMarked = markedForReview.has(q.id);

              let style = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
              if (isCurrent) {
                style = 'ring-2 ring-slate-900 border-slate-900 font-bold';
              }
              if (isAnswered) {
                style += ' bg-teal-700 text-white border-teal-700';
              }
              if (isMarked) {
                style += ' ring-2 ring-amber-400 border-amber-400';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(qIdx);
                    setIsPaletteOpenMobile(false);
                  }}
                  className={`h-9 rounded-lg border text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer relative ${style}`}
                >
                  <span>{qIdx + 1}</span>
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Questions:</span>
              <span className="font-bold text-slate-900">{totalQuestions}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Attempted:</span>
              <span className="font-bold text-teal-800">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Unattempted:</span>
              <span className="font-bold text-slate-500">{unansweredCount}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-300" />
              <span>Submit Assessment</span>
            </button>
          </div>

        </div>

      </div>

      {/* Manual Submission Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-left space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Submit Mathematics Assessment?
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to finalize your submission? Once submitted, your answers will be automatically and deterministically evaluated.
            </p>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-bold text-teal-800">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unanswered Questions:</span>
                <span className="font-bold text-amber-700">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time Remaining:</span>
                <span className="font-mono font-bold text-slate-900">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You have {unansweredCount} unattempted questions. Any unattempted questions will receive 0 marks.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Keep Solving
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
              >
                Yes, Submit Now
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Exit Test Confirmation Guard Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-left space-y-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Quit Current Assessment?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you leave now, your current session answers and timer progress will be discarded.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Resume Test
              </button>
              <button
                onClick={() => {
                  try {
                    sessionStorage.removeItem(`vc_answers_${session.sessionId}`);
                    sessionStorage.removeItem(`vc_marked_${session.sessionId}`);
                  } catch {}
                  onExitTest();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
