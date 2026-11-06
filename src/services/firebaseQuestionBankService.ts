import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { firebaseAuthService } from './firebaseAuthService';
import {
  VerifiedQuestion,
  VerificationStatus,
  QuestionCorrection,
  QuestionVersion,
  AuditLog,
  SystemBackup,
  SyncStatus,
  MigrationProgress,
  StudentClass,
  BoardType,
} from '../types/assessment';
import { CLASS_10_CBSE_QUESTION_BANK } from '../data/class10CbseQuestionBank';

type QuestionListener = (questions: VerifiedQuestion[]) => void;
type CorrectionListener = (corrections: QuestionCorrection[]) => void;
type SyncStatusListener = (status: SyncStatus) => void;

class FirebaseQuestionBankService {
  private cloudQuestionsCache: Map<string, VerifiedQuestion> = new Map();
  private localFallbackCache: Map<string, VerifiedQuestion> = new Map();
  private correctionsCache: Map<string, QuestionCorrection> = new Map();
  private syncStatus: SyncStatus = 'idle';

  private questionListeners: QuestionListener[] = [];
  private correctionListeners: CorrectionListener[] = [];
  private syncStatusListeners: SyncStatusListener[] = [];

  private isInitialized = false;
  private unsubscribeQuestions: (() => void) | null = null;
  private unsubscribeCorrections: (() => void) | null = null;

