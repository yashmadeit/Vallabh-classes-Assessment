import React, { useState } from 'react';
import { Phone, MapPin, Mail, Clock, MessageSquare, Check, Copy } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('9824076529');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">
            Get In Touch
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Contact Vallabh Classes
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed font-normal">
            Have questions about the free assessment, batch schedules, or need guidance on CBSE/GSEB Maths preparation? Contact Hemang Shah Sir directly.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Cards (7 cols) */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            
            {/* Phone Card */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Direct Phone / WhatsApp
                </h3>
                <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                  9824076529
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Direct line to Hemang Shah Sir for student assessments and batch inquiries.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-2">
                <a
                  href="tel:9824076529"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                >
                  Call Now
                </a>
                <a
                  href="https://wa.me/919824076529"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-md transition-colors"
                >
                  WhatsApp
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="ml-auto p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
                  title="Copy number"
                  aria-label="Copy number"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Location Card */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Classroom Location
                </h3>
                <div className="text-base font-bold text-slate-900 mt-1">
                  Harni–Sama Link Road
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Vallabh Classes, Harni–Sama Link Road, Vadodara, Gujarat. Conveniently accessible from Sama, Harni, and Karelibaug areas.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-medium text-slate-700">Vadodara Center</span>
                <span>· Offline Classroom</span>
              </div>
            </div>

            {/* Educator Card */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                    Mathematics Educator
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    Hemang Shah Sir
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Personalized coaching and concept-clearing for Class 10 (CBSE/GSEB), Class 11 Science (CBSE/GSEB), and Class 12 Science (CBSE/GSEB). Over 30 years of consistent results in board examinations.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <a
                    href="tel:9824076529"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-300" />
                    <span>Call Hemang Sir</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Card: Timings & Guidance Notice (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 sm:p-7 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">
              Assessment Inquiries & Admissions
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Students and parents are welcome to contact for assessment review or to schedule a personal interaction with Hemang Sir at the center.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Consultation Hours</div>
                  <div className="text-slate-400 mt-0.5">Monday to Saturday: 10:00 AM – 7:30 PM</div>
                  <div className="text-slate-400">Sunday: By prior telephonic appointment</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">WhatsApp Query</div>
                  <div className="text-slate-400 mt-0.5">
                    Send student’s name, current class, and board to 9824076529 for quick response.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Location Accessibility</div>
                  <div className="text-slate-400 mt-0.5">
                    Located centrally on Harni–Sama Link Road, Vadodara, with parking and transit access.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-[11px] text-teal-400/90 font-medium leading-relaxed">
                Note: This online assessment tool is completely free of charge. No payment details are ever requested.
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
