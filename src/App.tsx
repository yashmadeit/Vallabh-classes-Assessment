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
import { StudentProfile } from './types/assessment';

const STORAGE_KEY = 'vallabh_classes_student_profile';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'chapters'>('home');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSampleQuestionsOpen, setIsSampleQuestionsOpen] = useState(false);

  // Load student profile from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.studentClass && parsed.board) {
          setStudent(parsed);
        }
      }
    } catch {
      // ignore JSON parse or storage issues
    }
  }, []);

  const handleSaveStudent = (profile: StudentProfile) => {
    setStudent(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateChapters = () => {
    if (student) {
      setCurrentView('chapters');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFormOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Header with Top Bar Contract */}
      <Header
        currentView={currentView}
        onNavigateHome={handleNavigateHome}
        onNavigateChapters={handleNavigateChapters}
        onOpenAssessmentForm={() => setIsFormOpen(true)}
        student={student}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' ? (
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
        ) : (
          student && (
            <ChapterSelectionView
              student={student}
              onEditStudent={() => setIsFormOpen(true)}
              onNavigateHome={handleNavigateHome}
              onOpenSampleQuestions={() => setIsSampleQuestionsOpen(true)}
            />
          )
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateHome={handleNavigateHome}
        onOpenAssessment={handleStartAssessmentClick}
      />

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