  constructor() {
    // Populate local fallback cache from verified static bank
    CLASS_10_CBSE_QUESTION_BANK.forEach((q) => {
      this.localFallbackCache.set(q.id, { ...q, version: 1 });
    });
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, stepName: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${stepName} exceeded ${ms / 1000}s limit.`)), ms)
      ),
    ]);
  }

  public initRealtimeSync(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.setSyncStatus('syncing');

    // 1. Listen to questions collection
    try {
      const questionsCol = collection(db, 'questions');
      this.unsubscribeQuestions = onSnapshot(
        questionsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            snapshot.docChanges().forEach((change) => {
              const qData = change.doc.data() as VerifiedQuestion;
              if (change.type === 'removed') {
                this.cloudQuestionsCache.delete(change.doc.id);
              } else {
                this.cloudQuestionsCache.set(change.doc.id, qData);
              }
            });
            this.setSyncStatus('saved');
          } else {
            // Cloud collection is currently empty
            this.cloudQuestionsCache.clear();
            this.setSyncStatus('empty_cloud');
          }
          this.notifyQuestionListeners();
        },
        (error) => {
          console.warn('Real-time question sync warning (falling back to local cache):', error.message);
          if (this.cloudQuestionsCache.size === 0) {
            this.setSyncStatus('empty_cloud');
          } else {
            this.setSyncStatus('offline');
          }
        }
      );
    } catch (err) {
      console.warn('Failed setting up question listener:', err);
      this.setSyncStatus('offline');
    }

    // 2. Listen to question_corrections collection
    try {
      const correctionsCol = collection(db, 'question_corrections');
      this.unsubscribeCorrections = onSnapshot(
        correctionsCol,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const cData = change.doc.data() as QuestionCorrection;
            if (change.type === 'removed') {
              this.correctionsCache.delete(change.doc.id);
            } else {
              this.correctionsCache.set(change.doc.id, cData);
            }
          });
          this.notifyCorrectionListeners();
        },
        (error) => {
          console.warn('Corrections sync notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('Failed setting up corrections listener:', err);
    }
  }

  private setSyncStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.syncStatusListeners.forEach((l) => l(status));
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  public getCloudQuestionCount(): number {
    return this.cloudQuestionsCache.size;
  }

  public getLocalQuestionCount(): number {
    return this.localFallbackCache.size;
  }

  public isCloudSynchronized(): boolean {
    return this.cloudQuestionsCache.size > 0;
  }

  public subscribeSyncStatus(listener: SyncStatusListener): () => void {
    this.syncStatusListeners.push(listener);
    listener(this.syncStatus);
    return () => {
      this.syncStatusListeners = this.syncStatusListeners.filter((l) => l !== listener);
    };
  }

  public subscribeQuestions(listener: QuestionListener): () => void {
    this.questionListeners.push(listener);
    listener(this.getAllQuestions());
    return () => {
      this.questionListeners = this.questionListeners.filter((l) => l !== listener);
    };
  }

  public subscribeCorrections(listener: CorrectionListener): () => void {
    this.correctionListeners.push(listener);
    listener(Array.from(this.correctionsCache.values()));
    return () => {
      this.correctionListeners = this.correctionListeners.filter((l) => l !== listener);
    };
  }

  private notifyQuestionListeners() {
    const list = this.getAllQuestions();
    this.questionListeners.forEach((l) => l(list));
  }

  private notifyCorrectionListeners() {
    const list = Array.from(this.correctionsCache.values());
    this.correctionListeners.forEach((l) => l(list));
  }

  public getAllQuestions(): VerifiedQuestion[] {
    if (this.cloudQuestionsCache.size > 0) {
      return Array.from(this.cloudQuestionsCache.values());
    }
    return Array.from(this.localFallbackCache.values());
  }

  /**
   * Returns exclusively Approved questions for live student assessments.
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

  public getQuestionById(id: string): VerifiedQuestion | undefined {
    return this.cloudQuestionsCache.get(id) || this.localFallbackCache.get(id);
  }

  /**
   * Safe One-Time Migration:
   * Migrates all 100 existing Class 10 CBSE questions into Firestore without modifying IDs.
   * Strictly enforces administrator authentication, verifies initial read, provides batch-level
   * progress, timeout boundaries, and preserves existing records.
   */
  public async migrateInitialBank(
    performedBy: string,
    performedByUid?: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<{
    migratedCount: number;
    skippedCount: number;
    totalInCloud: number;
  }> {
    // 1. Strict Authentication & Role Pre-flight Enforcement
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error(
        'Authentication required: You must be signed in as Administrator (nikhilprasad9797@gmail.com) before initiating cloud migration.'
      );
    }

    const isAdminUser =
      (currentUser.email &&
        ['nikhilprasad9797@gmail.com', 'admin@vallabhclasses.com'].includes(
          currentUser.email.toLowerCase()
        )) ||
      firebaseAuthService.isAdmin();

    if (!isAdminUser) {
      throw new Error(
        `Permission denied: Signed-in account (${currentUser.email || 'unknown'}) is not recognized as Administrator. Initial cloud migration is restricted to nikhilprasad9797@gmail.com.`
      );
    }

    this.setSyncStatus('saving');
    onProgress?.({
      stage: 'checking',
      currentBatch: 0,
      totalBatches: 0,
      migratedCount: 0,
      skippedCount: 0,
      message: 'Scanning existing documents in Cloud Firestore questions collection...',
    });

    let existingIds = new Set<string>();

    // 2. Verified Initial Read with Timeout (Stop immediately if read fails)
    try {
      const questionsCol = collection(db, 'questions');
      const existingSnap = await this.withTimeout(
        getDocs(questionsCol),
        12000,
        'Initial Firestore questions read'
      );
      existingIds = new Set(existingSnap.docs.map((d) => d.id));
    } catch (readErr: any) {
      this.setSyncStatus(this.cloudQuestionsCache.size > 0 ? 'saved' : 'empty_cloud');
      const errMsg = readErr?.message || 'Unknown read error';
      onProgress?.({
        stage: 'error',
        currentBatch: 0,
        totalBatches: 0,
        migratedCount: 0,
        skippedCount: 0,
        message: `Initial read verification failed: ${errMsg}`,
      });
      throw new Error(`Migration stopped: Failed to verify existing Firestore questions. ${errMsg}`);
    }

    // 3. Filter questions to write (Preserves existing questions, safe to retry)
    const totalMasterQuestions = CLASS_10_CBSE_QUESTION_BANK;
    const questionsToWrite = totalMasterQuestions.filter((q) => !existingIds.has(q.id));
    const skippedCount = totalMasterQuestions.length - questionsToWrite.length;

    if (questionsToWrite.length === 0) {
      this.setSyncStatus('saved');
      onProgress?.({
        stage: 'completed',
        currentBatch: 0,
        totalBatches: 0,
        migratedCount: 0,
        skippedCount,
        message: `All ${totalMasterQuestions.length} master questions already exist in Cloud Firestore. No new documents needed.`,
      });
      return {
        migratedCount: 0,
        skippedCount,
        totalInCloud: existingIds.size,
      };
    }

    // 4. Batch Writes with Progress
    const batchSize = 25; // Clean 4 batches for 100 questions
    const totalBatches = Math.ceil(questionsToWrite.length / batchSize);
    let migratedCount = 0;

    try {
      for (let i = 0; i < questionsToWrite.length; i += batchSize) {
        const currentBatchIndex = Math.floor(i / batchSize) + 1;
        const chunk = questionsToWrite.slice(i, i + batchSize);

        onProgress?.({
          stage: 'writing',
          currentBatch: currentBatchIndex,
          totalBatches,
          migratedCount,
          skippedCount,
          message: `Writing batch ${currentBatchIndex} of ${totalBatches} (${chunk.length} questions)...`,
        });

        const batch = writeBatch(db);

        for (const q of chunk) {
          const qDocRef = doc(db, 'questions', q.id);
          const fullQuestion: VerifiedQuestion = {
            ...q,
            version: 1,
            createdBy: 'Hemang Shah Sir (Master Curation)',
            updatedBy: performedBy,
            verificationStatus: 'Approved',
            createdAt: q.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          batch.set(qDocRef, fullQuestion);
        }

        await this.withTimeout(
          batch.commit(),
          15000,
          `Batch ${currentBatchIndex}/${totalBatches}`
        );

        chunk.forEach((q) => {
          const record: VerifiedQuestion = {
            ...q,
            version: 1,
            createdBy: 'Hemang Shah Sir (Master Curation)',
            updatedBy: performedBy,
            verificationStatus: 'Approved',
            createdAt: q.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.cloudQuestionsCache.set(q.id, record);
          this.localFallbackCache.set(q.id, record);
        });

        migratedCount += chunk.length;
      }

      // 5. Secondary Non-Blocking Audit & Backup Steps
      onProgress?.({
        stage: 'logging',
        currentBatch: totalBatches,
        totalBatches,
        migratedCount,
        skippedCount,
        message: 'Recording migration audit log...',
      });

      try {
        await this.withTimeout(
          this.logAuditAction({
            action: 'INITIAL_MIGRATION',
            targetType: 'question',
            targetId: 'batch_class_10_cbse',
            details: `Migrated ${migratedCount} questions into Firestore. ${skippedCount} existing were preserved. Performed by: ${performedBy}`,
            performedBy,
            performedByUid: currentUser.uid,
          }),
          8000,
          'Audit logging'
        );
      } catch (auditErr) {
        console.warn('Audit logging note (non-fatal):', auditErr);
      }

      onProgress?.({
        stage: 'backup',
        currentBatch: totalBatches,
        totalBatches,
        migratedCount,
        skippedCount,
        message: 'Creating post-migration backup snapshot...',
      });

      try {
        await this.withTimeout(
          this.createBackup('automated', performedBy, 'Automatic Post-Migration Snapshot'),
          10000,
          'Post-migration snapshot backup'
        );
      } catch (backupErr) {
        console.warn('Post-migration backup notice (non-fatal):', backupErr);
      }

      this.setSyncStatus('saved');
      this.notifyQuestionListeners();

      onProgress?.({
        stage: 'completed',
        currentBatch: totalBatches,
        totalBatches,
        migratedCount,
        skippedCount,
        message: `Successfully migrated ${migratedCount} questions to Cloud Firestore. ${skippedCount} existing were preserved. Total in cloud: ${existingIds.size + migratedCount}.`,
      });

      return {
        migratedCount,
        skippedCount,
        totalInCloud: existingIds.size + migratedCount,
      };
    } catch (writeErr: any) {
      this.setSyncStatus(this.cloudQuestionsCache.size > 0 ? 'saved' : 'empty_cloud');
      const errorMsg = writeErr?.message || 'Batch commit error';
      onProgress?.({
        stage: 'error',
        currentBatch: 0,
        totalBatches,
        migratedCount,
        skippedCount,
        message: `Migration failed during batch commit: ${errorMsg}`,
      });
      throw new Error(`Migration failed: ${errorMsg}`);
    }
  }

  /**
   * PART 3: Question Correction & Issue Reporting
   * 1. Creates question_corrections document.
   * 2. Changes question status to "Flagged for Correction".
   * 3. Immediately excludes from future student assessment generation.
   * 4. Preserves the original question snapshot in question_versions.
   * 5. Generates an audit-log entry.
   */
  public async reportQuestionIssue(params: {
    questionId: string;
    issueCategory: QuestionCorrection['issueCategory'];
    description: string;
    suggestedCorrection?: string;
    priority: QuestionCorrection['priority'];
    reportedBy: string;
    reportedByEmail?: string;
    reportedByUid?: string;
  }): Promise<QuestionCorrection> {
    this.setSyncStatus('saving');
    const question = this.getQuestionById(params.questionId);
    if (!question) {
      throw new Error(`Question ${params.questionId} not found.`);
    }

    const now = new Date().toISOString();
    const correctionId = `corr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const correctionDoc: QuestionCorrection = {
      id: correctionId,
      questionId: params.questionId,
      chapterTitle: question.chapterTitle,
      topic: question.topic,
      issueCategory: params.issueCategory,
      description: params.description,
      suggestedCorrection: params.suggestedCorrection || '',
      priority: params.priority,
      reportedBy: params.reportedBy,
      reportedByEmail: params.reportedByEmail || '',
      reportedByUid: params.reportedByUid || '',
      status: 'Flagged for Correction',
      createdAt: now,
      updatedAt: now,
      originalQuestionSnapshot: { ...question },
    };

    try {
      // 1. Create correction doc
      await setDoc(doc(db, 'question_corrections', correctionId), correctionDoc);

      // 2. Save snapshot in question_versions
      const versionNumber = question.version || 1;
      const versionId = `ver-${params.questionId}-v${versionNumber}-${Date.now().toString(36)}`;
      const versionDoc: QuestionVersion = {
        id: versionId,
        questionId: params.questionId,
        version: versionNumber,
        questionSnapshot: { ...question },
        modifiedBy: params.reportedBy,
        modifiedByUid: params.reportedByUid,
        reason: `Flagged for correction: [${params.issueCategory}] ${params.description.slice(0, 100)}`,
        timestamp: now,
      };
      await setDoc(doc(db, 'question_versions', versionId), versionDoc);

      // 3. Update question status to Flagged for Correction
      const updatedQuestion: VerifiedQuestion = {
        ...question,
        verificationStatus: 'Flagged for Correction',
        updatedAt: now,
        updatedBy: params.reportedBy,
      };
      await updateDoc(doc(db, 'questions', params.questionId), {
        verificationStatus: 'Flagged for Correction',
        updatedAt: now,
        updatedBy: params.reportedBy,
      });

      // Update memory cache immediately
      this.cloudQuestionsCache.set(params.questionId, updatedQuestion);
      this.localFallbackCache.set(params.questionId, updatedQuestion);
      this.correctionsCache.set(correctionId, correctionDoc);
      this.notifyQuestionListeners();
      this.notifyCorrectionListeners();

      // 4. Log audit entry
      await this.logAuditAction({
        action: 'FLAG_FOR_CORRECTION',
        targetType: 'correction',
        targetId: correctionId,
        details: `Question ${params.questionId} flagged by ${params.reportedBy}. Category: ${params.issueCategory}. Status set to Flagged for Correction.`,
        performedBy: params.reportedBy,
        performedByUid: params.reportedByUid,
      });

      this.setSyncStatus('saved');
      return correctionDoc;
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, `questions/${params.questionId}/report`);
    }
  }

  /**
   * PART 4: Save revisions to a question under correction and advance status.
   */
  public async saveQuestionCorrectionRevision(params: {
    questionId: string;
    correctionId: string;
    revisedQuestion: Partial<VerifiedQuestion>;
    targetStatus: 'Under Correction' | 'Pending Verification' | 'Approved';
    resolutionNotes?: string;
    performedBy: string;
    performedByUid?: string;
  }): Promise<VerifiedQuestion> {
    this.setSyncStatus('saving');
    const existing = this.getQuestionById(params.questionId);
    if (!existing) {
      throw new Error(`Question ${params.questionId} not found.`);
    }

    const now = new Date().toISOString();
    const newVersionNumber = (existing.version || 1) + 1;

    // 1. Snapshot previous state before applying revision
    const versionId = `ver-${params.questionId}-v${existing.version || 1}-${Date.now().toString(36)}`;
    const versionRecord: QuestionVersion = {
      id: versionId,
      questionId: params.questionId,
      version: existing.version || 1,
      questionSnapshot: { ...existing },
      modifiedBy: params.performedBy,
      modifiedByUid: params.performedByUid,
      reason: params.resolutionNotes || `Revision applied by ${params.performedBy}`,
      timestamp: now,
    };

    const updatedQuestion: VerifiedQuestion = {
      ...existing,
      ...params.revisedQuestion,
      version: newVersionNumber,
      verificationStatus: params.targetStatus,
      updatedAt: now,
      updatedBy: params.performedBy,
    };

    try {
      await setDoc(doc(db, 'question_versions', versionId), versionRecord);
      await setDoc(doc(db, 'questions', params.questionId), updatedQuestion);

      // Update correction doc if status reached Approved
      if (params.targetStatus === 'Approved') {
        await updateDoc(doc(db, 'question_corrections', params.correctionId), {
          status: 'Resolved',
          resolvedBy: params.performedBy,
          resolutionNotes: params.resolutionNotes || 'Correction approved and released to live assessment bank.',
          updatedAt: now,
        });
        const c = this.correctionsCache.get(params.correctionId);
        if (c) {
          c.status = 'Resolved';
          c.resolvedBy = params.performedBy;
          c.resolutionNotes = params.resolutionNotes;
          c.updatedAt = now;
        }
      } else {
        await updateDoc(doc(db, 'question_corrections', params.correctionId), {
          status: params.targetStatus,
          updatedAt: now,
        });
      }

      this.cloudQuestionsCache.set(params.questionId, updatedQuestion);
      this.localFallbackCache.set(params.questionId, updatedQuestion);
      this.notifyQuestionListeners();
      this.notifyCorrectionListeners();

      await this.logAuditAction({
        action: 'CORRECTION_UPDATED',
        targetType: 'question',
        targetId: params.questionId,
        details: `Question updated to version v${newVersionNumber} with status '${params.targetStatus}'. By: ${params.performedBy}`,
        performedBy: params.performedBy,
        performedByUid: params.performedByUid,
      });

      this.setSyncStatus('saved');
      return updatedQuestion;
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, `questions/${params.questionId}/correction`);
    }
  }

  /**
   * Approves a question for live student assessment
   */
  public async approveQuestion(
    questionId: string,
    performedBy: string,
    performedByUid?: string
  ): Promise<void> {
    this.setSyncStatus('saving');
    const q = this.getQuestionById(questionId);
    if (!q) throw new Error('Question not found');

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        verificationStatus: 'Approved',
        updatedAt: now,
        updatedBy: performedBy,
      });

      q.verificationStatus = 'Approved';
      q.updatedAt = now;
      q.updatedBy = performedBy;
      this.notifyQuestionListeners();

      await this.logAuditAction({
        action: 'QUESTION_APPROVED',
        targetType: 'question',
        targetId: questionId,
        details: `Question ${questionId} approved for live student testing by ${performedBy}.`,
        performedBy,
        performedByUid,
      });

      this.setSyncStatus('saved');
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.UPDATE, `questions/${questionId}`);
    }
  }

  /**
   * Rejects a question
   */
  public async rejectQuestion(
    questionId: string,
    performedBy: string,
    performedByUid?: string
  ): Promise<void> {
    this.setSyncStatus('saving');
    const q = this.getQuestionById(questionId);
    if (!q) throw new Error('Question not found');

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        verificationStatus: 'Rejected',
        updatedAt: now,
        updatedBy: performedBy,
      });

      q.verificationStatus = 'Rejected';
      q.updatedAt = now;
      q.updatedBy = performedBy;
      this.notifyQuestionListeners();

      await this.logAuditAction({
        action: 'QUESTION_REJECTED',
        targetType: 'question',
        targetId: questionId,
        details: `Question ${questionId} rejected by ${performedBy}.`,
        performedBy,
        performedByUid,
      });

      this.setSyncStatus('saved');
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.UPDATE, `questions/${questionId}`);
    }
  }

  /**
   * Archives a question
   */
  public async archiveQuestion(
    questionId: string,
    performedBy: string,
    performedByUid?: string
  ): Promise<void> {
    this.setSyncStatus('saving');
    const q = this.getQuestionById(questionId);
    if (!q) throw new Error('Question not found');

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        verificationStatus: 'Archived',
        updatedAt: now,
        updatedBy: performedBy,
      });

      q.verificationStatus = 'Archived';
      q.updatedAt = now;
      q.updatedBy = performedBy;
      this.notifyQuestionListeners();

      await this.logAuditAction({
        action: 'QUESTION_ARCHIVED',
        targetType: 'question',
        targetId: questionId,
        details: `Question ${questionId} archived by ${performedBy}. Removed from active testing pool.`,
        performedBy,
        performedByUid,
      });

      this.setSyncStatus('saved');
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.UPDATE, `questions/${questionId}`);
    }
  }

  /**
   * PART 6: Fetch question version history
   */
  public async getQuestionVersions(questionId: string): Promise<QuestionVersion[]> {
    try {
      const versionsCol = collection(db, 'question_versions');
      const snap = await getDocs(versionsCol);
      return snap.docs
        .map((d) => d.data() as QuestionVersion)
        .filter((v) => v.questionId === questionId)
        .sort((a, b) => b.version - a.version);
    } catch (error) {
      console.warn('Error fetching versions:', error);
      return [];
    }
  }

  /**
   * PART 6: Restore previous version (creates new version, never deletes past versions)
   */
  public async restoreQuestionVersion(
    questionId: string,
    historicalVersion: QuestionVersion,
    reason: string,
    performedBy: string,
    performedByUid?: string
  ): Promise<VerifiedQuestion> {
    this.setSyncStatus('saving');
    const current = this.getQuestionById(questionId);
    if (!current) throw new Error('Question not found');

    const now = new Date().toISOString();
    const newVersionNumber = (current.version || 1) + 1;

    // 1. Save current state before restoring
    const backupVersionId = `ver-${questionId}-v${current.version || 1}-${Date.now().toString(36)}`;
    await setDoc(doc(db, 'question_versions', backupVersionId), {
      id: backupVersionId,
      questionId,
      version: current.version || 1,
      questionSnapshot: { ...current },
      modifiedBy: performedBy,
      modifiedByUid: performedByUid,
      reason: `Pre-restoration snapshot before restoring version v${historicalVersion.version}`,
      timestamp: now,
    });

    // 2. Apply historical content with incremented version number
    const restored: VerifiedQuestion = {
      ...historicalVersion.questionSnapshot,
      id: questionId,
      version: newVersionNumber,
      updatedAt: now,
      updatedBy: performedBy,
    };

    await setDoc(doc(db, 'questions', questionId), restored);
    this.cloudQuestionsCache.set(questionId, restored);
    this.localFallbackCache.set(questionId, restored);
    this.notifyQuestionListeners();

    await this.logAuditAction({
      action: 'VERSION_RESTORED',
      targetType: 'question',
      targetId: questionId,
      details: `Question ${questionId} restored from historical version v${historicalVersion.version} to new version v${newVersionNumber}. Reason: ${reason}`,
      performedBy,
      performedByUid,
    });

    this.setSyncStatus('saved');
    return restored;
  }

  /**
   * PART 7 & 8: Backups & Recovery
   */
  public async createBackup(
    backupType: SystemBackup['backupType'],
    createdBy: string,
    notes?: string
  ): Promise<SystemBackup> {
    this.setSyncStatus('saving');
    const now = new Date().toISOString();
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const questionsList = this.getAllQuestions();
    const correctionsList = Array.from(this.correctionsCache.values());

    const backupPayload = JSON.stringify({
      version: '1.0',
      exportedAt: now,
      createdBy,
      questions: questionsList,
      corrections: correctionsList,
    });

    const backupRecord: SystemBackup = {
      id: backupId,
      backupType,
      questionCount: questionsList.length,
      correctionsCount: correctionsList.length,
      createdBy,
      timestamp: now,
      dataPayload: backupPayload,
      status: 'completed',
      notes,
    };

    try {
      await setDoc(doc(db, 'system_backups', backupId), backupRecord);

      await this.logAuditAction({
        action: 'BACKUP_CREATED',
        targetType: 'backup',
        targetId: backupId,
        details: `${backupType.toUpperCase()} backup created with ${questionsList.length} questions and ${correctionsList.length} corrections by ${createdBy}.`,
        performedBy: createdBy,
      });

      this.setSyncStatus('saved');
      return backupRecord;
    } catch (error) {
      this.setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, `system_backups/${backupId}`);
    }
  }

  public async getBackupsList(): Promise<SystemBackup[]> {
    try {
      const backupsCol = collection(db, 'system_backups');
      const snap = await getDocs(backupsCol);
      return snap.docs
        .map((d) => d.data() as SystemBackup)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.warn('Error fetching backups list:', err);
      return [];
    }
  }

  public async restoreFromBackup(
    backupId: string,
    performedBy: string,
    performedByUid?: string
  ): Promise<{ restoredQuestionsCount: number }> {
    this.setSyncStatus('saving');
    const backupDocRef = doc(db, 'system_backups', backupId);
    const snap = await getDoc(backupDocRef);
    if (!snap.exists()) {
      throw new Error(`Backup ${backupId} not found.`);
    }

    const backupData = snap.data() as SystemBackup;
    const parsed = JSON.parse(backupData.dataPayload);
    const questionsToRestore: VerifiedQuestion[] = parsed.questions || [];

    // Safety: Create pre-restore safety snapshot of current state
    await this.createBackup(
      'pre_restore',
      performedBy,
      `Safety backup created automatically before restoring backup ${backupId}`
    );

    // Batch write questions
    const batchSize = 40;
    for (let i = 0; i < questionsToRestore.length; i += batchSize) {
      const chunk = questionsToRestore.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const q of chunk) {
        batch.set(doc(db, 'questions', q.id), q);
      }
      await batch.commit();
    }

    questionsToRestore.forEach((q) => {
      this.cloudQuestionsCache.set(q.id, q);
      this.localFallbackCache.set(q.id, q);
    });
    this.notifyQuestionListeners();

    await this.logAuditAction({
      action: 'DATABASE_RESTORED',
      targetType: 'backup',
      targetId: backupId,
      details: `Database restored from backup ${backupId} (${questionsToRestore.length} questions) by ${performedBy}.`,
      performedBy,
      performedByUid,
    });

    this.setSyncStatus('saved');
    return { restoredQuestionsCount: questionsToRestore.length };
  }

  public async logAuditAction(params: {
    action: string;
    targetType: AuditLog['targetType'];
    targetId: string;
    details: string;
    performedBy: string;
    performedByUid?: string;
  }): Promise<void> {
    try {
      const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const logRecord: AuditLog = {
        id: logId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details,
        performedBy: params.performedBy,
        performedByUid: params.performedByUid,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'audit_logs', logId), logRecord);
    } catch (err) {
      console.warn('Audit logging note:', err);
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const col = collection(db, 'audit_logs');
      const q = query(col, limit(100));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => d.data() as AuditLog)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Export Full Question Bank as JSON
   */
  public exportToJson(): string {
    const questions = this.getAllQuestions();
    return JSON.stringify(questions, null, 2);
  }

  /**
   * Export Full Question Bank as CSV
   */
  public exportToCsv(): string {
    const questions = this.getAllQuestions();
    const headers = [
      'ID',
      'Class',
      'Board',
      'Chapter Number',
      'Chapter Title',
      'Topic',
      'Difficulty',
      'Question Text',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Option',
      'Explanation',
      'Hemang Sir Tip',
      'Marks',
      'Source Type',
      'Source Reference',
      'Status',
      'Version',
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = questions.map((q) => {
      const optA = q.options.find((o) => o.label === 'A')?.text || '';
      const optB = q.options.find((o) => o.label === 'B')?.text || '';
      const optC = q.options.find((o) => o.label === 'C')?.text || '';
      const optD = q.options.find((o) => o.label === 'D')?.text || '';

      return [
        escapeCsv(q.id),
        escapeCsv(q.classId),
        escapeCsv(q.board),
        escapeCsv(q.chapterNumber),
        escapeCsv(q.chapterTitle),
        escapeCsv(q.topic),
        escapeCsv(q.difficulty),
        escapeCsv(q.questionText),
        escapeCsv(optA),
        escapeCsv(optB),
        escapeCsv(optC),
        escapeCsv(optD),
        escapeCsv(q.correctOption),
        escapeCsv(q.explanation),
        escapeCsv(q.hemangSirTip || ''),
        escapeCsv(q.marks),
        escapeCsv(q.sourceType),
        escapeCsv(q.sourceReference),
        escapeCsv(q.verificationStatus),
        escapeCsv(q.version || 1),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const firebaseQuestionBankService = new FirebaseQuestionBankService();
