import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  Search,
  BookOpen,
  Clock,
  HelpCircle,
  Phone,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  FileText,
  User,
  GraduationCap
} from 'lucide-react';
import { Chapter, StudentProfile, StudentClass, BoardType } from '../types/assessment';
import { CHAPTERS_DATA, CLASS_LABELS } from '../data/chaptersData';

interface ChapterSelectionViewProps {
  student: StudentProfile;
  onEditStudent: () => void;
  onNavigateHome: () => void;
  onOpenSampleQuestions: () => void;
}

export const ChapterSelectionView: React.FC<ChapterSelectionViewProps> = ({
  student,
  onEditStudent,
  onNavigateHome,
  onOpenSampleQuestions,
}) => {
  // Current active class filter defaults to the student's selected class
  const [activeClass, setActiveClass] = useState<StudentClass>(student.studentClass);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [isTestStatusModalOpen, setIsTestStatusModalOpen] = useState(false);

  // Filter chapters by active class
  const classChapters = useMemo(() => {
    return CHAPTERS_DATA.filter((c) => c.classId === activeClass);
  }, [activeClass]);

  // Extract unique units for current class
  const availableUnits = useMemo(() => {
    const units = new Set<string>();
    classChapters.forEach((c) => units.add(c.unit));
    return Array.from(units);
  }, [classChapters]);

  // Filter by search query and unit
  const filteredChapters = useMemo(() => {
    return classChapters.filter((chapter) => {
      const matchesSearch =
        chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.keyTopics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        chapter.unit.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = selectedUnit === 'all' || chapter.unit === selectedUnit;

      return matchesSearch && matchesUnit;
    });
  }, [classChapters, searchQuery, selectedUnit]);

  // Toggle single chapter selection
  const handleToggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Select all / deselect all
  const handleSelectAll = () => {
    if (selectedChapterIds.size === filteredChapters.length) {
      setSelectedChapterIds(new Set());
    } else {
      setSelectedChapterIds(new Set(filteredChapters.map((c) => c.id)));
    }
  };

  const selectedChaptersList = useMemo(() => {
    return CHAPTERS_DATA.filter((c) => selectedChapterIds.has(c.id));
  }, [selectedChapterIds]);

  const totalEstimatedTime = selectedChaptersList.reduce((acc, c) => acc + c.estimatedMinutes, 0);
  const totalQuestions = selectedChaptersList.reduce((acc, c) => acc + c.diagnosticQuestionsCount, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28">
      
      {/* Top Breadcrumb & Profile Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Breadcrumb back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-900">
              Chapter Selection
            </span>
          </div>

          {/* Student Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span className="font-bold text-slate-900">{student.name}</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-teal-900">{CLASS_LABELS[student.studentClass]}</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-slate-700">{student.board} Board</span>
            </div>

            <button
              onClick={onEditStudent}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Edit Details
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Mandatory Demonstration Data Notice Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 text-left text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <div className="font-bold text-amber-950 flex items-center gap-2">
              <span>Demonstration Syllabus Data</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-200/60 font-semibold text-amber-900">
                Stage 1 Preview
              </span>
            </div>
            <p className="text-amber-800/90 leading-relaxed text-xs">
              The chapters and topics listed below represent sample demonstration syllabus for {CLASS_LABELS[activeClass]} ({student.board}). The official 2024–25 board-verified question bank and marking rubrics are currently undergoing final curation by <span className="font-semibold text-amber-950">Hemang Shah Sir</span>. You can select chapters to preview topics and sample questions.
            </p>
          </div>
        </div>

        {/* Header & Controls Area */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 text-left shadow-xs">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Select Chapters to Assess
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Choose one or more chapters to build a focused diagnostic evaluation for {CLASS_LABELS[activeClass]}.
              </p>
            </div>

            {/* Quick Class Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
              {(['10', '11-science', '12-science'] as StudentClass[]).map((cls) => (
                <button
                  key={cls}
                  onClick={() => {
                    setActiveClass(cls);
                    setSelectedUnit('all');
                    setSelectedChapterIds(new Set());
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeClass === cls
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {CLASS_LABELS[cls]}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Unit Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter or topic (e.g. Calculus, Trigonometry)..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
              />
            </div>

            {/* Unit Dropdown / Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Unit:</span>
              <button
                onClick={() => setSelectedUnit('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                All Units ({classChapters.length})
              </button>
              {availableUnits.map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                    selectedUnit === unit
                      ? 'bg-teal-50 border-teal-600 text-teal-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Selection Utilities & Stats */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
            <button
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
            >
              {selectedChapterIds.size === filteredChapters.length && filteredChapters.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-teal-700" />
                  <span>Deselect All Visible</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select All ({filteredChapters.length} chapters)</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSampleQuestions}
                className="inline-flex items-center gap-1 text-teal-800 hover:text-teal-950 font-semibold underline underline-offset-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                <span>Preview Sample Questions</span>
              </button>
              <span className="text-slate-400">·</span>
              <span>Showing {filteredChapters.length} of {classChapters.length} chapters</span>
            </div>
          </div>

        </div>

        {/* Chapters Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChapters.map((chapter) => {
            const isSelected = selectedChapterIds.has(chapter.id);
            return (
              <div
                key={chapter.id}
                onClick={() => handleToggleChapter(chapter.id)}
                className={`bg-white rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all cursor-pointer relative text-left select-none ${
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50/50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header: Unit & Difficulty */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-teal-800">
                      {chapter.unit}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Ch {chapter.chapterNumber}
                    </span>
                  </div>

                  {/* Title & Checkbox */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {chapter.title}
                    </h3>
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-teal-300'
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Concept Highlight */}
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                    {chapter.conceptHighlight}
                  </p>

                  {/* Key Syllabus Topics Bullet Points */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Key Topics
                    </div>
                    {chapter.keyTopics.slice(0, 3).map((topic, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <span className="text-teal-700 font-bold shrink-0">•</span>
                        <span className="line-clamp-1">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Metadata */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{chapter.estimatedMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">{chapter.diagnosticQuestionsCount} Qs</span>
                    <span className="text-slate-300">·</span>
                    <span className={`text-[11px] font-semibold ${
                      chapter.difficulty === 'Advanced'
                        ? 'text-red-700'
                        : chapter.difficulty === 'Moderate'
                        ? 'text-amber-700'
                        : 'text-teal-700'
                    }`}>
                      {chapter.difficulty}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {filteredChapters.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No chapters match your search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search query or switching to another unit to see available topics.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedUnit('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Floating Bottom Action Bar when chapters are selected */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-300 font-bold flex items-center justify-center shrink-0">
              {selectedChapterIds.size}
            </div>
            <div>
              <span className="font-bold text-slate-900">
                {selectedChapterIds.size === 0
                  ? 'No Chapters Selected'
                  : `${selectedChapterIds.size} Chapter${selectedChapterIds.size > 1 ? 's' : ''} Selected`}
              </span>
              {selectedChapterIds.size > 0 && (
                <span className="text-slate-500 ml-2">
                  (Est. {totalEstimatedTime} mins · {totalQuestions} diagnostic questions)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedChapterIds.size > 0 && (
              <button
                onClick={() => setSelectedChapterIds(new Set())}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            )}
            <button
              onClick={() => {
                if (selectedChapterIds.size === 0) {
                  // Select first chapter by default if none selected
                  if (filteredChapters.length > 0) {
                    setSelectedChapterIds(new Set([filteredChapters[0].id]));
                  }
                }
                setIsTestStatusModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span>Proceed to Diagnostic Test</span>
              <ChevronRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation & Status Dialog (Honest disclosure of Stage 1 status) */}
      {isTestStatusModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-left">
            
            <div className="bg-slate-900 text-white p-6">
              <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Assessment Status · Stage 1 Development
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Diagnostic Chapters Selected
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Student: <span className="text-white font-semibold">{student.name}</span> · {CLASS_LABELS[student.studentClass]} ({student.board})
              </p>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-700" />
                  <span>Your selection has been saved:</span>
                </div>
                <div className="pl-5 text-slate-700 font-medium">
                  {selectedChaptersList.length > 0
                    ? selectedChaptersList.map((c) => c.title).join(', ')
                    : 'All core syllabus chapters'}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-900">
                  Question Bank Under Active Curation by Hemang Shah Sir:
                </p>
                <p>
                  As this is the initial development phase, the automated question-grading engine is being verified to ensure strict alignment with the 2024–25 CBSE & GSEB marking schemes.
                </p>
                <p>
                  In the meantime, you can explore sample diagnostic questions, or connect directly with Hemang Shah Sir for personal syllabus guidance and offline practice papers at the Harni–Sama Link Road center.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Contact Hemang Shah Sir</span>
                  <span className="text-teal-700 font-mono">9824076529</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href="tel:9824076529"
                    className="flex-1 py-2 text-center text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-300" />
                    <span>Call Hemang Sir</span>
                  </a>
                  <a
                    href={`https://wa.me/919824076529?text=${encodeURIComponent(
                      `Hello Hemang Sir, I am ${student.name} from ${CLASS_LABELS[student.studentClass]} (${student.board}). I registered on the Vallabh Classes assessment website and would like guidance for: ${selectedChaptersList.map((c) => c.title).join(', ')}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-center text-xs font-semibold text-teal-950 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Send on WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsTestStatusModalOpen(false);
                    onOpenSampleQuestions();
                  }}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2 cursor-pointer"
                >
                  View Sample Questions Preview
                </button>
                <button
                  onClick={() => setIsTestStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Back to Chapters
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
