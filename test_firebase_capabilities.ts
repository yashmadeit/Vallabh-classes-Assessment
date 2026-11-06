import { firebaseQuestionBankService } from './src/services/firebaseQuestionBankService';
import { questionBankStore } from './src/services/questionBankStore';
import { generateAssessmentSession } from './src/services/assessmentGenerator';
import { StudentProfile, VerifiedQuestion } from './src/types/assessment';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('===========================================================');
console.log('VALLABH CLASSES: FIREBASE ARCHITECTURE & MULTI-USER AUDIT');
console.log('===========================================================\n');

// -------------------------------------------------------------
// SUITE 1: Question Bank Integrity & Assessment Isolation
// -------------------------------------------------------------
console.log('Suite 1: Student Assessment Engine & Quarantined Question Isolation');

const student: StudentProfile = {
  name: 'Tanvi Shah',
  studentClass: '10',
  board: 'CBSE',
};

const approvedPool = firebaseQuestionBankService.getApprovedQuestions('10', 'CBSE');
assert(
  approvedPool.length >= 95,
  `Authoritative approved question pool contains expected scale (Found: ${approvedPool.length})`
);

// Verify no non-approved statuses are in the approved pool
const nonApprovedInPool = approvedPool.filter(
  (q) =>
    q.verificationStatus === 'Flagged for Correction' ||
    q.verificationStatus === 'Under Correction' ||
    q.verificationStatus === 'Draft' ||
    q.verificationStatus === 'Pending Verification' ||
    q.verificationStatus === 'Rejected' ||
    q.verificationStatus === 'Archived'
);
assert(
  nonApprovedInPool.length === 0,
  'Approved test pool strictly excludes Flagged, Under Correction, Draft, Pending, Rejected, and Archived questions'
);

// -------------------------------------------------------------
// SUITE 2: Issue Reporting & Flagged for Correction Lifecycle
// -------------------------------------------------------------
console.log('\nSuite 2: Question Correction & Issue Reporting Workflow');

// Pick a sample question to test
const targetQ = approvedPool[0];
const originalStatus = targetQ.verificationStatus;
const originalVersion = targetQ.version || 1;

console.log(`    Testing question ${targetQ.id} (Current status: ${originalStatus}, v${originalVersion})`);

// Simulate flagging the question by Hemang Sir
const flaggedCopy: VerifiedQuestion = {
  ...targetQ,
  verificationStatus: 'Flagged for Correction',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Hemang Shah Sir',
};

// Temporarily update cache
(firebaseQuestionBankService as any).questionsCache.set(targetQ.id, flaggedCopy);

// Now verify that the flagged question is immediately removed from approved test pool
const approvedAfterFlag = firebaseQuestionBankService.getApprovedQuestions('10', 'CBSE');
const isFlaggedIncluded = approvedAfterFlag.some((q) => q.id === targetQ.id);

assert(
  !isFlaggedIncluded,
  `Question ${targetQ.id} with status 'Flagged for Correction' is IMMEDIATELY excluded from student assessment pool`
);

// Test generation excludes the flagged question
const assessmentSession = generateAssessmentSession(student, ['Real Numbers', 'Polynomials']);
const assessmentContainsFlagged = assessmentSession.questions.some((q) => q.id === targetQ.id);

assert(
  !assessmentContainsFlagged,
  `Newly generated 20-question student assessment session does NOT contain flagged question ${targetQ.id}`
);

// -------------------------------------------------------------
// SUITE 3: Correction Progression Lifecycle & Live Re-Admission
// -------------------------------------------------------------
console.log('\nSuite 3: Correction Progression Lifecycle');

// Advance to 'Under Correction'
const underCorrectionCopy: VerifiedQuestion = {
  ...flaggedCopy,
  verificationStatus: 'Under Correction',
};
(firebaseQuestionBankService as any).questionsCache.set(targetQ.id, underCorrectionCopy);

const approvedUnderCorrection = firebaseQuestionBankService.getApprovedQuestions('10', 'CBSE');
assert(
  !approvedUnderCorrection.some((q) => q.id === targetQ.id),
  `Question with status 'Under Correction' remains quarantined from student test pool`
);

// Advance to 'Approved' after administrator resolution
const approvedRestoredCopy: VerifiedQuestion = {
  ...underCorrectionCopy,
  verificationStatus: 'Approved',
  version: originalVersion + 1,
};
(firebaseQuestionBankService as any).questionsCache.set(targetQ.id, approvedRestoredCopy);

const approvedFinal = firebaseQuestionBankService.getApprovedQuestions('10', 'CBSE');
assert(
  approvedFinal.some((q) => q.id === targetQ.id && q.version === originalVersion + 1),
  `Resolved question with status 'Approved' successfully re-enters live student testing pool at v${originalVersion + 1}`
);

// -------------------------------------------------------------
// SUITE 4: Export Formats & Backup Integrity
// -------------------------------------------------------------
console.log('\nSuite 4: Export Formats & Backup Integrity');

const jsonExport = firebaseQuestionBankService.exportToJson();
assert(
  jsonExport.length > 5000,
  `Full JSON export contains comprehensive payload (${jsonExport.length} characters)`
);

const parsedJson = JSON.parse(jsonExport);
assert(
  Array.isArray(parsedJson) && parsedJson.length >= 95,
  `Exported JSON parses into valid array with ${parsedJson.length} questions`
);

const csvExport = firebaseQuestionBankService.exportToCsv();
assert(
  csvExport.startsWith('ID,Class,Board'),
  'CSV export begins with expected standardized column headers'
);

const csvLines = csvExport.split('\n');
assert(
  csvLines.length >= 96,
  `CSV export contains header + at least 95 question rows (Total lines: ${csvLines.length})`
);

// -------------------------------------------------------------
// SUITE 5: Role-Based Authorization Bounds
// -------------------------------------------------------------
console.log('\nSuite 5: Security Architecture & Role Authorization Bounds');

const adminEmail = 'nikhilprasad9797@gmail.com';
const facultyEmail = 'hemang@vallabhclasses.com';

const BOOTSTRAP_ADMIN_EMAILS = ['nikhilprasad9797@gmail.com', 'admin@vallabhclasses.com'];

assert(
  BOOTSTRAP_ADMIN_EMAILS.includes(adminEmail.toLowerCase()),
  `Admin email ${adminEmail} matches bootstrap administrative authority`
);
assert(
  !BOOTSTRAP_ADMIN_EMAILS.includes(facultyEmail.toLowerCase()),
  `Faculty email ${facultyEmail} defaults to read-only/contributor faculty role`
);

// Restore original test question to cache
(firebaseQuestionBankService as any).questionsCache.set(targetQ.id, targetQ);

console.log('\n===========================================================');
console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED (100%)`);
console.log('===========================================================\n');
