import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, ShieldAlert, Lock, Info, RotateCcw } from 'lucide-react';
import { AssessmentSettings } from '../../types/assessment';
import { questionBankStore } from '../../services/questionBankStore';

export const AssessmentSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<AssessmentSettings>(() =>
    questionBankStore.getAssessmentSettings()
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    questionBankStore.saveAssessmentSettings(settings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    const defaults = {
      defaultQuestionCount: 20,
      defaultTimeMinutes: 25,
      passingScorePercent: 70,
      minimumAttemptsForDiagnosis: 3,
      distributionStrategy: 'even' as const,
      allowCalculator: false,
    };
    setSettings(defaults);
    questionBankStore.saveAssessmentSettings(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-left space-y-7 max-w-4xl">
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Assessment Engine Configuration
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Diagnostic Test & Evaluation Parameters
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rules governing live student assessment generation, countdown timers, and diagnostic scoring.
          </p>
        </div>

        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Settings Saved</span>
          </span>
        )}
      </div>

      <div className="space-y-6 text-xs text-slate-700">
        {/* Core Parameters */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Default Question Count */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Default Questions Per Test</label>
              <span className="font-mono text-teal-800 font-bold">{settings.defaultQuestionCount} Qs</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Total questions drawn and evenly distributed across the student’s selected chapters.
            </p>
            <input
              type="number"
              min={5}
              max={50}
              step={5}
              value={settings.defaultQuestionCount}
              onChange={(e) =>
                setSettings({ ...settings, defaultQuestionCount: parseInt(e.target.value, 10) || 20 })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Test Duration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Timer Allocation (Minutes)</label>
              <span className="font-mono text-teal-800 font-bold">{settings.defaultTimeMinutes} Minutes</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Countdown timer allocated before the assessment auto-submits answers.
            </p>
            <input
              type="number"
              min={10}
              max={60}
              step={5}
              value={settings.defaultTimeMinutes}
              onChange={(e) =>
                setSettings({ ...settings, defaultTimeMinutes: parseInt(e.target.value, 10) || 25 })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Strong Chapter Threshold */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Strong Chapter Threshold (%)</label>
              <span className="font-mono text-teal-800 font-bold">&ge; {settings.passingScorePercent}%</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chapters with attempted accuracy at or above this percent are classified as Board Ready (Strong).
            </p>
            <input
              type="number"
              min={50}
              max={90}
              step={5}
              value={settings.passingScorePercent}
              onChange={(e) =>
                setSettings({ ...settings, passingScorePercent: parseInt(e.target.value, 10) || 70 })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Limited Data Threshold Rule */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Limited Assessment Data Rule</label>
              <span className="font-mono text-teal-800 font-bold">&lt; {settings.minimumAttemptsForDiagnosis} Qs</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chapters with fewer attempted questions are marked "Limited Assessment Data" instead of Strong or Weak.
            </p>
            <input
              type="number"
              min={2}
              max={5}
              value={settings.minimumAttemptsForDiagnosis}
              onChange={(e) =>
                setSettings({ ...settings, minimumAttemptsForDiagnosis: parseInt(e.target.value, 10) || 3 })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Curriculum Restriction Guard */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-600" />
            <span>Active Curriculum Policy</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Per educational integrity requirements, <strong>Class 10 CBSE</strong> is the only active test pool (5 verified chapters, 100 questions). Class 10 GSEB, Class 11 Science, and Class 12 Science remain locked in demonstration mode until their respective question banks are officially verified.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset to CBSE Defaults</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Assessment Settings</span>
        </button>
      </div>
    </div>
  );
};
