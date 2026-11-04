import React from 'react';
import { Phone, MapPin, Check, Award, Clock, Users } from 'lucide-react';

interface MentorSectionProps {
  onStartAssessment: () => void;
}

export const MentorSection: React.FC<MentorSectionProps> = ({ onStartAssessment }) => {
  return (
    <section id="faculty" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Teacher Narrative */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <div className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">
                Faculty Profile & 30-Year Heritage
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Maths Mentorship by Hemang Shah Sir
              </h2>
            </div>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              For over three decades in Vadodara, <span className="text-slate-900 font-semibold">Hemang Shah Sir</span> has guided generations of high-school and science stream students through Class 10, 11 Science, and 12 Science boards.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Rather than encouraging mechanical formula substitution or rote memorisation, his pedagogy focuses on understanding <span className="text-slate-900 font-medium">why a formula works</span>, dissecting edge cases, and building mathematical resilience. This free assessment is designed under his direct framework to identify where students genuinely need help before board examinations.
            </p>

            {/* Credential highlights */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 font-mono">30+</div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Years Teaching Experience</div>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 font-mono">10, 11, 12</div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Board Specialisation</div>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 font-mono">CBSE / GSEB</div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Curriculum Mastery</div>
              </div>
            </div>

            {/* Direct bullet points */}
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Personal attention to each student’s problem-solving approach and calculation discipline.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Proven track record of students securing top ranks and centum marks in Gujarat Board & CBSE Maths.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Accessible offline center at Harni–Sama Link Road for face-to-face doubts and paper discussions.</span>
              </li>
            </ul>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onStartAssessment}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Take Free Assessment
              </button>
              <a
                href="tel:9824076529"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Speak with Hemang Sir: 9824076529</span>
              </a>
            </div>
          </div>

          {/* Right Column: Classroom & Pedagogy Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xl">
                  HS
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hemang Shah Sir</h3>
                  <p className="text-xs text-teal-700 font-medium">Founder & Head Educator, Vallabh Classes</p>
                  <p className="text-xs text-slate-500 mt-0.5">Vadodara, Gujarat</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>30 Years of Teaching Excellence</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nurturing mathematical confidence since 1996 in students transitioning from school to higher technical careers.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Focus on Board Step-Marking</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every step in CBSE and GSEB carries designated marks. Hemang Sir trains students in presentation and logical justification.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Center Address</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vallabh Classes, Harni–Sama Link Road, Vadodara, Gujarat.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Direct Helpline:</span>
                <a
                  href="tel:9824076529"
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 font-mono transition-colors"
                >
                  +91 98240 76529
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
