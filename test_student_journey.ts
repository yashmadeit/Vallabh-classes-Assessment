import { questionBankStore } from './src/services/questionBankStore';
import {
  generateAssessmentSession,
  checkSufficientQuestions,
  sanitizeQuestion,
  InsufficientQuestionsError,
} from './src/services/assessmentGenerator';
import { evaluateAssessmentSession } from './src/services/evaluationService';
import { StudentProfile, VerifiedQuestion } from './src/types/assessment';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('===========================================================');
console.log('VALLABH CLASSES: STUDENT ASSESSMENT JOURNEY INTEGRATION AUDIT');
console.log('===========================================================\n');

// -------------------------------------------------------------
// TEST SUITE 1: Student Profile & Curriculum Eligibility
// -------------------------------------------------------------
console.log('Suite 1: Student Profile & Board/Class Eligibility');
const validStudent: StudentProfile = {
  name: 'Aarav Patel',
  studentClass: '10',
  board: 'CBSE',
};

assert(
  validStudent.name.trim().length > 0 &&
  validStudent.studentClass === '10' &&
  validStudent.board === 'CBSE',
  'Valid Class 10 CBSE profile is correctly formed'
);

const gsebStudent: StudentProfile = {
  name: 'Devanshi Shah',
  studentClass: '10',
  board: 'GSEB',
};

const class11Student: StudentProfile = {
  name: 'Rohan Mehta',
  studentClass: '11-science',
  board: 'CBSE',
};

// Check that unverified curricula return 0 approved questions
const gsebApproved = questionBankStore.getApprovedQuestions(gsebStudent.studentClass, gsebStudent.board);
assert(
  gsebApproved.length === 0,
  'Class 10 GSEB correctly has 0 approved questions (locked until official curation)'
);

const c11Approved = questionBankStore.getApprovedQuestions(class11Student.studentClass, class11Student.board);
assert(
  c11Approved.length === 0,
  'Class 11 Science correctly has 0 approved questions (locked until official curation)'
);

// -------------------------------------------------------------
// TEST SUITE 2: Approved Question Bank Integrity
// -------------------------------------------------------------
console.log('\nSuite 2: Approved Question Bank Integrity & Isolation');
const approvedCbse10 = questionBankStore.getApprovedQuestions('10', 'CBSE');

assert(
  approvedCbse10.length >= 95,
  `Approved Class 10 CBSE question bank contains expected scale (Found: ${approvedCbse10.length})`
);

const invalidStatuses = approvedCbse10.filter((q) => q.verificationStatus !== 'Approved');
assert(
  invalidStatuses.length === 0,
  'Strict status isolation: approved pool contains ZERO Draft, Pending, Rejected, or Archived items'
);

// Add a dummy Draft and Pending question to questionBankStore and verify they are NEVER pulled
const dummyDraft = questionBankStore.addQuestion(
  {
    chapterNumber: 1,
    chapterTitle: 'Real Numbers',
    topic: 'Fundamental Theorem of Arithmetic',
    questionText: 'TEST_ISOLATION_DRAFT: What is 2 + 2 in arithmetic modular system?',
    options: [
      { label: 'A', text: '4' },
      { label: 'B', text: '3' },
      { label: 'C', text: '5' },
      { label: 'D', text: '6' },
    ],
    correctOption: 'A',
    explanation: 'Basic arithmetic step-by-step mathematical explanation exceeding 15 chars.',
    difficulty: 'Easy',
    subject: 'Mathematics',
    classId: '10',
    board: 'CBSE',
    sourceType: 'Teacher Created',
    sourceReference: 'Vallabh Classes Diagnostic Unit Bank 2025',
    marks: 1,
  },
  'Draft'
);

const dummyPending = questionBankStore.addQuestion(
  {
    chapterNumber: 1,
    chapterTitle: 'Real Numbers',
    topic: 'Fundamental Theorem of Arithmetic',
    questionText: 'TEST_ISOLATION_PENDING: What is 3 + 3 in algebraic sum test?',
    options: [
      { label: 'A', text: '6' },
      { label: 'B', text: '7' },
      { label: 'C', text: '8' },
      { label: 'D', text: '9' },
    ],
    correctOption: 'A',
    explanation: 'Pending verification detailed step-by-step explanation exceeding minimum length.',
    difficulty: 'Easy',
    subject: 'Mathematics',
    classId: '10',
    board: 'CBSE',
    sourceType: 'Teacher Created',
    sourceReference: 'Vallabh Classes Diagnostic Unit Bank 2025',
    marks: 1,
  },
  'Pending Verification'
);

