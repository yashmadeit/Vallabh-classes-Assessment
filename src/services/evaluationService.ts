import {
  AssessmentSession,
  TestEvaluationResult,
  ChapterEvaluation,
  DetailedQuestionReview,
} from '../types/assessment';
import { questionBankStore } from './questionBankStore';

/**
 * Deterministically evaluates an assessment session.
 * Never uses AI to invent marks or fake percentages.
 */
export function evaluateAssessmentSession(
  session: AssessmentSession,
  userAnswers: Record<string, string>,
  timeSpentSeconds: number
): TestEvaluationResult {
  const totalQuestions = session.questions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  // Chapter tracking maps
  interface ChapterStats {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    topicsMissed: Set<string>;
  }

  const chapterStatsMap: Map<string, ChapterStats> = new Map();

  // Initialize stats for each chapter present in the session
  session.selectedChapterTitles.forEach((chTitle) => {
    chapterStatsMap.set(chTitle, {
      total: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      topicsMissed: new Set(),
    });
  });

  const questionReviews: DetailedQuestionReview[] = [];

  session.questions.forEach((sanitizedQ, index) => {
    const verifiedQ = questionBankStore.getQuestionById(sanitizedQ.id);
    if (!verifiedQ) {
      throw new Error(`Integrity error: Question ID ${sanitizedQ.id} not found in authoritative bank.`);
    }

    const studentAnswer = userAnswers[sanitizedQ.id] || null;
    const isAttempted = studentAnswer !== null && studentAnswer !== undefined && studentAnswer.trim() !== '';
    const isCorrect = isAttempted && studentAnswer === verifiedQ.correctOption;

    if (!chapterStatsMap.has(verifiedQ.chapterTitle)) {
      chapterStatsMap.set(verifiedQ.chapterTitle, {
        total: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        topicsMissed: new Set(),
      });
    }

    const cStats = chapterStatsMap.get(verifiedQ.chapterTitle)!;
    cStats.total += 1;

    if (isAttempted) {
      cStats.attempted += 1;
      if (isCorrect) {
        correctCount += 1;
        cStats.correct += 1;
      } else {
        incorrectCount += 1;
        cStats.incorrect += 1;
        cStats.topicsMissed.add(verifiedQ.topic);
      }
    } else {
      unansweredCount += 1;
      cStats.unanswered += 1;
      cStats.topicsMissed.add(verifiedQ.topic);
    }

    questionReviews.push({
      questionNumber: index + 1,
      question: sanitizedQ,
      studentAnswer,
      correctOption: verifiedQ.correctOption,
      isCorrect,
      isAttempted,
      explanation: verifiedQ.explanation,
      hemangSirTip: verifiedQ.hemangSirTip || '',
    });
  });

  const attemptedCount = correctCount + incorrectCount;

  // Accuracies
  const overallAccuracyPercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const attemptedAccuracyPercent = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // Chapter-wise breakdown and status determination
  const chapterBreakdown: ChapterEvaluation[] = [];
  const strongChapters: string[] = [];
  const weakChapters: string[] = [];
  const limitedDataChapters: string[] = [];
  const specificRecommendations: string[] = [];

  chapterStatsMap.forEach((stats, chapterTitle) => {
    if (stats.total === 0) return;

    const attemptedAcc = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
    const overallAcc = (stats.correct / stats.total) * 100;

    let performanceStatus: 'Strong' | 'Needs Revision' | 'Limited Assessment Data';
    let reason: string | undefined;

    // Rule: Do not classify as strong or weak if fewer than three questions attempted
    if (stats.attempted < 3) {
      performanceStatus = 'Limited Assessment Data';
      reason = 'Fewer than 3 questions attempted from this chapter.';
      limitedDataChapters.push(chapterTitle);
      specificRecommendations.push(
        `${chapterTitle}: Re-attempt with more questions answered to establish an accurate readiness benchmark.`
      );
    } else if (attemptedAcc >= 70) {
      performanceStatus = 'Strong';
      strongChapters.push(chapterTitle);
    } else {
      performanceStatus = 'Needs Revision';
      weakChapters.push(chapterTitle);
      const missedTopicsList = Array.from(stats.topicsMissed).slice(0, 2).join(', ');
      specificRecommendations.push(
        `${chapterTitle}: Focus revision on ${missedTopicsList || 'core formulas and theorem conditions'}.`
      );
    }

    chapterBreakdown.push({
      chapterTitle,
      totalQuestions: stats.total,
      attemptedQuestions: stats.attempted,
      correctAnswers: stats.correct,
      incorrectAnswers: stats.incorrect,
      unansweredQuestions: stats.unanswered,
      overallChapterAccuracy: Number(overallAcc.toFixed(1)),
      attemptedChapterAccuracy: Number(attemptedAcc.toFixed(1)),
      performanceStatus,
      reason,
    });
  });

  if (specificRecommendations.length === 0) {
    specificRecommendations.push(
      'Excellent performance across all assessed chapters. Maintain regular mixed-chapter problem practice to sustain speed.'
    );
  }

  return {
    resultId: `vc-res-${Date.now()}`,
    sessionId: session.sessionId,
    student: session.student,
    totalQuestions,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    overallScore: correctCount,
    overallAccuracyPercent: Number(overallAccuracyPercent.toFixed(1)),
    attemptedAccuracyPercent: Number(attemptedAccuracyPercent.toFixed(1)),
    timeSpentSeconds,
    chapterBreakdown,
    strongChapters,
    weakChapters,
    limitedDataChapters,
    specificRecommendations,
    questionReviews,
    submittedAt: new Date().toISOString(),
  };
}
