import React, { useState } from 'react';
import { Menu, X, Phone, GraduationCap, Shield } from 'lucide-react';
import { StudentProfile } from '../types/assessment';

interface HeaderProps {
  currentView: 'home' | 'chapters' | 'assessment' | 'report' | 'faculty';
  onNavigateHome: () => void;
  onNavigateChapters: () => void;
  onNavigateFaculty: () => void;
  onOpenAssessmentForm: () => void;
  student: StudentProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onNavigateChapters,
  onNavigateFaculty,
  onOpenAssessmentForm,
  student,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // During active assessment or faculty portal, dedicated top bar handles controls.
  if (currentView === 'assessment' || currentView === 'faculty') {
    return null;
  }

  const handleNavClick = (sectionId?: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'home') {
      onNavigateHome();
      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Single Brand Wordmark element */}
          <button
            onClick={() => handleNavClick()}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            aria-label="Vallabh Classes Home"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Vallabh Classes
              </span>
              <span className="text-[11px] font-medium text-teal-700 tracking-wider uppercase whitespace-nowrap">
                Maths Assessment · Vadodara
              </span>
            </div>
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleNavClick()}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                currentView === 'home' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('benefits')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Benefits
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('faculty')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Hemang Shah Sir
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Contact
            </button>
            <button
              onClick={onNavigateFaculty}
              className="hover:text-teal-700 transition-colors whitespace-nowrap flex items-center gap-1.5 text-slate-600"
              title="Private Faculty Question Bank & Management"
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Faculty Portal</span>
            </button>
            {student && (
              <button
                onClick={onNavigateChapters}
                className={`hover:text-teal-700 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentView === 'chapters' ? 'text-teal-700 font-semibold' : 'text-slate-700'
                }`}
              >
                Chapters (Class 10 CBSE)
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Action CTA */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <a
              href="tel:9824076529"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              title="Call Hemang Shah Sir"
            >
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>9824076529</span>
            </a>
            {student ? (
              <button
                onClick={onNavigateChapters}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                {currentView === 'chapters' ? 'Select Chapters' : 'Start Assessment'}
              </button>
            ) : (
              <button
                onClick={onOpenAssessmentForm}
                className="px-4.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                Start Free Assessment
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <button
              onClick={() => handleNavClick()}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('benefits')}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              Benefits
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('faculty')}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              Hemang Shah Sir (30 Yrs Exp)
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              Contact & Location
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateFaculty();
              }}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 text-teal-800 font-semibold"
            >
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Faculty Portal (Restricted)</span>
            </button>
            {student && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateChapters();
                }}
                className="text-left px-3 py-2 rounded-md text-teal-700 font-semibold bg-teal-50"
              >
                Select Chapters (Class 10 CBSE)
              </button>
            )}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (student) {
                  onNavigateChapters();
                } else {
                  onOpenAssessmentForm();
                }
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {student ? 'Go to Chapter Selection' : 'Start Free Assessment'}
            </button>
            <a
              href="tel:9824076529"
              className="w-full py-2 px-4 text-center text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              Call Hemang Shah Sir: 9824076529
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
