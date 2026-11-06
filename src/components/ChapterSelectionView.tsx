import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  Search,
  BookOpen,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckSquare,
  Square,
  FileText,
  User,
  ShieldCheck,
  Lock,
  Play
} from 'lucide-react';
import { Chapter, StudentProfile, StudentClass, BoardType } from '../types/assessment';
import { CHAPTERS_DATA, CLASS_LABELS } from '../data/chaptersData';
import { checkSufficientQuestions } from '../services/assessmentGenerator';

interface ChapterSelectionViewProps {
  student: StudentProfile;
  onEditStudent: () => void;
  onNavigateHome: () => void;
  onOpenSampleQuestions: () => void;
  onStartAssessment: (selectedChapterTitles: string[]) => void;
}

const VERIFIED_CBSE_CHAPTER_TITLES = new Set([
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations in Two Variables',
  'Quadratic Equations',
  'Arithmetic Progressions',
]);

export const ChapterSelectionView: React.FC<ChapterSelectionViewProps> = ({
  student,
  onEditStudent,
  onNavigateHome,
  onOpenSampleQuestions,
  onStartAssessment,
}) => {
  // Lock to student's class, or allow exploring
  const [activeClass, setActiveClass] = useState<StudentClass>(student.studentClass);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(
    // By default select the 5 verified chapters for Class 10 CBSE
    student.studentClass === '10' && student.board === 'CBSE'
      ? new Set(['c10-01', 'c10-02', 'c10-03', 'c10-04', 'c10-05'])
      : new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [unverifiedNoticeModal, setUnverifiedNoticeModal] = useState<string | null>(null);

  const isClass10Cbse = activeClass === '10' && student.board === 'CBSE';

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

  // Selected chapters details
  const selectedChaptersList = useMemo(() => {
    return CHAPTERS_DATA.filter((c) => selectedChapterIds.has(c.id));
  }, [selectedChapterIds]);

  const verifiedSelectedChapters = useMemo(() => {
    return selectedChaptersList.filter((c) => VERIFIED_CBSE_CHAPTER_TITLES.has(c.title));
  }, [selectedChaptersList]);

  // Toggle single chapter selection
  const handleToggleChapter = (chapter: Chapter) => {
    if (!isClass10Cbse || !VERIFIED_CBSE_CHAPTER_TITLES.has(chapter.title)) {
      setUnverifiedNoticeModal(
        `"${chapter.title}" is currently in demonstration mode. The 20-question verified assessment engine is exclusively live for Chapters 1 to 5 of Class 10 CBSE.`
      );
      return;
    }

    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapter.id)) {
        next.delete(chapter.id);
      } else {
        next.add(chapter.id);
      }
      return next;
    });
  };

  // Select all verified
  const handleSelectAllVerified = () => {
    const verifiedIds = classChapters
      .filter((c) => VERIFIED_CBSE_CHAPTER_TITLES.has(c.title))
      .map((c) => c.id);

    if (selectedChapterIds.size === verifiedIds.length) {
      setSelectedChapterIds(new Set());
    } else {
      setSelectedChapterIds(new Set(verifiedIds));
    }
  };

  const handleLaunchAssessment = () => {
    if (!isClass10Cbse) {
      setUnverifiedNoticeModal(
        'Verified assessments are currently available exclusively for Class 10 CBSE. Class 10 GSEB and Classes 11 & 12 are undergoing official question bank curation.'
      );
      return;
    }

    const chaptersToTest =
      verifiedSelectedChapters.length > 0
        ? verifiedSelectedChapters.map((c) => c.title)
        : Array.from(VERIFIED_CBSE_CHAPTER_TITLES);

    // Verify sufficient approved questions exist before generating
    const check = checkSufficientQuestions(student, chaptersToTest);
    if (!check.isSufficient) {
      setUnverifiedNoticeModal(
        check.message ||
          `The selected chapter(s) contain only ${check.availableCount} verified question(s), which is fewer than the ${check.requiredCount} questions required. Please select additional verified chapters.`
      );
      return;
    }

    onStartAssessment(chaptersToTest);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-32 text-left">
      
      {/* Top Breadcrumb & Profile Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
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
        
        {/* Active Status Banner: Class 10 CBSE Exclusivity Notice */}
        {isClass10Cbse ? (
          <div className="bg-teal-50/90 border border-teal-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 text-teal-950">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>Verified Assessment Engine Active (Class 10 CBSE)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-200/80 font-bold text-teal-900">
                  100 Questions Verified
                </span>
              </div>
              <p className="text-teal-900/90 leading-relaxed text-xs">
                Chapters 1 to 5 are fully verified with approximately 20 questions each, checked answers, and Hemang Shah Sir’s board tips. Your assessment will generate <span className="font-bold">20 questions distributed evenly</span> across your selected chapters with a <span className="font-bold">25-minute timer</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>Curriculum Verification in Progress</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200/80 font-bold text-amber-900">
                  Coming Soon
                </span>
              </div>
              <p className="text-amber-900/90 leading-relaxed text-xs">
                To guarantee mathematical precision, the verified test engine is currently active <span className="font-bold">exclusively for Class 10 CBSE</span>. Class 10 GSEB and Classes 11 & 12 Science question banks are currently being vetted by Hemang Shah Sir and will remain in demonstration mode.
              </p>
            </div>
          </div>
        )}

        {/* Controls Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Select Assessment Chapters
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Select 1 to 5 verified chapters to take a customized 20-question, 25-minute evaluation.
              </p>
            </div>

            {/* Class switcher with clear status indicators */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
              {(['10', '11-science', '12-science'] as StudentClass[]).map((cls) => {
                const isActive = activeClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      setActiveClass(cls);
                      setSelectedUnit('all');
                      if (cls === '10' && student.board === 'CBSE') {
                        setSelectedChapterIds(new Set(['c10-01', 'c10-02', 'c10-03', 'c10-04', 'c10-05']));
                      } else {
                        setSelectedChapterIds(new Set());
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{CLASS_LABELS[cls]}</span>
                    {cls === '10' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" title="Active Verified Bank"></span>
                    ) : (
                      <span title="Verification in progress">
                        <Lock className="w-2.5 h-2.5 opacity-60" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Unit Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter or topic (e.g. Real Numbers, Quadratic)..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedUnit('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                All Chapters ({classChapters.length})
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
            {isClass10Cbse ? (
              <button
                onClick={handleSelectAllVerified}
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
              >
                {verifiedSelectedChapters.length === 5 ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                    <span>Deselect All 5 Verified Chapters</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>Select All 5 Verified Chapters</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-amber-800 font-medium">Demonstration syllabus mode</span>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSampleQuestions}
                className="inline-flex items-center gap-1 text-teal-800 hover:text-teal-950 font-semibold underline underline-offset-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                <span>Sample Questions Preview</span>
              </button>
            </div>
          </div>

        </div>

        {/* Chapters Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChapters.map((chapter) => {
            const isVerified = isClass10Cbse && VERIFIED_CBSE_CHAPTER_TITLES.has(chapter.title);
            const isSelected = selectedChapterIds.has(chapter.id);

            return (
              <div
                key={chapter.id}
                onClick={() => handleToggleChapter(chapter)}
                className={`bg-white rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all relative select-none ${
                  isVerified
                    ? isSelected
                      ? 'border-teal-700 ring-2 ring-teal-700 bg-teal-50/20 shadow-md cursor-pointer'
                      : 'border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-slate-50/50 opacity-80 cursor-not-allowed'
                }`}
              >
                <div>
                  {/* Card Header: Unit & Verification Badge */}
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="font-semibold text-teal-800">
                      {chapter.unit}
                    </span>
                    {isVerified ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 font-bold text-teal-900 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Verified Bank</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-500">
                        In Verification
                      </span>
                    )}
                  </div>

                  {/* Title & Checkbox */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {chapter.chapterNumber}. {chapter.title}
                    </h3>

                    {isVerified && (
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Concept Highlight */}
                  <p className="text-xs text-slate-600 mb-3.5 leading-relaxed line-clamp-2">
                    {chapter.conceptHighlight}
                  </p>

                  {/* Key Syllabus Topics */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
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

                {/* Footer Metadata */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~20 Qs Available</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {chapter.difficulty}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-teal-300 font-bold flex items-center justify-center shrink-0">
              {verifiedSelectedChapters.length}
            </div>
            <div>
              <span className="font-bold text-slate-900">
                {verifiedSelectedChapters.length === 0
                  ? 'No Verified Chapters Selected'
                  : `${verifiedSelectedChapters.length} Chapter${verifiedSelectedChapters.length > 1 ? 's' : ''} Selected`}
              </span>
              <div className="text-xs text-slate-500">
                Assessment specs: Exactly 20 questions distributed evenly · 25-minute timer
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {verifiedSelectedChapters.length > 0 && (
              <button
                onClick={() => setSelectedChapterIds(new Set())}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleLaunchAssessment}
              disabled={!isClass10Cbse || verifiedSelectedChapters.length === 0}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs ${
                isClass10Cbse && verifiedSelectedChapters.length > 0
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 text-teal-300 fill-teal-300" />
              <span>Start 25-Min Assessment (20 Questions)</span>
              <ChevronRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>

        </div>
      </div>

      {/* Unverified Syllabus Notice Modal */}
      {unverifiedNoticeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-left space-y-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Syllabus Verification in Progress
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {unverifiedNoticeModal}
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Currently Verified & Active:</div>
              <div>Class 10 CBSE — Chapters 1 to 5 (Real Numbers, Polynomials, Linear Equations, Quadratic Equations, Arithmetic Progressions).</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setUnverifiedNoticeModal(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