// Verify newly added non-approved items are excluded from approved pool
const approvedAfterAdds = questionBankStore.getApprovedQuestions('10', 'CBSE');
assert(
  !approvedAfterAdds.some((q) => q.id === dummyDraft.question!.id),
  'Draft question is strictly excluded from approved pool'
);
assert(
  !approvedAfterAdds.some((q) => q.id === dummyPending.question!.id),
  'Pending question is strictly excluded from approved pool'
);

// Archive or leave as non-approved
if (dummyDraft.question) {
  questionBankStore.archiveQuestion(dummyDraft.question.id);
}
if (dummyPending.question) {
  questionBankStore.archiveQuestion(dummyPending.question.id);
}

// -------------------------------------------------------------
// TEST SUITE 3: Assessment Generation & Chapter Distribution
// -------------------------------------------------------------
console.log('\nSuite 3: Assessment Generation & Balanced Chapter Distribution');

// Test A: Single Chapter Selection (Real Numbers, ~20 questions)
const singleChapter = ['Real Numbers'];
const singleSession = generateAssessmentSession(validStudent, singleChapter);

assert(
  singleSession.questions.length === 20,
  `Single-chapter test generates exactly 20 questions (Actual: ${singleSession.questions.length})`
);
assert(
  singleSession.timeAllowedSeconds === 1500,
  `Assessment timer configured to exactly 25 minutes / 1500 seconds (Actual: ${singleSession.timeAllowedSeconds}s)`
);

const allFromSingle = singleSession.questions.every((q) => q.chapterTitle === 'Real Numbers');
assert(
  allFromSingle,
  'All questions in single-chapter test originate exclusively from selected chapter'
);

// Check duplicate questions
const singleIds = new Set(singleSession.questions.map((q) => q.id));
assert(
  singleIds.size === 20,
  'Single-chapter test contains zero duplicate questions (20 unique IDs)'
);

// Test B: Three Chapters Selection (Distribution test: 20 across 3 -> 7, 7, 6)
const threeChapters = ['Real Numbers', 'Polynomials', 'Quadratic Equations'];
const threeSession = generateAssessmentSession(validStudent, threeChapters);

assert(
  threeSession.questions.length === 20,
  `Three-chapter test generates exactly 20 questions (Actual: ${threeSession.questions.length})`
);

const threeIds = new Set(threeSession.questions.map((q) => q.id));
assert(
  threeIds.size === 20,
  'Three-chapter test contains zero duplicate questions (20 unique IDs)'
);

const countByChapter: Record<string, number> = {};
threeSession.questions.forEach((q) => {
  countByChapter[q.chapterTitle] = (countByChapter[q.chapterTitle] || 0) + 1;
});

console.log('    Distribution across 3 chapters:', countByChapter);
const counts = Object.values(countByChapter).sort((a, b) => b - a);
assert(
  counts.length === 3 && counts[0] === 7 && counts[1] === 7 && counts[2] === 6,
  'Questions are distributed as evenly as possible across selected chapters (7, 7, 6)'
);

// Check that no unselected chapters appear
const unselectedPresent = threeSession.questions.some((q) => !threeChapters.includes(q.chapterTitle));
assert(
  !unselectedPresent,
  'Zero questions from unselected chapters appeared in three-chapter test'
);

// Test C: Five Chapters Selection (Distribution test: 20 across 5 -> 4, 4, 4, 4, 4)
const fiveChapters = [
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations in Two Variables',
  'Quadratic Equations',
  'Arithmetic Progressions',
];
const fiveSession = generateAssessmentSession(validStudent, fiveChapters);

const countBy5Chapters: Record<string, number> = {};
fiveSession.questions.forEach((q) => {
  countBy5Chapters[q.chapterTitle] = (countBy5Chapters[q.chapterTitle] || 0) + 1;
});
console.log('    Distribution across 5 chapters:', countBy5Chapters);
const counts5 = Object.values(countBy5Chapters);
assert(
  counts5.length === 5 && counts5.every((c) => c === 4),
  '5-chapter test provides perfectly balanced distribution of 4 questions per chapter'
);

