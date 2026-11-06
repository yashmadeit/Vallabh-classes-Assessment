import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  Clock,
  HardDrive,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { SystemBackup } from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService } from '../../services/firebaseAuthService';

export const BackupManagerView: React.FC = () => {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<SystemBackup | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const authState = firebaseAuthService.getAuthState();
  const isAdmin = firebaseAuthService.isAdmin();
  const performer =
    authState.profile?.displayName || authState.user?.displayName || 'Administrator';

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const list = await firebaseQuestionBankService.getBackupsList();
      setBackups(list);
    } catch (err) {
      console.warn('Failed to fetch backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleDownloadJson = () => {
    const jsonStr = firebaseQuestionBankService.exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vallabh_classes_question_bank_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = firebaseQuestionBankService.exportToCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vallabh_classes_question_bank_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateManualBackup = async () => {
    setIsCreatingBackup(true);
    setStatusMessage(null);
    try {
      const newBackup = await firebaseQuestionBankService.createBackup(
        'manual',
        performer,
        'Manual on-demand cloud backup initiated from Administrator Dashboard'
      );
      setStatusMessage({
        type: 'success',
        text: `Backup ${newBackup.id} created successfully with ${newBackup.questionCount} questions.`,
      });
      await loadBackups();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create backup snapshot.',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackupFile = (backup: SystemBackup) => {
    const blob = new Blob([backup.dataPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.id}_${backup.timestamp.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const result = await firebaseQuestionBankService.restoreFromBackup(
        selectedBackupForRestore.id,
        performer,
        authState.user?.uid
      );
      setStatusMessage({
        type: 'success',
        text: `Successfully restored database to backup ${selectedBackupForRestore.id}. Restored ${result.restoredQuestionsCount} questions. An automatic pre-restore safety snapshot was recorded.`,
      });
      setSelectedBackupForRestore(null);
      setRestoreConfirmText('');
      await loadBackups();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Restoration failed.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 max-w-lg mx-auto my-12 text-left">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">
            Administrator Access Required
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Database backup and recovery controls are restricted to authenticated system administrators. Ordinary faculty accounts can view question status and file correction reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Disaster Recovery & Data Resilience
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Database Backup & Recovery Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated and manual snapshots stored in protected Cloud Firestore storage with instant JSON/CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-600" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleCreateManualBackup}
            disabled={isCreatingBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <HardDrive className="w-3.5 h-3.5 text-teal-400" />
            <span>{isCreatingBackup ? 'Saving Snapshot...' : 'Create Manual Backup'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-teal-50 border border-teal-200 text-teal-900'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Backup History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Backup Archives ({backups.length})
          </div>
          <button
            onClick={loadBackups}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading backup archives...</div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-800 text-sm">No Backups Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Create Manual Backup" to create your first cloud snapshot.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {backups.map((bk) => (
              <div
                key={bk.id}
                className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{bk.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        bk.backupType === 'manual'
                          ? 'bg-teal-100 text-teal-800'
                          : bk.backupType === 'pre_restore'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {bk.backupType}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700">
                      {bk.questionCount} Questions
                    </span>
                  </div>

                  <div className="text-slate-500 text-[11px] flex items-center gap-2">
                    <span>Created by: {bk.createdBy}</span>
                    <span>·</span>
                    <span>{new Date(bk.timestamp).toLocaleString()}</span>
                    {bk.notes && (
                      <>
                        <span>·</span>
                        <span className="italic text-slate-600">{bk.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadBackupFile(bk)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-semibold"
                    title="Download JSON Snapshot"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setSelectedBackupForRestore(bk)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Database Restoration */}
      {selectedBackupForRestore && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 text-left shadow-2xl">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                Confirm Database Restoration
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You are about to restore the question bank from backup{' '}
                <strong className="font-mono text-slate-900">{selectedBackupForRestore.id}</strong>{' '}
                ({selectedBackupForRestore.questionCount} questions, dated{' '}
                {new Date(selectedBackupForRestore.timestamp).toLocaleDateString()}).
              </p>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-900 mt-2">
                <strong>Automatic Safety Feature:</strong> A snapshot of your current database state will be automatically created before restoration proceeds.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type <strong>RESTORE</strong> to confirm:
              </label>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 uppercase font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBackupForRestore(null);
                  setRestoreConfirmText('');
                }}
                disabled={isRestoring}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring || restoreConfirmText !== 'RESTORE'}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {isRestoring ? 'Restoring Questions...' : 'Proceed with Restoration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
