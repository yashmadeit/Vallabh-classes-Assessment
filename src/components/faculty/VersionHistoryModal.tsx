import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { VerifiedQuestion, QuestionVersion } from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService } from '../../services/firebaseAuthService';

interface VersionHistoryModalProps {
  question: VerifiedQuestion;
  onClose: () => void;
  onVersionRestored: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  question,
  onClose,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<QuestionVersion | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authState = firebaseAuthService.getAuthState();
  const isAdmin = firebaseAuthService.isAdmin();
  const performer =
    authState.profile?.displayName || authState.user?.displayName || 'Administrator';

  useEffect(() => {
    async function loadVersions() {
      setIsLoading(true);
      try {
        const list = await firebaseQuestionBankService.getQuestionVersions(question.id);
        setVersions(list);
        if (list.length > 0) {
          setSelectedVersion(list[0]);
        }
      } catch (err) {
        console.warn('Failed to load version history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVersions();
  }, [question.id]);

  const handleRestore = async () => {
    if (!selectedVersion) return;
    setIsRestoring(true);
    setErrorMsg(null);

    try {
      await firebaseQuestionBankService.restoreQuestionVersion(
        question.id,
        selectedVersion,
        restoreReason.trim() || `Restored from version v${selectedVersion.version} by ${performer}`,
        performer,
        authState.user?.uid
      );
      setConfirmModal(false);
      onVersionRestored();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore version.');
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Question Version History & Audit Trail
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300">
                  Current: v{question.version || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Question ID: <span className="font-mono text-teal-300">{question.id}</span> · {question.chapterTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading historical snapshots...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-slate-500">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">Initial Version (v1)</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This question is currently at its initial curated version. As edits or corrections are applied, snapshots will be automatically archived here.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Version Timeline Selector */}
              <div className="space-y-2 border-r border-slate-200 pr-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Archived Versions ({versions.length})
                </div>
                {versions.map((ver) => {
                  const isSelected = selectedVersion?.id === ver.id;
                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/50 shadow-2xs font-semibold'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-900 mb-1">
                        <span className="font-bold font-mono">v{ver.version}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ver.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1">
                        By: {ver.modifiedBy}
                      </div>
                      <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                        {ver.reason}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Version Comparison & Inspector */}
              <div className="md:col-span-2 space-y-4">
                {selectedVersion ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">Inspecting Version v{selectedVersion.version}</span>
                        <div className="text-slate-500 text-[11px]">
                          Archived on {new Date(selectedVersion.timestamp).toLocaleString()} by {selectedVersion.modifiedBy}
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setConfirmModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-teal-300" />
                          <span>Restore Version</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <strong>Modification Reason: </strong> {selectedVersion.reason}
                    </div>

                    {/* Question Statement */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Question Statement</div>
                      <p className="text-slate-900 leading-relaxed font-mono">
                        {selectedVersion.questionSnapshot.questionText}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">
                        Options & Correct Answer (Option {selectedVersion.questionSnapshot.correctOption})
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {selectedVersion.questionSnapshot.options.map((opt) => (
                          <div
                            key={opt.label}
                            className={`p-2 rounded border text-xs flex items-center gap-2 ${
                              opt.label === selectedVersion.questionSnapshot.correctOption
                                ? 'border-teal-500 bg-teal-50/50 font-semibold text-teal-950'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="font-mono font-bold">{opt.label}.</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Step-by-Step Explanation</div>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedVersion.questionSnapshot.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Select a version to inspect details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <span>Protected immutable cloud storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Restore Confirmation Dialog */}
        {confirmModal && selectedVersion && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 text-left shadow-2xl">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Confirm Restoration to Version v{selectedVersion.version}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Restoring will not overwrite or delete historical records. It creates a brand-new version <strong className="font-mono text-slate-900">v{(question.version || 1) + 1}</strong> containing the snapshot from version v{selectedVersion.version}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Restoration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  placeholder="e.g. Reverting erroneous formula amendment..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(false)}
                  disabled={isRestoring}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isRestoring || !restoreReason.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isRestoring ? 'Restoring...' : 'Confirm & Create New Version'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
