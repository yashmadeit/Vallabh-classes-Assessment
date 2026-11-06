export type StudentClass = '10' | '11-science' | '12-science';
export type BoardType = 'CBSE' | 'GSEB';

export interface StudentProfile {
  name: string;
  studentClass: StudentClass;
  board: BoardType;
  phone?: string;
  registeredAt?: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  classId: StudentClass;
  unit: string;
  keyTopics: string[];
  difficulty: 'Foundational' | 'Moderate' | 'Advanced';
  estimatedMinutes: number;
  diagnosticQuestionsCount: number;
  isDemonstration: boolean;
  conceptHighlight: string;
  isVerifiedQuestionBankAvailable?: boolean;
}

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Foundational' | 'Moderate' | 'Advanced';
export type VerificationStatus =
  | 'Draft'
  | 'Pending Verification'
  | 'Approved'
  | 'Rejected'
  | 'Archived'
  | 'Flagged for Correction'
  | 'Under Correction';
export type QuestionSourceType = 'NCERT' | 'CBSE' | 'GSEB' | 'Teacher Created';

export interface VerifiedQuestion {
  id: string;
  classId: StudentClass;
  board: BoardType;
  subject: string; // 'Mathematics'
  chapterNumber: number;
  chapterTitle: string;
  topic: string;
  difficulty: QuestionDifficulty;
  questionText: string;
  options: QuestionOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  hemangSirTip?: string;
  marks: number;
  sourceType: QuestionSourceType;
  sourceReference: string;
  verificationStatus: VerificationStatus;
  version?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'faculty';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}

export type IssueCategory =
  | 'Incorrect question'
  | 'Incorrect answer'
  | 'Incorrect explanation'
  | 'Mathematical calculation error'
  | 'Incorrect syllabus mapping'
  | 'Duplicate question'
  | 'Formatting issue'
  | 'Other';

export type CorrectionPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type CorrectionStatus = 'Flagged for Correction' | 'Under Correction' | 'Resolved' | 'Rejected';

export interface QuestionCorrection {
  id: string;
  questionId: string;
  chapterTitle: string;
  topic: string;
  issueCategory: IssueCategory;
  description: string;
  suggestedCorrection?: string;
  priority: CorrectionPriority;
  reportedBy: string;
  reportedByEmail?: string;
  reportedByUid?: string;
  status: CorrectionStatus;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  originalQuestionSnapshot?: Partial<VerifiedQuestion>;
}

export interface QuestionVersion {
  id: string;
  questionId: string;
  version: number;
  questionSnapshot: VerifiedQuestion;
  modifiedBy: string;
  modifiedByUid?: string;
  reason: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: 'question' | 'correction' | 'backup' | 'settings' | 'user';
  targetId: string;
  details: string;
  performedBy: string;
  performedByUid?: string;
  timestamp: string;
}

export interface SystemBackup {
  id: string;
  backupType: 'manual' | 'automated' | 'pre_restore';
  questionCount: number;
  correctionsCount: number;
  createdBy: string;
  timestamp: string;
  dataPayload: string; // JSON string of questions and corrections
  status: 'completed' | 'failed';
  notes?: string;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'offline' | 'error' | 'empty_cloud';

export interface MigrationProgress {
  stage: 'checking' | 'writing' | 'logging' | 'backup' | 'completed' | 'error';
  currentBatch: number;
  totalBatches: number;
  migratedCount: number;
  skippedCount: number;
  message: string;
}


/**
 * Sanitized Question delivered to the student test engine.
 * Strips correctOption, explanation, and tips so keys cannot be inspected prior to submission.
 */
export interface SanitizedQuestion {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  topic: string;
  difficulty: QuestionDifficulty;
  questionText: string;
  options: QuestionOption[];
  marks?: number;
}

export interface AssessmentSession {
  sessionId: string;
  student: StudentProfile;
  selectedChapterTitles: string[];
  questions: SanitizedQuestion[];
  userAnswers: Record<string, string>; // questionId -> optionLabel
  markedForReview: string[]; // questionIds
  timeAllowedSeconds: number; // 25 mins = 1500
  timeRemainingSeconds: number;
  startedAt: string;
  isCompleted: boolean;
}

export interface ChapterEvaluation {
  chapterTitle: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  overallChapterAccuracy: number; // (correct / total) * 100
  attemptedChapterAccuracy: number; // (correct / attempted) * 100 (0 if attempted === 0)
  performanceStatus: 'Strong' | 'Needs Revision' | 'Limited Assessment Data';
  reason?: string;
}

export interface DetailedQuestionReview {
  questionNumber: number;
  question: SanitizedQuestion;
  studentAnswer: string | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  isAttempted: boolean;
  explanation: string;
  hemangSirTip: string;
}

export interface TeacherFeedback {
  teacherName: string;
  remarks: string;
  recommendedFocus: string;
  updatedAt: string;
  isAuthorized: boolean;
}

export interface TestEvaluationResult {
  resultId: string;
  sessionId: string;
  student: StudentProfile;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  overallScore: number;
  overallAccuracyPercent: number; // (correct / totalQuestions) * 100
  attemptedAccuracyPercent: number; // (correct / attemptedCount) * 100
  timeSpentSeconds: number;
  chapterBreakdown: ChapterEvaluation[];
  strongChapters: string[];
  weakChapters: string[];
  limitedDataChapters: string[];
  specificRecommendations: string[];
  questionReviews: DetailedQuestionReview[];
  submittedAt: string;
  teacherFeedback?: TeacherFeedback;
}

export interface SampleQuestion {
  id: string;
  chapterTitle: string;
  classLabel: string;
  questionText: string;
  conceptTested: string;
  options: { label: string; text: string }[];
  correctOption: string;
  hemangSirNote: string;
}

export interface QuestionValidationError {
  rowNumber?: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvImportRow {
  rowNumber: number;
  class: string;
  board: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: string;
  source: string;
  sourceReference: string;
}

export interface CsvImportPreviewItem {
  rowNumber: number;
  raw: CsvImportRow;
  parsedQuestion?: VerifiedQuestion;
  errors: QuestionValidationError[];
  isDuplicate: boolean;
  duplicateId?: string;
  duplicateMatchText?: string;
  isValid: boolean;
}

export interface FacultyDashboardStats {
  totalQuestions: number;
  approvedQuestions: number;
  draftQuestions: number;
  pendingVerification: number;
  rejectedQuestions: number;
  archivedQuestions: number;
  flaggedForCorrection?: number;
  underCorrection?: number;
  questionsByClass: Record<string, number>;
  questionsByChapter: Record<string, number>;
  questionsByDifficulty: Record<string, number>;
  questionsBySource: Record<string, number>;
}

export interface AssessmentSettings {
  defaultQuestionCount: number;
  defaultTimeMinutes: number;
  passingScorePercent: number;
  minimumAttemptsForDiagnosis: number;
  distributionStrategy: 'even' | 'weighted';
  allowCalculator: boolean;
}
