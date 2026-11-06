import {
  VerifiedQuestion,
  VerificationStatus,
  QuestionValidationError,
  FacultyDashboardStats,
  AssessmentSettings,
  CsvImportPreviewItem,
  CsvImportRow,
  StudentClass,
  BoardType,
} from '../types/assessment';
import { CLASS_10_CBSE_QUESTION_BANK } from '../data/class10CbseQuestionBank';
import { firebaseQuestionBankService } from './firebaseQuestionBankService';

const CUSTOM_BANK_STORAGE_KEY = 'vallabh_classes_custom_bank_v2';
const SETTINGS_STORAGE_KEY = 'vallabh_classes_assessment_settings_v1';

const DEFAULT_SETTINGS: AssessmentSettings = {
  defaultQuestionCount: 20,
  defaultTimeMinutes: 25,
  passingScorePercent: 70,
  minimumAttemptsForDiagnosis: 3,
  distributionStrategy: 'even',
  allowCalculator: false,
};

/**
 * Normalizes a question string for duplicate detection (removes whitespace, punctuation, lowercases)
 */
export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\d]/g, '')
    .trim();
}

// In-memory fallback for testing and non-browser environments
let memoryStorageMap: Record<string, string> = {};

const memoryStorageFallback: Storage = {
  getItem: (key: string) => (key in memoryStorageMap ? memoryStorageMap[key] : null),
  setItem: (key: string, value: string) => {
    memoryStorageMap[key] = String(value);
  },
  removeItem: (key: string) => {
    delete memoryStorageMap[key];
  },
  clear: () => {
    memoryStorageMap = {};
  },
  key: (index: number) => Object.keys(memoryStorageMap)[index] || null,
  get length() {
    return Object.keys(memoryStorageMap).length;
  },
};

