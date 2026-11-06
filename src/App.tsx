import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { HowItWorks } from './components/HowItWorks';
import { MentorSection } from './components/MentorSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { StudentFormModal } from './components/StudentFormModal';
import { ChapterSelectionView } from './components/ChapterSelectionView';
import { SampleQuestionPreviewModal } from './components/SampleQuestionPreviewModal';
import { AssessmentEngineView } from './components/AssessmentEngineView';
import { PerformanceReportView } from './components/PerformanceReportView';
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import {
  StudentProfile,
  AssessmentSession,
  TestEvaluationResult,
} from './types/assessment';
import { doc, setDoc } from 'firebase/firestore';
import { generateAssessmentSession } from './services/assessmentGenerator';
import { evaluateAssessmentSession } from './services/evaluationService';
import { db, testFirestoreConnection } from './services/firebase';
import { firebaseQuestionBankService } from './services/firebaseQuestionBankService';

const STORAGE_KEY = 'vallabh_classes_student_profile';
const LAST_RESULT_KEY = 'vallabh_classes_last_result';
const ACTIVE_SESSION_KEY = 'vallabh_classes_active_session';
const SESSION_START_TIME_KEY = 'vallabh_classes_session_start_epoch';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'chapters' | 'assessment' | 'report' | 'faculty'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/faculty-portal' || hash === '#faculty-portal') {
        return 'faculty';
      }
    }
    return 'home';
  });
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<TestEvaluationResult | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSampleQuestionsOpen, setIsSampleQuestionsOpen] = useState(false);

  // Initialize and restore saved state (student profile, active test, and previous report)
  useEffect(() => {
    // Test Firestore connection on boot and initialize real-time sync
    testFirestoreConnection();
    firebaseQuestionBankService.initRealtimeSync();

    try {
      // 1. Restore Student Profile
      const savedProfile = localStorage.getItem(STORAGE_KEY);
      let parsedStudent: StudentProfile | null = null;
      if (savedProfile) {
        parsedStudent = JSON.parse(savedProfile);
        if (parsedStudent && parsedStudent.name) {
          setStudent(parsedStudent);
        }
      }

      // 2. Restore Last Evaluation Result
      const savedResult = localStorage.getItem(LAST_RESULT_KEY);
      if (savedResult) {
        const parsedRes = JSON.parse(savedResult);
        if (parsedRes && parsedRes.resultId) {
          setEvaluationResult(parsedRes);
        }
      }

      // 3. Restore Active Assessment Session (Browser refresh protection)
      const savedSessionRaw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
      const startEpochRaw = sessionStorage.getItem(SESSION_START_TIME_KEY);

      if (savedSessionRaw && startEpochRaw) {
        const parsedSession: AssessmentSession = JSON.parse(savedSessionRaw);
        const startEpoch = parseInt(startEpochRaw, 10);
        const elapsedSeconds = Math.floor((Date.now() - startEpoch) / 1000);
        const remainingSeconds = parsedSession.timeAllowedSeconds - elapsedSeconds;

        // Try reading latest saved answers
        const savedAnswersRaw = sessionStorage.getItem(`vc_answers_${parsedSession.sessionId}`);
        const restoredAnswers = savedAnswersRaw ? JSON.parse(savedAnswersRaw) : parsedSession.userAnswers;

        if (remainingSeconds > 0) {
          // Resume in-progress assessment seamlessly
          parsedSession.timeRemainingSeconds = remainingSeconds;
          parsedSession.userAnswers = restoredAnswers;
          setActiveSession(parsedSession);
          setCurrentView('assessment');
        } else {
          // Time expired while browser was refreshed/closed: auto-submit saved answers
          const evaluated = evaluateAssessmentSession(
            parsedSession,
            restoredAnswers,
            parsedSession.timeAllowedSeconds
          );
          setEvaluationResult(evaluated);
          localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(evaluated));
          sessionStorage.removeItem(ACTIVE_SESSION_KEY);
          sessionStorage.removeItem(SESSION_START_TIME_KEY);
          setCurrentView('report');
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSaveStudent = (profile: StudentProfile) => {
    setStudent(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    setIsFormOpen(false);
    setCurrentView('chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartAssessmentClick = () => {
    if (student) {
      setCurrentView('chapters');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFormOpen(true);
    }
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateFaculty = () => {
    setCurrentView('faculty');
    try {
      window.history.pushState(null, '', '/faculty-portal');
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync back/forward browser navigation
  useEffect(() => {
    const onPopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const hash = window.location.hash;
        if (path === '/faculty-portal' || hash === '#faculty-portal') {
          setCurrentView('faculty');
        } else if (path === '/' || path === '') {
          setCurrentView((prev) => (prev === 'faculty' ? 'home' : prev));
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigateChapters = () => {
    if (student) {
      setCurrentView('chapters');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFormOpen(true);
    }
  };

  const handleViewLastReport = () => {
    if (evaluationResult) {
      setCurrentView('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Launch assessment engine with selected chapters
  const handleLaunchAssessment = (selectedChapterTitles: string[]) => {
    if (!student) {
      setIsFormOpen(true);
      return;
    }

    try {
      const session = generateAssessmentSession(student, selectedChapterTitles);
      setActiveSession(session);

      // Save session in sessionStorage for refresh protection
      try {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(SESSION_START_TIME_KEY, Date.now().toString());
      } catch {}

      setCurrentView('assessment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Unable to generate assessment for selected chapters.');
    }
  };

  // Submit test and evaluate deterministically
  const handleSubmitTest = (userAnswers: Record<string, string>, timeSpentSeconds: number) => {
    if (!activeSession) return;

    const result = evaluateAssessmentSession(activeSession, userAnswers, timeSpentSeconds);
    setEvaluationResult(result);

    try {
      localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      sessionStorage.removeItem(SESSION_START_TIME_KEY);

      // Asynchronously archive student evaluation to Cloud Firestore
      setDoc(doc(db, 'assessment_results', result.resultId), {
        resultId: result.resultId,
        studentName: result.student.name,
        studentClass: result.student.studentClass,
        board: result.student.board,
        overallScore: result.overallScore,
        totalQuestions: result.totalQuestions,
        overallAccuracyPercent: result.overallAccuracyPercent,
        attemptedAccuracyPercent: result.attemptedAccuracyPercent,
        timeSpentSeconds: result.timeSpentSeconds,
        submittedAt: result.submittedAt,
        resultPayload: JSON.stringify(result),
      }).catch((err) => console.warn('Non-blocking cloud result archive notice:', err));
    } catch {}

    setActiveSession(null);
    setCurrentView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitTest = () => {
    try {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      sessionStorage.removeItem(SESSION_START_TIME_KEY);
    } catch {}
    setActiveSession(null);
    setCurrentView('chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeOrNewChapters = () => {
    setCurrentView('chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigateHome={handleNavigateHome}
        onNavigateChapters={handleNavigateChapters}
        onNavigateFaculty={handleNavigateFaculty}
        onOpenAssessmentForm={() => setIsFormOpen(true)}
        student={student}
      />

      {/* Persistent Previous Report Quick Bar on Home View */}
      {currentView === 'home' && evaluationResult && (
        <div className="bg-teal-900 text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <span>
              Previous assessment on file for <strong>{evaluationResult.student.name}</strong>: Score{' '}
              <strong>{evaluationResult.overallScore}/20</strong> ({evaluationResult.overallAccuracyPercent}% accuracy).
            </span>
            <button
              onClick={handleViewLastReport}
              className="px-3 py-1 bg-teal-700 hover:bg-teal-600 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              View Last Report →
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <Hero
              onStartAssessment={handleStartAssessmentClick}
              student={student}
              onNavigateChapters={handleNavigateChapters}
            />
            <Benefits
              onStartAssessment={handleStartAssessmentClick}
            />
            <HowItWorks
              onStartAssessment={handleStartAssessmentClick}
            />
            <MentorSection
              onStartAssessment={handleStartAssessmentClick}
            />
            <ContactSection />
          </>
        )}

        {currentView === 'chapters' && student && (
          <ChapterSelectionView
            student={student}
            onEditStudent={() => setIsFormOpen(true)}
            onNavigateHome={handleNavigateHome}
            onOpenSampleQuestions={() => setIsSampleQuestionsOpen(true)}
            onStartAssessment={handleLaunchAssessment}
          />
        )}

        {currentView === 'assessment' && activeSession && (
          <AssessmentEngineView
            session={activeSession}
            onSubmitTest={handleSubmitTest}
            onExitTest={handleExitTest}
          />
        )}

        {currentView === 'report' && evaluationResult && (
          <PerformanceReportView
            result={evaluationResult}
            onRetakeOrNewChapters={handleRetakeOrNewChapters}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {currentView === 'faculty' && (
          <FacultyDashboard onNavigateHome={handleNavigateHome} />
        )}
      </main>

      {/* Footer (hidden during active test and faculty portal for focused workspace) */}
      {currentView !== 'assessment' && currentView !== 'faculty' && (
        <Footer
          onNavigateHome={handleNavigateHome}
          onOpenAssessment={handleStartAssessmentClick}
          onNavigateFaculty={handleNavigateFaculty}
        />
      )}

      {/* Student Details Form Modal */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveStudent}
        initialProfile={student}
      />

      {/* Sample Diagnostic Questions Modal */}
      <SampleQuestionPreviewModal
        isOpen={isSampleQuestionsOpen}
        onClose={() => setIsSampleQuestionsOpen(false)}
      />

    </div>
  );
}
