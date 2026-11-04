import React from 'react';
import { Phone, MapPin, GraduationCap, ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigateHome: () => void;
  onOpenAssessment: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateHome, onOpenAssessment }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand & Educator (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-900/60 border border-teal-700/60 text-teal-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Vallabh Classes
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Free Mathematics diagnostic assessment website dedicated to high school and higher secondary students of Class 10, Class 11 Science, and Class 12 Science (CBSE & GSEB).
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-200 font-semibold">Maths Educator: </span>
                <span>Hemang Shah Sir (30 Years Teaching Experience)</span>
              </div>
              <div>
                <span className="text-slate-200 font-semibold">Specialisation: </span>
                <span>CBSE & GSEB Board Mathematics Excellence</span>
              </div>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onNavigateHome}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home Overview
                </button>
              </li>
              <li>
                <a href="#benefits" className="hover:text-white transition-colors">
                  Three Core Benefits
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faculty" className="hover:text-white transition-colors">
                  About Hemang Shah Sir
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Center & Contact Details
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenAssessment}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
                >
                  Start Free Assessment →
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Location (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Center Details
            </h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  Vallabh Classes, Harni–Sama Link Road, Vadodara, Gujarat.
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <a
                  href="tel:9824076529"
                  className="text-slate-300 hover:text-white font-mono font-semibold transition-colors"
                >
                  +91 98240 76529
                </a>
              </div>
            </div>

            <div className="pt-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800">
              Classes offered for Class 10, Class 11 Science, and Class 12 Science. Board syllabus curriculum support for CBSE and Gujarat Board (GSEB).
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Vallabh Classes. All rights reserved. Vadodara, Gujarat.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Demonstration Release · Stage 1</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Scroll to top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
