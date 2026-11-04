import React from 'react';
import { ArrowRight, CheckCircle2, Phone, BookOpen, Target, Sparkles } from 'lucide-react';
import { StudentProfile } from '../types/assessment';

interface HeroProps {
  onStartAssessment: () => void;
  student: StudentProfile | null;
  onNavigateChapters: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartAssessment,
  student,
  onNavigateChapters,
}) => {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-16 sm:pt-16 sm:pb-20 border-b border-slate-100">
      {/* Background subtle geometry accents */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 right-0 w-96 h-96 rounded-full bg-teal-50 blur-3xl" />
        <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-slate-50 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Main Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Quiet Trust Marker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              <span>Vallabh Classes · Harni–Sama Link Road, Vadodara</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium lowercase">Est. 30 Years Experience</span>
            </div>

            {/* Headline as requested: "How Strong Is Your Maths Preparation?" */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              How Strong Is Your Maths Preparation?
            </h1>

            {/* Short explanation of the free assessment */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Evaluate your conceptual foundation and board-exam readiness with our targeted, syllabus-based evaluation. Specially designed for students of <span className="text-slate-900 font-semibold">Class 10, Class 11 Science, and Class 12 Science</span> across <span className="text-slate-900 font-semibold">CBSE and GSEB</span> boards.
            </p>

            {/* Core Action Zone */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {student ? (
                <button
                  onClick={onNavigateChapters}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                >
                  <span>Continue Chapter Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onStartAssessment}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  <span>Start Free Assessment</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              )}

              <a
                href="tel:9824076529"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Call Hemang Sir: 9824076529</span>
              </a>
            </div>

            {/* Key Academic Trust Highlights */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>100% Free Diagnostic</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>CBSE & GSEB Aligned</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Direct Teacher Guidance</span>
              </div>
            </div>
          </div>

          {/* Right Column: Academic Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-800 relative">
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-teal-400 tracking-wider uppercase">Vallabh Classes</div>
                  <div className="text-lg font-bold text-white mt-0.5">Faculty Profile & Pedagogy</div>
                </div>
                <div className="px-2.5 py-1 rounded bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-semibold">
                  30 Yrs Exp.
                </div>
              </div>

              <div className="py-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Hemang Shah Sir</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Senior Mathematics Educator mentoring high-school & higher-secondary science students in Vadodara since 1996.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Target Classes</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Class 10 (Board prep) · Class 11 Science (Foundation) · Class 12 Science (Board & Entrance clarity).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Assessment Philosophy</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Maths is not memorization. Test fundamental theorems, edge cases, and reasoning step-by-step.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Location: Harni–Sama Link Road</span>
                <span className="font-semibold text-teal-400">Vadodara, Gujarat</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
