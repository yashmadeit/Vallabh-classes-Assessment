import React, { useState, useEffect } from 'react';
import { X, ArrowRight, User, School, Check, AlertCircle } from 'lucide-react';
import { StudentProfile, StudentClass, BoardType } from '../types/assessment';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [studentClass, setStudentClass] = useState<StudentClass>(initialProfile?.studentClass || '12-science');
  const [board, setBoard] = useState<BoardType>(initialProfile?.board || 'CBSE');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setStudentClass(initialProfile.studentClass);
      setBoard(initialProfile.board);
      setPhone(initialProfile.phone || '');
    }
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter the student’s name to continue.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Please enter a valid student name (at least 2 letters).');
      return;
    }

    setError(null);
    onSubmit({
      name: trimmedName,
      studentClass,
      board,
      phone: phone.trim() || undefined,
      registeredAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Dialog Card */}
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase">
              Free Mathematics Assessment
            </div>
            <h2 id="modal-title" className="text-xl font-bold text-white mt-0.5">
              Student Registration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Field 1: Student Name */}
          <div className="space-y-1.5">
            <label htmlFor="student-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              1. Student Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Aryan Patel"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
                autoFocus
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Used to personalize your syllabus assessment and chapter analysis.
            </p>
          </div>

          {/* Field 2: Class Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              2. Academic Class <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: '10' as StudentClass, label: 'Class 10', subtitle: 'Secondary' },
                { id: '11-science' as StudentClass, label: '11 Science', subtitle: 'Higher Sec' },
                { id: '12-science' as StudentClass, label: '12 Science', subtitle: 'Board Year' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setStudentClass(item.id)}
                  className={`p-3 text-left rounded-lg border text-xs transition-all relative cursor-pointer ${
                    studentClass === item.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${studentClass === item.id ? 'text-teal-300' : 'text-slate-500'}`}>
                    {item.subtitle}
                  </div>
                  {studentClass === item.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3.5 h-3.5 text-teal-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Board Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              3. Examination Board <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'CBSE' as BoardType, label: 'CBSE', desc: 'Central Board of Secondary Education' },
                { id: 'GSEB' as BoardType, label: 'GSEB', desc: 'Gujarat Secondary & Higher Sec. Board' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setBoard(item.id)}
                  className={`p-3 text-left rounded-lg border text-xs transition-all cursor-pointer relative ${
                    board === item.id
                      ? 'border-teal-700 bg-teal-50/80 text-teal-950 ring-1 ring-teal-700'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{item.label}</span>
                    {board === item.id && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Optional Phone / WhatsApp */}
          <div className="space-y-1.5">
            <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Contact / WhatsApp <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="student-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98240XXXXX"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Provide if you want Hemang Shah Sir to send chapter recommendations via WhatsApp.
            </p>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue to Chapter Selection</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </button>
          </div>

        </form>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-500">
            Free service provided by Vallabh Classes · Harni–Sama Link Road, Vadodara
          </span>
        </div>

      </div>
    </div>
  );
};