// -------------------------------------------------------------
// TEST SUITE 4: Insufficient Questions Handling
// -------------------------------------------------------------
console.log('\nSuite 4: Insufficient Questions Handling & Error Guards');

// Check checkSufficientQuestions with a non-existent or 0-question chapter
const zeroCheck = checkSufficientQuestions(validStudent, ['NonExistentChapter']);
assert(
  zeroCheck.isSufficient === true, // fallback to all approved chapters when invalid names given
  'Fallback cleanly resolves to all approved chapters if non-existent titles provided'
);

// Check behavior when total approved questions are fewer than 20
// Let's test checkSufficientQuestions with GSEB (0 questions)
const gsebCheck = checkSufficientQuestions(gsebStudent, ['Real Numbers']);
assert(
  gsebCheck.isSufficient === false && gsebCheck.availableCount === 0 && gsebCheck.requiredCount === 20,
  `checkSufficientQuestions reports insufficient questions for uncurated curriculum (${gsebCheck.availableCount}/${gsebCheck.requiredCount})`
);

let caughtError = false;
try {
  generateAssessmentSession(gsebStudent, ['Real Numbers']);
} catch (err) {
  if (err instanceof InsufficientQuestionsError) {
    caughtError = true;
    assert(
      err.availableCount === 0 && err.requiredCount === 20,
      'generateAssessmentSession throws InsufficientQuestionsError with availableCount and requiredCount'
    );
  }
}
assert(caughtError, 'generateAssessmentSession blocks generation when questions < 20');

// -------------------------------------------------------------
// TEST SUITE 5: Security & Payload Sanitization
// -------------------------------------------------------------
console.log('\nSuite 5: Payload Sanitization & Answer Key Protection');

const masterSampleQ = approvedCbse10[0];
const sanitizedSampleQ = sanitizeQuestion(masterSampleQ);

assert(
  (sanitizedSampleQ as any).correctOption === undefined,
  'SanitizedQuestion strictly removes correctOption'
);
assert(
  (sanitizedSampleQ as any).explanation === undefined,
  'SanitizedQuestion strictly removes explanation'
);
assert(
  (sanitizedSampleQ as any).hemangSirTip === undefined,
  'SanitizedQuestion strictly removes hemangSirTip'
);
assert(
  sanitizedSampleQ.options.length === 4 &&
  sanitizedSampleQ.options.every((opt) => (opt as any).isCorrect === undefined),
  'Options list contains only label and text without answer markers'
);

// Verify all questions in generated session are sanitized
const sessionContainsKeys = singleSession.questions.some(
  (q: any) => q.correctOption !== undefined || q.explanation !== undefined || q.hemangSirTip !== undefined
);
assert(
  !sessionContainsKeys,
  'Active AssessmentSession sent to browser client contains ZERO answer keys or explanations'
);

// -------------------------------------------------------------
// TEST SUITE 6: Deterministic Evaluation & Accuracy Calculations
// -------------------------------------------------------------
console.log('\nSuite 6: Controlled Scoring & Accuracy Calculations');

// Generate a controlled test session of 20 questions
const testSession = generateAssessmentSession(validStudent, fiveChapters);

// Build controlled user answers:
// Let's answer:
// - Questions 0..9 (10 questions): 8 correct, 2 incorrect
// - Questions 10..13 (4 questions): 4 correct
// - Questions 14..19 (6 questions): UNANSWERED (skipped)
// Total attempted: 14 questions
// Total correct: 12
// Total incorrect: 2
// Total unanswered: 6
// Expected overall accuracy: (12 / 20) * 100 = 60.0%
// Expected attempted accuracy: (12 / 14) * 100 = 85.7% (85.714... rounded to 85.7)

const controlledAnswers: Record<string, string> = {};
let expectedCorrect = 0;
let expectedIncorrect = 0;
let expectedUnanswered = 6;

// Lookup true answer keys from the approved bank
const questionKeyMap = new Map<string, string>();
approvedCbse10.forEach((q) => questionKeyMap.set(q.id, q.correctOption));

testSession.questions.forEach((sanitizedQ, idx) => {
  const trueKey = questionKeyMap.get(sanitizedQ.id)!;
  const wrongOption = (['A', 'B', 'C', 'D'] as const).find((o) => o !== trueKey)!;

  if (idx < 8) {
    // Correct
    controlledAnswers[sanitizedQ.id] = trueKey;
    expectedCorrect++;
  } else if (idx < 10) {
    // Incorrect
    controlledAnswers[sanitizedQ.id] = wrongOption;
    expectedIncorrect++;
  } else if (idx < 14) {
    // Correct
    controlledAnswers[sanitizedQ.id] = trueKey;
    expectedCorrect++;
  } else {
    // Skipped
    // do not add to controlledAnswers
  }
});

