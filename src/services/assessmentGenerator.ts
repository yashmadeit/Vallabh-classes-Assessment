import {
  StudentProfile,
  SanitizedQuestion,
  AssessmentSession,
  VerifiedQuestion,
} from '../types/assessment';
import { questionBankStore } from './questionBankStore';

/**
 * Fisher-Yates array shuffle for non-biased question ordering
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Strips correctOption, explanation, and tips from a question to protect answer keys
 * before test submission.
 */
export function sanitizeQuestion(q: VerifiedQuestion): SanitizedQuestion {
  return {
    id: q.id,
    chapterNumber: q.chapterNumber,
    chapterTitle: q.chapterTitle,
    topic: q.topic,
    difficulty: q.difficulty,
    questionText: q.questionText,
    options: q.options.map((opt) => ({ label: opt.label, text: opt.text })),
    marks: q.marks || 1,
  };
}

export class InsufficientQuestionsError extends Error {
  public readonly availableCount: number;
  public readonly requiredCount: number;
  public readonly selectedChapters: string[];

  constructor(availableCount: number, requiredCount: number, selectedChapters: string[]) {
    super(
      `Insufficient approved questions: Selected chapter(s) contain only ${availableCount} verified question(s), which is fewer than the ${requiredCount} questions required for an assessment. Please select additional verified chapters.`
    );
    this.name = 'InsufficientQuestionsError';
    this.availableCount = availableCount;
    this.requiredCount = requiredCount;
    this.selectedChapters = selectedChapters;
  }
}

/**
 * Checks whether the selected chapters have enough approved questions to generate a complete test.
 */
export function checkSufficientQuestions(
  student: StudentProfile,
  selectedChapterTitles: string[]
): { isSufficient: boolean; availableCount: number; requiredCount: number; message?: string } {
  const settings = questionBankStore.getAssessmentSettings();
  const requiredCount = settings.defaultQuestionCount || 20;
  const approvedPool = questionBankStore.getApprovedQuestions(student.studentClass, student.board);

  const validChapters = selectedChapterTitles.filter((title) =>
    approvedPool.some((q) => q.chapterTitle === title)
  );

  const activeChapterTitles =
    validChapters.length > 0
      ? validChapters
      : Array.from(new Set(approvedPool.map((q) => q.chapterTitle)));

  const availableCount = approvedPool.filter((q) =>
    activeChapterTitles.includes(q.chapterTitle)
  ).length;

  if (availableCount < requiredCount) {
    return {
      isSufficient: false,
      availableCount,
      requiredCount,
      message: `The selected chapter(s) contain only ${availableCount} verified question(s), which is fewer than the ${requiredCount} questions required for a complete assessment. Please select additional verified chapters.`,
    };
  }

  return { isSufficient: true, availableCount, requiredCount };
}

/**
 * Generates an assessment of exactly 20 questions distributed as evenly as possible
 * across the selected chapters without any duplicates, drawn exclusively from APPROVED questions.
 * Throws InsufficientQuestionsError if available approved questions are fewer than target count.
 */
export function generateAssessmentSession(
  student: StudentProfile,
  selectedChapterTitles: string[]
): AssessmentSession {
  const settings = questionBankStore.getAssessmentSettings();
  const TOTAL_TARGET_QUESTIONS = settings.defaultQuestionCount || 20;
  const timeAllowedSeconds = (settings.defaultTimeMinutes || 25) * 60;

  // Retrieve strictly APPROVED questions for the student's curriculum
  const approvedPool = questionBankStore.getApprovedQuestions(student.studentClass, student.board);

  // Filter bank for selected chapters
  const validChapters = selectedChapterTitles.filter((title) =>
    approvedPool.some((q) => q.chapterTitle === title)
  );

  // Fallback to all approved chapters if none validly selected
  const activeChapterTitles =
    validChapters.length > 0
      ? validChapters
      : Array.from(new Set(approvedPool.map((q) => q.chapterTitle)));

  // Validate that total approved questions available across selected chapters meet target
  const totalAvailableInSelected = approvedPool.filter((q) =>
    activeChapterTitles.includes(q.chapterTitle)
  ).length;

  if (totalAvailableInSelected < TOTAL_TARGET_QUESTIONS) {
    throw new InsufficientQuestionsError(
      totalAvailableInSelected,
      TOTAL_TARGET_QUESTIONS,
      activeChapterTitles
    );
  }

  const k = Math.max(1, activeChapterTitles.length);
  const baseCount = Math.floor(TOTAL_TARGET_QUESTIONS / k);
  const remainder = TOTAL_TARGET_QUESTIONS % k;

  const selectedVerifiedQuestions: VerifiedQuestion[] = [];
  const selectedQuestionIds = new Set<string>();

  // Determine question quota per chapter
  activeChapterTitles.forEach((chapterTitle, index) => {
    const quota = index < remainder ? baseCount + 1 : baseCount;

    // Filter available questions for this chapter that haven't been picked
    const chapterQuestions = approvedPool.filter(
      (q) => q.chapterTitle === chapterTitle && !selectedQuestionIds.has(q.id)
    );

    // Group by difficulty to ensure balanced representation
    const foundational = chapterQuestions.filter(
      (q) => q.difficulty === 'Foundational' || q.difficulty === 'Easy'
    );
    const moderate = chapterQuestions.filter(
      (q) => q.difficulty === 'Moderate' || q.difficulty === 'Medium'
    );
    const advanced = chapterQuestions.filter(
      (q) => q.difficulty === 'Advanced' || q.difficulty === 'Hard'
    );

    const balancedPool = [
      ...shuffleArray(foundational),
      ...shuffleArray(moderate),
      ...shuffleArray(advanced),
    ];

    const chosenFromChapter = balancedPool.slice(0, quota);
    chosenFromChapter.forEach((q) => {
      selectedVerifiedQuestions.push(q);
      selectedQuestionIds.add(q.id);
    });
  });

  // If still short of target due to any chapter pool limitation, draw remaining from available approved
  if (selectedVerifiedQuestions.length < TOTAL_TARGET_QUESTIONS) {
    const remainingNeeded = TOTAL_TARGET_QUESTIONS - selectedVerifiedQuestions.length;
    const remainingPool = approvedPool.filter(
      (q) =>
        activeChapterTitles.includes(q.chapterTitle) && !selectedQuestionIds.has(q.id)
    );
    const extraPicks = shuffleArray(remainingPool).slice(0, remainingNeeded);
    extraPicks.forEach((q) => {
      selectedVerifiedQuestions.push(q);
      selectedQuestionIds.add(q.id);
    });
  }

  // Shuffle the final 20 questions so chapters are naturally interspersed like a real exam
  const finalQuestions = shuffleArray(selectedVerifiedQuestions).map(sanitizeQuestion);

  return {
    sessionId: `vc-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    student,
    selectedChapterTitles: activeChapterTitles,
    questions: finalQuestions,
    userAnswers: {},
    markedForReview: [],
    timeAllowedSeconds,
    timeRemainingSeconds: timeAllowedSeconds,
    startedAt: new Date().toISOString(),
    isCompleted: false,
  };
}
