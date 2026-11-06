import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  RotateCcw,
  ArrowRight,
  Phone,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  Clock
} from 'lucide-react';
import { TestEvaluationResult } from '../types/assessment';
import { generatePdfReport } from '../services/pdfReportGenerator';

interface PerformanceReportViewProps {
  result: TestEvaluationResult;
  onRetakeOrNewChapters: () => void;
  onNavigateHome: () => void;
}

export const PerformanceReportView: React.FC<PerformanceReportViewProps> = ({
  result,
  onRetakeOrNewChapters,
  onNavigateHome,
}) => {
  const [filterReview, setFilterReview] = useState<'all' | 'incorrect' | 'skipped' | 'correct'>('all');

  const handleDownloadPdf = () => {
    generatePdfReport(result);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredQuestions = result.questionReviews.filter((q) => {
    if (filterReview === 'correct') return q.isCorrect;
    if (filterReview === 'incorrect') return q.isAttempted && !q.isCorrect;
    if (filterReview === 'skipped') return !q.isAttempted;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-left">
      
      {/* Top Action Header */}
      <div className="bg-white border-b border-slate-200 sticky top-18 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div>
            <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
              Diagnostic Assessment Completed
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Performance & Diagnostics Report
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onRetakeOrNewChapters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Choose Chapters</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-7">
        
        {/* Student Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Student Details
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {result.student.name}
            </div>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-teal-800">Class 10</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-700">CBSE Board</span>
              <span className="text-slate-300">·</span>
              <span>Test ID: {result.resultId}</span>
              <span className="text-slate-300">·</span>
              <span>
                {new Date(result.submittedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
              Verified Class 10 CBSE Benchmark
            </span>
          </div>
        </div>

        {/* 4 Scorecard KPI Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Overall Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Score
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
              {result.overallScore} <span className="text-base text-slate-400 font-normal">/ {result.totalQuestions}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {result.correctCount} correct · {result.incorrectCount} wrong
            </div>
          </div>

          {/* Overall Accuracy */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overall Test Accuracy
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
              {result.overallAccuracyPercent}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Correct out of all 20 test questions
            </div>
          </div>

          {/* Attempted Accuracy (Explicitly distinguished) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Attempted-Question Accuracy
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono mt-1">
              {result.attemptedAccuracyPercent}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Correct on {result.attemptedCount} attempted ({result.unansweredCount} skipped)
            </div>
          </div>

          {/* Time Taken */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time Taken
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
              {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Out of 25 minutes allocated
            </div>
          </div>

        </div>

        {/* Chapter-wise Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Chapter-wise Performance Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation across tested Class 10 CBSE syllabus chapters.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Chapter Title</th>
                  <th className="py-3 px-3 text-center">Total Qs</th>
                  <th className="py-3 px-3 text-center">Attempted</th>
                  <th className="py-3 px-3 text-center">Correct</th>
                  <th className="py-3 px-3 text-center">Accuracy</th>
                  <th className="py-3 px-4">Diagnostic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.chapterBreakdown.map((ch) => (
                  <tr key={ch.chapterTitle} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {ch.chapterTitle}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                      {ch.totalQuestions}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                      {ch.attemptedQuestions}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-teal-800 font-mono">
                      {ch.correctAnswers}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {ch.attemptedChapterAccuracy}%
                    </td>
                    <td className="py-3.5 px-4">
                      {ch.performanceStatus === 'Strong' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Strong (&ge;70%)</span>
                        </span>
                      )}
                      {ch.performanceStatus === 'Needs Revision' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Needs Revision</span>
                        </span>
                      )}
                      {ch.performanceStatus === 'Limited Assessment Data' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700" title={ch.reason}>
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Limited Assessment Data (&lt;3 attempted)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnosis & Actionable Syllabus Recommendations */}
        <div className="grid md:grid-cols-2 gap-5">
          
          {/* Diagnostic Categorization */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Diagnostic Categorization
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-teal-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Strong Chapters (Board Ready):</span>
                </span>
                {result.strongChapters.length > 0 ? (
                  <p className="text-slate-700 pl-5">
                    {result.strongChapters.join(', ')}
                  </p>
                ) : (
                  <p className="text-slate-500 pl-5 italic">No chapters currently meet the &ge;70% threshold.</p>
                )}
              </div>

              <div>
                <span className="font-semibold text-red-700 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Chapters Requiring Immediate Revision:</span>
                </span>
                {result.weakChapters.length > 0 ? (
                  <p className="text-slate-700 pl-5">
                    {result.weakChapters.join(', ')}
                  </p>
                ) : (
                  <p className="text-slate-500 pl-5 italic">No chapters classified under revision threshold.</p>
                )}
              </div>

              {result.limitedDataChapters.length > 0 && (
                <div>
                  <span className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Limited Assessment Data (&lt;3 questions attempted):</span>
                  </span>
                  <p className="text-slate-700 pl-5">
                    {result.limitedDataChapters.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specific Syllabus Recommendations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Specific Syllabus Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {result.specificRecommendations.map((rec, rIdx) => (
                <li key={rIdx} className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold shrink-0 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Section: Hemang Shah Sir's Personal Feedback (Visible as Pending Teacher Review in Public App) */}
        <div className="bg-white rounded-xl border border-teal-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                Teacher Consultation & Guidance
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Hemang Shah Sir's Personal Feedback
              </h3>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>Pending Teacher Review</span>
            </div>
          </div>

          <div className="py-4">
            {result.teacherFeedback && result.teacherFeedback.remarks.trim() ? (
              <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-teal-950 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Authorized Remarks by Hemang Shah Sir</span>
                  <span className="text-slate-400 font-normal">· {result.teacherFeedback.updatedAt}</span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed italic">
                  "{result.teacherFeedback.remarks}"
                </p>
                {result.teacherFeedback.recommendedFocus && (
                  <div className="text-xs text-teal-900 font-medium pt-1">
                    <span className="font-bold">Priority Focus Area: </span>
                    {result.teacherFeedback.recommendedFocus}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Awaiting In-Person / Telephonic Educator Review</span>
                </div>
                <p className="leading-relaxed">
                  Personalized teacher feedback is provided directly by <span className="text-slate-900 font-semibold">Hemang Shah Sir</span> after evaluating the student’s problem-solving steps and conceptual patterns. To preserve academic integrity, faculty remark editing is restricted to verified administrative sessions.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/919824076529?text=${encodeURIComponent(
                      `Hello Hemang Sir, I am ${result.student.name} (Class 10 CBSE). I completed the online Maths assessment with a score of ${result.overallScore}/${result.totalQuestions} (Accuracy: ${result.attemptedAccuracyPercent}%). Please find my assessment ID: ${result.resultId}. I would like your guidance on my weak chapters.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-950 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Share Diagnostic Report on WhatsApp</span>
                  </a>
                  <a
                    href="tel:9824076529"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>Call Hemang Sir: 9824076529</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Vallabh Classes Classroom: Harni–Sama Link Road, Vadodara</span>
            <span className="font-semibold text-slate-700">Helpline: +91 98240 76529</span>
          </div>
        </div>

        {/* Question-by-Question Solution Review */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Detailed Question Review & Marking Solutions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your responses against verified CBSE solutions and Hemang Shah Sir’s board tips.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              {(['all', 'incorrect', 'skipped', 'correct'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterReview(mode)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    filterReview === mode
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((rev) => (
              <div
                key={rev.question.id}
                className={`rounded-xl border p-4 sm:p-5 transition-all text-left ${
                  rev.isCorrect
                    ? 'border-teal-200 bg-teal-50/20'
                    : !rev.isAttempted
                    ? 'border-slate-200 bg-slate-50/40'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                {/* Top Bar: Question Meta & Status */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">Q{rev.questionNumber}.</span>
                    <span className="font-semibold text-slate-700">{rev.question.chapterTitle}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 hidden sm:inline">{rev.question.topic}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-teal-800 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Correct</span>
                      </span>
                    ) : !rev.isAttempted ? (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-xs">
                        <span>Unattempted (Skipped)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-3">
                  {rev.question.questionText}
                </p>

                {/* Options List */}
                <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                  {rev.question.options.map((opt) => {
                    const isStudentPick = rev.studentAnswer === opt.label;
                    const isCorrectAnswer = rev.correctOption === opt.label;

                    let optClass = 'border-slate-200 bg-white text-slate-700';
                    if (isCorrectAnswer) {
                      optClass = 'border-teal-600 bg-teal-50 text-teal-950 font-bold ring-1 ring-teal-600';
                    } else if (isStudentPick && !isCorrectAnswer) {
                      optClass = 'border-red-400 bg-red-50 text-red-950 line-through';
                    }

                    return (
                      <div
                        key={opt.label}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${optClass}`}
                      >
                        <span className="font-bold font-mono">{opt.label}.</span>
                        <span>{opt.text}</span>
                        {isStudentPick && (
                          <span className="ml-auto text-[10px] font-mono uppercase bg-slate-200/80 px-1 rounded text-slate-700">
                            Your Choice
                          </span>
                        )}
                        {isCorrectAnswer && (
                          <span className="ml-auto text-[10px] font-mono uppercase bg-teal-200/80 px-1 rounded text-teal-900 font-bold">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step-by-Step Explanation & Hemang Sir's Note */}
                <div className="mt-3 p-3.5 rounded-lg bg-white border border-slate-200 text-xs leading-relaxed space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-900">Step-by-Step Mathematical Explanation: </span>
                    <span className="text-slate-700">{rev.explanation}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-teal-950">
                    <span className="font-bold text-teal-800">Hemang Shah Sir's Board Tip: </span>
                    <span className="text-slate-700 italic">{rev.hemangSirTip}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Ready to test another chapter or consult with Hemang Shah Sir?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Select other chapters from the Class 10 CBSE syllabus or visit our Vadodara classroom.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Back to Home
            </button>
            <button
              onClick={onRetakeOrNewChapters}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Choose Different Chapters</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
