import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Send,
  Lock,
  PlusCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  VerifiedQuestion,
  StudentClass,
  BoardType,
  QuestionDifficulty,
  QuestionSourceType,
  QuestionValidationError,
} from '../../types/assessment';
import { questionBankStore } from '../../services/questionBankStore';
import { CHAPTERS_DATA } from '../../data/chaptersData';
import { QuestionPreviewModal } from './QuestionPreviewModal';

interface AddQuestionFormProps {
  onQuestionAdded?: (q: VerifiedQuestion) => void;
  onOpenSecurityModal?: () => void;
}

const MATH_SYMBOLS = ['²', '³', '√', '±', 'π', '≤', '≥', '≠', '×', '÷', 'α', 'β', 'θ', '°'];

export const AddQuestionForm: React.FC<AddQuestionFormProps> = ({
  onQuestionAdded,
  onOpenSecurityModal,
}) => {
  const [board, setBoard] = useState<BoardType>('CBSE');
  const [studentClass, setStudentClass] = useState<StudentClass>('10');
  const [subject] = useState('Mathematics');
  const [chapterTitle, setChapterTitle] = useState('Real Numbers');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Moderate');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');
  const [hemangSirTip, setHemangSirTip] = useState('');
  const [marks, setMarks] = useState<number>(1);
  const [sourceType, setSourceType] = useState<QuestionSourceType>('NCERT');
  const [sourceReference, setSourceReference] = useState('');

  const [validationErrors, setValidationErrors] = useState<QuestionValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<VerifiedQuestion | null>(null);

  // Available chapters for the selected class
  const availableChapters = CHAPTERS_DATA.filter((c) => c.classId === studentClass);

  const insertSymbol = (sym: string, target: 'question' | 'explanation') => {
    if (target === 'question') {
      setQuestionText((prev) => prev + sym);
    } else {
      setExplanation((prev) => prev + sym);
    }
  };

  const getFormPayload = () => {
    const selectedChapter = availableChapters.find((c) => c.title === chapterTitle);
    return {
      classId: studentClass,
      board,
      subject,
      chapterNumber: selectedChapter ? selectedChapter.chapterNumber : 1,
      chapterTitle,
      topic: topic.trim(),
      difficulty,
      questionText: questionText.trim(),
      options: [
        { label: 'A' as const, text: optionA.trim() },
        { label: 'B' as const, text: optionB.trim() },
        { label: 'C' as const, text: optionC.trim() },
        { label: 'D' as const, text: optionD.trim() },
      ],
      correctOption,
      explanation: explanation.trim(),
      hemangSirTip: hemangSirTip.trim(),
      marks: Number(marks) || 1,
      sourceType,
      sourceReference: sourceReference.trim(),
    };
  };

  const handlePreview = () => {
    const payload = getFormPayload();
    const temp: VerifiedQuestion = {
      ...payload,
      id: 'PREVIEW-DRAFT',
      verificationStatus: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPreviewQuestion(temp);
  };

  const handleSave = (targetStatus: 'Draft' | 'Pending Verification') => {
    setSuccessMessage(null);
    const payload = getFormPayload();

    const res = questionBankStore.addQuestion(payload, targetStatus);
    if (!res.success) {
      setValidationErrors(res.errors || []);
      return;
    }

    setValidationErrors([]);
    setSuccessMessage(
      `Question successfully saved as "${targetStatus}" (ID: ${res.question?.id}) in the local repository.`
    );

    if (onQuestionAdded && res.question) {
      onQuestionAdded(res.question);
    }

    // Reset fields for next entry
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExplanation('');
    setHemangSirTip('');
    setTopic('');
    setSourceReference('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-left space-y-7">
      {/* Form Top Title */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Faculty Authoring Studio
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Manual Question Creation for Hemang Shah Sir
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standardised mathematical question authoring compliant with NCERT and CBSE Class 10 assessment benchmarks.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
          <span>Target Curriculum: </span>
          <strong className="text-slate-900">Class {studentClass} {board}</strong>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-teal-700 hover:text-teal-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation Errors Panel */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Please resolve the following before saving:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>
                <span className="font-semibold capitalize">{err.field}: </span>
                <span>{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Board Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Board Syllabus <span className="text-red-500">*</span>
          </label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="CBSE">CBSE (Central Board)</option>
            <option value="GSEB">GSEB (Gujarat Board)</option>
          </select>
        </div>

        {/* Class Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Target Class <span className="text-red-500">*</span>
          </label>
          <select
            value={studentClass}
            onChange={(e) => {
              const c = e.target.value as StudentClass;
              setStudentClass(c);
              const firstCh = CHAPTERS_DATA.find((ch) => ch.classId === c);
              if (firstCh) setChapterTitle(firstCh.title);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="10">Class 10</option>
            <option value="11-science">Class 11 Science (Staging)</option>
            <option value="12-science">Class 12 Science (Staging)</option>
          </select>
        </div>

        {/* Chapter Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Chapter <span className="text-red-500">*</span>
          </label>
          <select
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            {availableChapters.map((ch) => (
              <option key={ch.id} value={ch.title}>
                Ch {ch.chapterNumber}: {ch.title}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Difficulty Tier <span className="text-red-500">*</span>
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="Foundational">Foundational / Easy</option>
            <option value="Moderate">Moderate / Standard</option>
            <option value="Advanced">Advanced / High HOTS</option>
          </select>
        </div>
      </div>

      {/* Topic & Source Citation */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Syllabus Topic / Concept <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Fundamental Theorem of Arithmetic"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Source Provenance <span className="text-red-500">*</span>
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as QuestionSourceType)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          >
            <option value="NCERT">NCERT Textbook / Exemplar</option>
            <option value="CBSE">CBSE Official Board Question Bank</option>
            <option value="GSEB">GSEB Textbook / Board Resource</option>
            <option value="Teacher Created">Teacher Created (Hemang Shah Sir)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Source Reference Citation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={sourceReference}
            onChange={(e) => setSourceReference(e.target.value)}
            placeholder="e.g. NCERT Class 10 Ch 1 Ex 1.2 Q3"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Question Statement & Math Symbols Helper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-900">
            Question Statement <span className="text-red-500">*</span>
          </label>
          {/* Quick Mathematical Palette */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Insert Math:</span>
            {MATH_SYMBOLS.map((sym) => (
              <button
                type="button"
                key={sym}
                onClick={() => insertSymbol(sym, 'question')}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 rounded transition-colors cursor-pointer"
                title={`Insert ${sym}`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="State the mathematical problem clearly with all numerical conditions..."
          className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-sans"
        />
      </div>

      {/* 4 MCQ Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Four Multiple Choice Options (A, B, C, D) <span className="text-red-500">*</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Select radio button to indicate the correct answer.
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Option A */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 focus-within:ring-2 focus-within:ring-teal-600">
            <input
              type="radio"
              name="correctOptionGroup"
              checked={correctOption === 'A'}
              onChange={() => setCorrectOption('A')}
              className="accent-teal-700 w-4 h-4 cursor-pointer"
              title="Designate Option A as correct"
            />
            <span className="font-mono font-bold text-xs text-slate-700">A.</span>
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="Value for Option A"
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Option B */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 focus-within:ring-2 focus-within:ring-teal-600">
            <input
              type="radio"
              name="correctOptionGroup"
              checked={correctOption === 'B'}
              onChange={() => setCorrectOption('B')}
              className="accent-teal-700 w-4 h-4 cursor-pointer"
              title="Designate Option B as correct"
            />
            <span className="font-mono font-bold text-xs text-slate-700">B.</span>
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="Value for Option B"
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Option C */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 focus-within:ring-2 focus-within:ring-teal-600">
            <input
              type="radio"
              name="correctOptionGroup"
              checked={correctOption === 'C'}
              onChange={() => setCorrectOption('C')}
              className="accent-teal-700 w-4 h-4 cursor-pointer"
              title="Designate Option C as correct"
            />
            <span className="font-mono font-bold text-xs text-slate-700">C.</span>
            <input
              type="text"
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              placeholder="Value for Option C"
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Option D */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 focus-within:ring-2 focus-within:ring-teal-600">
            <input
              type="radio"
              name="correctOptionGroup"
              checked={correctOption === 'D'}
              onChange={() => setCorrectOption('D')}
              className="accent-teal-700 w-4 h-4 cursor-pointer"
              title="Designate Option D as correct"
            />
            <span className="font-mono font-bold text-xs text-slate-700">D.</span>
            <input
              type="text"
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              placeholder="Value for Option D"
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Detailed Mathematical Explanation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-900">
            Step-by-Step Mathematical Explanation <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {MATH_SYMBOLS.slice(0, 8).map((sym) => (
              <button
                type="button"
                key={sym}
                onClick={() => insertSymbol(sym, 'explanation')}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 rounded transition-colors cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Provide step-by-step mathematical reasoning demonstrating why Option is correct..."
          className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-sans"
        />
      </div>

      {/* Hemang Shah Sir's Personal Board Tip */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-teal-900">
          Hemang Shah Sir's Personal Board Exam Tip (Optional)
        </label>
        <input
          type="text"
          value={hemangSirTip}
          onChange={(e) => setHemangSirTip(e.target.value)}
          placeholder="e.g. Remember to verify the discriminant condition before factoring..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      {/* Action Buttons Bar */}
      <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview Question</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('Pending Verification')}
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit for Verification</span>
          </button>

          {/* Approve and Publish Button (Explicitly protected per security instructions) */}
          <div className="relative group">
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
              title="Publishing to live student pool requires authorized backend session"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Approve & Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Preview Modal */}
      <QuestionPreviewModal
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
      />
    </div>
  );
};
