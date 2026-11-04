import React from 'react';
import { Layers, LineChart, Compass, ArrowRight } from 'lucide-react';

interface BenefitsProps {
  onStartAssessment: () => void;
}

export const Benefits: React.FC<BenefitsProps> = ({ onStartAssessment }) => {
  const benefitsList = [
    {
      id: 'chapter-test',
      icon: Layers,
      title: 'Chapter-Based Test',
      lead: 'Master individual topics before comprehensive board mocks.',
      description:
        'Instead of generic, overwhelming syllabus tests, evaluate your conceptual strength chapter by chapter. Isolate areas like Calculus, Trigonometry, or Coordinate Geometry to check your formula derivation, theorem application, and calculation speed.',
      points: [
        'Curated question sets matching CBSE & GSEB board patterns',
        'Balanced spread of foundational, conceptual, and application problems',
        'Tests speed and accuracy without time pressure',
      ],
    },
    {
      id: 'performance-analysis',
      icon: LineChart,
      title: 'Performance Analysis',
      lead: 'Know exactly where silly errors and conceptual gaps happen.',
      description:
        'A mark sheet tells you what you scored; a performance diagnostic tells you why. Understand whether marks are being lost due to algebraic manipulation errors, missing negative signs, improper step justification, or fundamental theorem confusion.',
      points: [
        'Clear breakdown of question difficulty handling',
        'Identification of recurrent calculation & sign errors',
        'Insight into board-marking step evaluation criteria',
      ],
    },
    {
      id: 'personalised-recommendations',
      icon: Compass,
      title: 'Personalised Recommendations',
      lead: 'Direct guidance from 30 years of classroom experience.',
      description:
        'No robotic algorithm can replace experienced human mentorship. Hemang Shah Sir reviews the pattern of your responses to recommend high-yield practice exercises, recommended textbook problems, and focused revision routines.',
      points: [
        'Direct consultation with Hemang Shah Sir (30 yrs exp.)',
        'Customized revision plan based on your target board score',
        'Actionable guidance for Class 10, 11 Science & 12 Science',
      ],
    },
  ];

  return (
    <section id="benefits" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-left">
          <div className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">
            Why Take The Free Assessment?
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Three Core Benefits for CBSE & GSEB Students
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed font-normal">
            Designed to bridge the gap between classroom teaching and board exam excellence through structured diagnostic insight.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {benefitsList.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
              >
                <div>
                  {/* Clean unboxed header index & icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>

                  <p className="text-sm font-medium text-teal-800 mb-3 leading-snug">
                    {benefit.lead}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {benefit.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <ul className="space-y-2 text-xs text-slate-600">
                    {benefit.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiet Bottom Strip */}
        <div className="mt-12 p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-semibold text-slate-900">
              Ready to discover your mathematics strengths and blind spots?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Takes less than 2 minutes to select your chapters and begin.
            </p>
          </div>
          <button
            onClick={onStartAssessment}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0 whitespace-nowrap"
          >
            <span>Start Free Assessment</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
          </button>
        </div>

      </div>
    </section>
  );
};
