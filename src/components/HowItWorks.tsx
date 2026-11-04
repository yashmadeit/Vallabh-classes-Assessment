import React from 'react';
import { UserCheck, ListChecks, Award } from 'lucide-react';

interface HowItWorksProps {
  onStartAssessment: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartAssessment }) => {
  const steps = [
    {
      step: '01',
      icon: UserCheck,
      title: 'Enter Student Details',
      desc: 'Tell us your name, choose your academic class (Class 10, 11 Science, or 12 Science), and select your board (CBSE or GSEB).',
      detail: 'No complicated sign-up or passwords required.',
    },
    {
      step: '02',
      icon: ListChecks,
      title: 'Select Specific Chapters',
      desc: 'Choose the individual chapters or units you have recently revised or wish to test—from Algebra and Calculus to Geometry.',
      detail: 'Tailored specifically to your current school syllabus.',
    },
    {
      step: '03',
      icon: Award,
      title: 'Receive Diagnostic Insights',
      desc: 'Understand your conceptual clarity, step precision, and consult directly with Hemang Shah Sir for tailored study advice.',
      detail: 'Connect directly at Harni–Sama Link Road, Vadodara.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">
            Simple 3-Step Process
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            How The Assessment Works
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed font-normal">
            No convoluted learning management systems or paywalls. A direct, transparent method to understand your mathematics readiness.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-white rounded-xl p-6 sm:p-7 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      STEP {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs font-medium text-teal-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  <span>{item.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