class QuestionBankStore {
  private customQuestions: VerifiedQuestion[] = [];
  private settings: AssessmentSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadFromStorage();
  }

  private getStorage(): Storage {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
    return memoryStorageFallback;
  }

  private loadFromStorage() {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      const saved = storage.getItem(CUSTOM_BANK_STORAGE_KEY);
      if (saved) {
        this.customQuestions = JSON.parse(saved);
      }
      const savedSettings = storage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch {
      // ignore storage errors
    }
  }

  private persistCustomQuestions() {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(CUSTOM_BANK_STORAGE_KEY, JSON.stringify(this.customQuestions));
    } catch {
      // ignore storage errors
    }
  }

  public getAssessmentSettings(): AssessmentSettings {
    return { ...this.settings };
  }

  public saveAssessmentSettings(newSettings: Partial<AssessmentSettings>): AssessmentSettings {
    this.settings = { ...this.settings, ...newSettings };
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      } catch {}
    }
    return { ...this.settings };
  }

  public isCloudSynchronized(): boolean {
    return firebaseQuestionBankService.isCloudSynchronized();
  }

  public getCloudQuestionCount(): number {
    return firebaseQuestionBankService.getCloudQuestionCount();
  }

  public getLocalQuestionCount(): number {
    return firebaseQuestionBankService.getLocalQuestionCount();
  }

  /**
   * Returns all questions: Authoritative cloud Firestore questions take precedence,
   * with fallback to local master and custom question layers.
   */
  public getAllQuestions(): VerifiedQuestion[] {
    const cloudQuestions = firebaseQuestionBankService.getAllQuestions();
    if (cloudQuestions.length > 0) {
      return cloudQuestions;
    }

    // Fallback if cloud service is not yet populated
    const customMap = new Map<string, VerifiedQuestion>(
      this.customQuestions.map((q) => [q.id, q])
    );

    const merged: VerifiedQuestion[] = [];

    for (const baseQ of CLASS_10_CBSE_QUESTION_BANK) {
      if (customMap.has(baseQ.id)) {
        merged.push(customMap.get(baseQ.id)!);
        customMap.delete(baseQ.id);
      } else {
        merged.push(baseQ);
      }
    }

    for (const remainingQ of customMap.values()) {
      merged.push(remainingQ);
    }

    return merged;
  }

  /**
   * Returns strictly Approved questions available for live student assessments.
   * Excludes: Flagged for Correction, Under Correction, Draft, Pending, Rejected, Archived.
   */
  public getApprovedQuestions(
    classId?: StudentClass,
    board?: BoardType,
    chapterTitle?: string
  ): VerifiedQuestion[] {
    return this.getAllQuestions().filter((q) => {
      if (q.verificationStatus !== 'Approved') return false;
      if (classId && q.classId !== classId) return false;
      if (board && q.board !== board) return false;
      if (chapterTitle && q.chapterTitle !== chapterTitle) return false;
      return true;
    });
  }

  /**
   * Returns questions by verification status
   */
  public getQuestionsByStatus(status: VerificationStatus): VerifiedQuestion[] {
    return this.getAllQuestions().filter((q) => q.verificationStatus === status);
  }

  public getQuestionById(id: string): VerifiedQuestion | undefined {
    return this.getAllQuestions().find((q) => q.id === id);
  }

  /**
   * Checks if question already exists by normalized text comparison
   */
  public detectDuplicate(
    questionText: string,
    excludeId?: string
  ): { isDuplicate: boolean; matchedQuestion?: VerifiedQuestion } {
    const targetNorm = normalizeQuestionText(questionText);
    if (!targetNorm || targetNorm.length < 10) {
      return { isDuplicate: false };
    }

    const all = this.getAllQuestions();
    for (const q of all) {
      if (excludeId && q.id === excludeId) continue;
      const qNorm = normalizeQuestionText(q.questionText);
      if (qNorm === targetNorm) {
        return { isDuplicate: true, matchedQuestion: q };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Validates question schema and academic integrity rules
   */
  public validateQuestion(q: Partial<VerifiedQuestion>): QuestionValidationError[] {
    const errors: QuestionValidationError[] = [];

    if (!q.questionText || q.questionText.trim().length < 8) {
      errors.push({
        field: 'questionText',
        message: 'Question statement is required and must be at least 8 characters.',
        severity: 'error',
      });
    }

    if (!q.chapterTitle || q.chapterTitle.trim() === '') {
      errors.push({
        field: 'chapterTitle',
        message: 'Chapter title must be selected.',
        severity: 'error',
      });
    }

    if (!q.topic || q.topic.trim() === '') {
      errors.push({
        field: 'topic',
        message: 'Syllabus topic is required.',
        severity: 'error',
      });
    }

    if (!q.options || q.options.length !== 4) {
      errors.push({
        field: 'options',
        message: 'Exactly 4 MCQ options (A, B, C, D) are required.',
        severity: 'error',
      });
    } else {
      const labels = ['A', 'B', 'C', 'D'];
      const seenTexts = new Set<string>();

      q.options.forEach((opt, idx) => {
        if (!opt.text || opt.text.trim() === '') {
          errors.push({
            field: `option${labels[idx]}`,
            message: `Option ${labels[idx]} text cannot be empty.`,
            severity: 'error',
          });
        }
        const norm = opt.text.trim().toLowerCase();
        if (norm && seenTexts.has(norm)) {
          errors.push({
            field: `option${labels[idx]}`,
            message: `Option ${labels[idx]} duplicates another option value.`,
            severity: 'error',
          });
        }
        if (norm) seenTexts.add(norm);
      });
    }

    if (!q.correctOption || !['A', 'B', 'C', 'D'].includes(q.correctOption)) {
      errors.push({
        field: 'correctOption',
        message: 'A valid correct option (A, B, C, or D) must be designated.',
        severity: 'error',
      });
    }

    if (!q.explanation || q.explanation.trim().length < 15) {
      errors.push({
        field: 'explanation',
        message: 'Detailed mathematical step-by-step explanation is required (min 15 characters).',
        severity: 'error',
      });
    }

    if (!q.sourceReference || q.sourceReference.trim() === '') {
      errors.push({
        field: 'sourceReference',
        message: 'Official source reference or document citation is mandatory (e.g. NCERT, CBSE Board SQP).',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Adds a newly created question to the repository
   */
  public addQuestion(
    questionData: Omit<VerifiedQuestion, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus'>,
    status: VerificationStatus = 'Draft'
  ): { success: boolean; question?: VerifiedQuestion; errors?: QuestionValidationError[] } {
    const fullDraft: Partial<VerifiedQuestion> = {
      ...questionData,
      verificationStatus: status,
    };

    const validationErrors = this.validateQuestion(fullDraft);
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    const dupCheck = this.detectDuplicate(questionData.questionText);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        errors: [
          {
            field: 'questionText',
            message: `Duplicate detected: Matches existing question ID ${dupCheck.matchedQuestion?.id}.`,
            severity: 'error',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    const prefix = questionData.classId === '10' ? 'c10' : questionData.classId === '11-science' ? 'c11' : 'c12';
    const id = `${prefix}-custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newQuestion: VerifiedQuestion = {
      ...questionData,
      id,
      verificationStatus: status,
      createdAt: now,
      updatedAt: now,
    };

    this.customQuestions.unshift(newQuestion);
    this.persistCustomQuestions();

    return { success: true, question: newQuestion };
  }

  /**
   * Updates an existing question
   */
  public updateQuestion(
    id: string,
    updates: Partial<VerifiedQuestion>
  ): { success: boolean; question?: VerifiedQuestion; errors?: QuestionValidationError[] } {
    const existing = this.getQuestionById(id);
    if (!existing) {
      return {
        success: false,
        errors: [{ field: 'id', message: `Question ${id} not found.`, severity: 'error' }],
      };
    }

    const updated: VerifiedQuestion = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const validationErrors = this.validateQuestion(updated);
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    // Check duplicate if questionText changed
    if (updates.questionText && updates.questionText !== existing.questionText) {
      const dup = this.detectDuplicate(updates.questionText, id);
      if (dup.isDuplicate) {
        return {
          success: false,
          errors: [
            {
              field: 'questionText',
              message: `Duplicate detected: Matches existing question ${dup.matchedQuestion?.id}.`,
              severity: 'error',
            },
          ],
        };
      }
    }

    // Replace in custom array or add override
    const cIndex = this.customQuestions.findIndex((q) => q.id === id);
    if (cIndex >= 0) {
      this.customQuestions[cIndex] = updated;
    } else {
      this.customQuestions.push(updated);
    }

    this.persistCustomQuestions();
    return { success: true, question: updated };
  }

  /**
   * Moves question to Archived status
   */
  public archiveQuestion(id: string): { success: boolean; error?: string } {
    return this.updateQuestion(id, { verificationStatus: 'Archived' }).success
      ? { success: true }
      : { success: false, error: 'Failed to archive question' };
  }

  /**
   * Approves a question for live student assessment
   */
  public approveQuestion(id: string): { success: boolean; error?: string } {
    return this.updateQuestion(id, { verificationStatus: 'Approved' }).success
      ? { success: true }
      : { success: false, error: 'Failed to approve question' };
  }

  /**
   * Rejects a question with feedback
   */
  public rejectQuestion(id: string): { success: boolean; error?: string } {
    return this.updateQuestion(id, { verificationStatus: 'Rejected' }).success
      ? { success: true }
      : { success: false, error: 'Failed to reject question' };
  }

  /**
   * Bulk imports validated items as 'Draft' or 'Pending Verification'.
   * Never auto-publishes as 'Approved'.
   */
  public bulkImport(
    items: Array<Omit<VerifiedQuestion, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus'>>,
    targetStatus: 'Draft' | 'Pending Verification' = 'Pending Verification'
  ): { importedCount: number; errors: string[] } {
    let count = 0;
    const errors: string[] = [];

    const now = new Date().toISOString();

    items.forEach((item, idx) => {
      const errorsList = this.validateQuestion(item);
      if (errorsList.length > 0) {
        errors.push(`Row ${idx + 1}: ${errorsList.map((e) => e.message).join('; ')}`);
        return;
      }

      const dup = this.detectDuplicate(item.questionText);
      if (dup.isDuplicate) {
        errors.push(`Row ${idx + 1}: Duplicate of existing question (${dup.matchedQuestion?.id})`);
        return;
      }

      const id = `import-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-${idx + 1}`;
      const q: VerifiedQuestion = {
        ...item,
        id,
        verificationStatus: targetStatus,
        createdAt: now,
        updatedAt: now,
      };

      this.customQuestions.push(q);
      count++;
    });

    if (count > 0) {
      this.persistCustomQuestions();
    }

    return { importedCount: count, errors };
  }

  /**
   * Computes complete dashboard KPIs and analytics
   */
  public getStats(): FacultyDashboardStats {
    const all = this.getAllQuestions();

    const stats: FacultyDashboardStats = {
      totalQuestions: all.length,
      approvedQuestions: 0,
      draftQuestions: 0,
      pendingVerification: 0,
      rejectedQuestions: 0,
      archivedQuestions: 0,
      flaggedForCorrection: 0,
      underCorrection: 0,
      questionsByClass: {},
      questionsByChapter: {},
      questionsByDifficulty: {},
      questionsBySource: {},
    };

    all.forEach((q) => {
      // By status
      if (q.verificationStatus === 'Approved') stats.approvedQuestions++;
      else if (q.verificationStatus === 'Draft') stats.draftQuestions++;
      else if (q.verificationStatus === 'Pending Verification') stats.pendingVerification++;
      else if (q.verificationStatus === 'Rejected') stats.rejectedQuestions++;
      else if (q.verificationStatus === 'Archived') stats.archivedQuestions++;
      else if (q.verificationStatus === 'Flagged for Correction') stats.flaggedForCorrection!++;
      else if (q.verificationStatus === 'Under Correction') stats.underCorrection!++;

      // By class
      const cKey = q.classId === '10' ? 'Class 10' : q.classId === '11-science' ? 'Class 11 Science' : 'Class 12 Science';
      stats.questionsByClass[cKey] = (stats.questionsByClass[cKey] || 0) + 1;

      // By chapter
      stats.questionsByChapter[q.chapterTitle] = (stats.questionsByChapter[q.chapterTitle] || 0) + 1;

      // By difficulty
      stats.questionsByDifficulty[q.difficulty] = (stats.questionsByDifficulty[q.difficulty] || 0) + 1;

      // By source
      stats.questionsBySource[q.sourceType] = (stats.questionsBySource[q.sourceType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Parses CSV string into structured preview items with row-by-row validation
   */
  public parseCsv(csvText: string): CsvImportPreviewItem[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    // Parse CSV rows handling quoted values
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const header = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1);

    const previewItems: CsvImportPreviewItem[] = [];

    rows.forEach((line, rIdx) => {
      const cols = parseRow(line);
      const rowNum = rIdx + 2;

      // Map columns by expected header or index fallback
      const getVal = (colName: string, fallbackIdx: number): string => {
        const hIdx = header.indexOf(colName.toLowerCase());
        if (hIdx >= 0 && cols[hIdx] !== undefined) return cols[hIdx];
        if (cols[fallbackIdx] !== undefined) return cols[fallbackIdx];
        return '';
      };

      const rawRow: CsvImportRow = {
        rowNumber: rowNum,
        class: getVal('class', 0) || '10',
        board: getVal('board', 1) || 'CBSE',
        subject: getVal('subject', 2) || 'Mathematics',
        chapter: getVal('chapter', 3),
        topic: getVal('topic', 4),
        difficulty: getVal('difficulty', 5) || 'Moderate',
        question: getVal('question', 6),
        optionA: getVal('optiona', 7),
        optionB: getVal('optionb', 8),
        optionC: getVal('optionc', 9),
        optionD: getVal('optiond', 10),
        correctAnswer: getVal('correctanswer', 11).toUpperCase(),
        explanation: getVal('explanation', 12),
        marks: getVal('marks', 13) || '1',
        source: getVal('source', 14) || 'NCERT',
        sourceReference: getVal('sourcereference', 15),
      };

      const errors: QuestionValidationError[] = [];

      // Validate required raw fields
      if (!rawRow.question || rawRow.question.length < 8) {
        errors.push({
          rowNumber: rowNum,
          field: 'question',
          message: 'Question statement missing or too short (min 8 chars).',
          severity: 'error',
        });
      }

      if (!rawRow.chapter) {
        errors.push({
          rowNumber: rowNum,
          field: 'chapter',
          message: 'Chapter name is required.',
          severity: 'error',
        });
      }

      if (!rawRow.topic) {
        errors.push({
          rowNumber: rowNum,
          field: 'topic',
          message: 'Topic is required.',
          severity: 'error',
        });
      }

      const options = [
        { label: 'A' as const, text: rawRow.optionA },
        { label: 'B' as const, text: rawRow.optionB },
        { label: 'C' as const, text: rawRow.optionC },
        { label: 'D' as const, text: rawRow.optionD },
      ];

      options.forEach((opt) => {
        if (!opt.text || opt.text.trim() === '') {
          errors.push({
            rowNumber: rowNum,
            field: `option${opt.label}`,
            message: `Option ${opt.label} is blank.`,
            severity: 'error',
          });
        }
      });

      if (!['A', 'B', 'C', 'D'].includes(rawRow.correctAnswer)) {
        errors.push({
          rowNumber: rowNum,
          field: 'correctAnswer',
          message: `Correct answer "${rawRow.correctAnswer}" is invalid. Must be A, B, C, or D.`,
          severity: 'error',
        });
      }

      if (!rawRow.explanation || rawRow.explanation.length < 15) {
        errors.push({
          rowNumber: rowNum,
          field: 'explanation',
          message: 'Explanation is missing or too brief (min 15 chars).',
          severity: 'error',
        });
      }

      if (!rawRow.sourceReference) {
        errors.push({
          rowNumber: rowNum,
          field: 'sourceReference',
          message: 'Source reference citation is required (e.g. NCERT Ex 1.2 Q3).',
          severity: 'error',
        });
      }

      // Check duplicates
      const dup = this.detectDuplicate(rawRow.question);
      const isDuplicate = dup.isDuplicate;

      if (isDuplicate) {
        errors.push({
          rowNumber: rowNum,
          field: 'question',
          message: `Matches existing question (${dup.matchedQuestion?.id} - ${dup.matchedQuestion?.chapterTitle}).`,
          severity: 'error',
        });
      }

      // Also check duplicates within this batch
      const priorDup = previewItems.find(
        (p) => normalizeQuestionText(p.raw.question) === normalizeQuestionText(rawRow.question)
      );
      if (priorDup) {
        errors.push({
          rowNumber: rowNum,
          field: 'question',
          message: `Duplicate of Row ${priorDup.rowNumber} in the current import file.`,
          severity: 'error',
        });
      }

      // Construct parsed question if valid
      let parsedQuestion: VerifiedQuestion | undefined;
      const isValid = errors.length === 0;

      if (isValid) {
        const classId: StudentClass =
          rawRow.class === '11' || rawRow.class === '11-science'
            ? '11-science'
            : rawRow.class === '12' || rawRow.class === '12-science'
            ? '12-science'
            : '10';

        const board: BoardType = rawRow.board.toUpperCase().includes('GSEB') ? 'GSEB' : 'CBSE';

        const diffStr = rawRow.difficulty.toLowerCase();
        const difficulty =
          diffStr.includes('easy') || diffStr.includes('foundational')
            ? 'Foundational'
            : diffStr.includes('hard') || diffStr.includes('advanced')
            ? 'Advanced'
            : 'Moderate';

        const srcStr = rawRow.source.toUpperCase();
        const sourceType = srcStr.includes('CBSE')
          ? 'CBSE'
          : srcStr.includes('GSEB')
          ? 'GSEB'
          : srcStr.includes('TEACHER')
          ? 'Teacher Created'
          : 'NCERT';

        parsedQuestion = {
          id: `preview-${rowNum}`,
          classId,
          board,
          subject: 'Mathematics',
          chapterNumber: 1,
          chapterTitle: rawRow.chapter,
          topic: rawRow.topic,
          difficulty,
          questionText: rawRow.question,
          options,
          correctOption: rawRow.correctAnswer as 'A' | 'B' | 'C' | 'D',
          explanation: rawRow.explanation,
          marks: parseInt(rawRow.marks, 10) || 1,
          sourceType,
          sourceReference: rawRow.sourceReference,
          verificationStatus: 'Pending Verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      previewItems.push({
        rowNumber: rowNum,
        raw: rawRow,
        parsedQuestion,
        errors,
        isDuplicate,
        duplicateId: dup.matchedQuestion?.id,
        duplicateMatchText: dup.matchedQuestion?.questionText,
        isValid,
      });
    });

    return previewItems;
  }

  /**
   * Generates sample CSV template for faculty download
   */
  public generateSampleCsvTemplate(): string {
    const headers = [
      'class',
      'board',
      'subject',
      'chapter',
      'topic',
      'difficulty',
      'question',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctAnswer',
      'explanation',
      'marks',
      'source',
      'sourceReference',
    ].join(',');

    const sampleRows = [
      [
        '10',
        'CBSE',
        'Mathematics',
        'Real Numbers',
        'Fundamental Theorem of Arithmetic',
        'Foundational',
        '"What is the HCF of the smallest composite number and the smallest prime number?"',
        '"1"',
        '"2"',
        '"4"',
        '"6"',
        'B',
        '"Smallest prime number is 2. Smallest composite number is 4. HCF(2, 4) = 2. Prime factorisations are 2 = 2¹ and 4 = 2²."',
        '1',
        'NCERT',
        '"NCERT Class 10 Exemplar Ch 1 / CBSE Board 2018"',
      ].join(','),
      [
        '10',
        'CBSE',
        'Mathematics',
        'Polynomials',
        'Zeroes and Coefficients',
        'Moderate',
        '"If one zero of the quadratic polynomial 2x² - 3x + k is 1/2, then the numerical value of k is:"',
        '"1"',
        '"-1"',
        '"2"',
        '"-2"',
        'A',
        '"Since 1/2 is a root of p(x) = 2x² - 3x + k, p(1/2) = 0. Therefore 2(1/2)² - 3(1/2) + k = 0 => 2(1/4) - 3/2 + k = 0 => 1/2 - 3/2 + k = 0 => -1 + k = 0 => k = 1."',
        '1',
        'CBSE',
        '"CBSE Official Class 10 Model Question Paper 2024"',
      ].join(','),
      [
        '10',
        'CBSE',
        'Mathematics',
        'Arithmetic Progressions',
        'General Term of an AP',
        'Moderate',
        '"The 11th term of the AP -3, -1/2, 2, ... is:"',
        '"28"',
        '"22"',
        '"-38"',
        '"-46.5"',
        'B',
        '"First term a = -3. Common difference d = -1/2 - (-3) = 5/2. 11th term a11 = a + 10d = -3 + 10(5/2) = -3 + 25 = 22."',
        '1',
        'NCERT',
        '"NCERT Class 10 Mathematics Chapter 5, Exercise 5.2 Q2"',
      ].join(','),
    ];

    return `${headers}\n${sampleRows.join('\n')}`;
  }
}

export const questionBankStore = new QuestionBankStore();