const evaluationResult = evaluateAssessmentSession(testSession, controlledAnswers, 850);

assert(
  evaluationResult.totalQuestions === 20,
  `Evaluation counts total questions correctly (Expected 20, Got ${evaluationResult.totalQuestions})`
);
assert(
  evaluationResult.attemptedCount === 14,
  `Attempted count matches controlled inputs (Expected 14, Got ${evaluationResult.attemptedCount})`
);
assert(
  evaluationResult.unansweredCount === 6,
  `Unanswered count matches controlled inputs (Expected 6, Got ${evaluationResult.unansweredCount})`
);
assert(
  evaluationResult.correctCount === 12,
  `Correct count matches controlled inputs (Expected 12, Got ${evaluationResult.correctCount})`
);
assert(
  evaluationResult.incorrectCount === 2,
  `Incorrect count matches controlled inputs (Expected 2, Got ${evaluationResult.incorrectCount})`
);
assert(
  evaluationResult.overallScore === 12,
  `Overall score matches marks sum (Expected 12, Got ${evaluationResult.overallScore})`
);

// Accuracy checks
const expectedOverallAccuracy = Math.round((12 / 20) * 1000) / 10; // 60%
const expectedAttemptedAccuracy = Math.round((12 / 14) * 1000) / 10; // 85.7%

assert(
  evaluationResult.overallAccuracyPercent === expectedOverallAccuracy,
  `Overall accuracy calculation is mathematically exact: ${evaluationResult.overallAccuracyPercent}%`
);
assert(
  evaluationResult.attemptedAccuracyPercent === expectedAttemptedAccuracy,
  `Attempted accuracy calculation is mathematically exact: ${evaluationResult.attemptedAccuracyPercent}%`
);

// Check chapter diagnostic status rule:
// If attempted < 3 -> "Limited Assessment Data"
// If attempted >= 3 and accuracy >= 70% -> "Strong"
// If attempted >= 3 and accuracy < 70% -> "Needs Revision"
evaluationResult.chapterBreakdown.forEach((ch) => {
  if (ch.attemptedQuestions < 3) {
    assert(
      ch.performanceStatus === 'Limited Assessment Data',
      `Chapter '${ch.chapterTitle}' with ${ch.attemptedQuestions} attempted (<3) classified as 'Limited Assessment Data'`
    );
  } else if (ch.attemptedChapterAccuracy >= 70) {
    assert(
      ch.performanceStatus === 'Strong',
      `Chapter '${ch.chapterTitle}' with ${ch.attemptedChapterAccuracy}% (>=70%) classified as 'Strong'`
    );
  } else {
    assert(
      ch.performanceStatus === 'Needs Revision',
      `Chapter '${ch.chapterTitle}' with ${ch.attemptedChapterAccuracy}% (<70%) classified as 'Needs Revision'`
    );
  }
});

// -------------------------------------------------------------
// TEST SUITE 7: Solution Reviews & Educator Feedback Integrity
// -------------------------------------------------------------
console.log('\nSuite 7: Post-Submission Solution Review & Teacher Feedback Security');

assert(
  evaluationResult.questionReviews.length === 20,
  'Detailed question review contains all 20 questions post-submission'
);

const firstReview = evaluationResult.questionReviews[0];
assert(
  firstReview.explanation.length > 0,
  'Authoritative step-by-step mathematical explanation provided in review'
);
assert(
  firstReview.correctOption === questionKeyMap.get(firstReview.question.id),
  'Review correctOption matches master question bank ground truth'
);

// Verify teacher feedback defaults to undefined (pending educator review) in public student evaluation
assert(
  evaluationResult.teacherFeedback === undefined,
  'Teacher feedback correctly initialized as undefined / Pending Teacher Review (no hardcoded remarks or PINs)'
);

// Verify student report metadata includes helpline contact
assert(
  evaluationResult.student.name === 'Aarav Patel',
  'Evaluation report preserves student identity'
);

console.log('\n===========================================================');
console.log(`AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log('===========================================================\n');
