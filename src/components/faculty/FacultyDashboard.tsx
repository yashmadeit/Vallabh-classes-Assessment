import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Database,
  PlusCircle,
  UploadCloud,
  Clock,
  CheckCircle2,
  Archive,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Menu,
  X,
  Flag,
  HardDrive,
  Activity,
  LogIn,
  LogOut,
  User,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { FacultyOverview } from './FacultyOverview';
import { QuestionBankManager } from './QuestionBankManager';
import { AddQuestionForm } from './AddQuestionForm';
import { BulkImportView } from './BulkImportView';
import { AssessmentSettingsManager } from './AssessmentSettingsManager';
import { BackendSecurityModal } from './BackendSecurityModal';
import { CorrectionRequestsView } from './CorrectionRequestsView';
import { BackupManagerView } from './BackupManagerView';
import { AuditLogsView } from './AuditLogsView';
import { questionBankStore } from '../../services/questionBankStore';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';
import { firebaseAuthService, AuthState } from '../../services/firebaseAuthService';
import { SyncStatus, QuestionCorrection, MigrationProgress } from '../../types/assessment';

interface FacultyDashboardProps {
  onNavigateHome: () => void;
}

type DashboardSection =
  | 'overview'
  | 'question-bank'
  | 'corrections'
  | 'add-question'
  | 'bulk-import'
  | 'pending-verification'
  | 'approved'
  | 'archived'
  | 'backups'
  | 'audit-logs'
  | 'settings';

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigateHome }) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time Auth and Sync states
  const [authState, setAuthState] = useState<AuthState>(firebaseAuthService.getAuthState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(firebaseQuestionBankService.getSyncStatus());
  const [correctionsList, setCorrectionsList] = useState<QuestionCorrection[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [cloudCount, setCloudCount] = useState<number>(firebaseQuestionBankService.getCloudQuestionCount());
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    firebaseQuestionBankService.initRealtimeSync();

    const unsubAuth = firebaseAuthService.subscribe((state) => {
      setAuthState(state);
    });

    const unsubSync = firebaseQuestionBankService.subscribeSyncStatus((status) => {
      setSyncStatus(status);
      setCloudCount(firebaseQuestionBankService.getCloudQuestionCount());
    });

    const unsubCorrections = firebaseQuestionBankService.subscribeCorrections((list) => {
      setCorrectionsList(list);
    });

    const unsubQuestions = firebaseQuestionBankService.subscribeQuestions(() => {
      setCloudCount(firebaseQuestionBankService.getCloudQuestionCount());
    });

    return () => {
      unsubAuth();
      unsubSync();
      unsubCorrections();
      unsubQuestions();
    };
  }, []);

  const stats = questionBankStore.getStats();
  const pendingCorrectionsCount = correctionsList.filter(
    (c) => c.status === 'Flagged for Correction' || c.status === 'Under Correction'
  ).length;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setCloudCount(firebaseQuestionBankService.getCloudQuestionCount());
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await firebaseAuthService.signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request' &&
        code !== 'auth/popup-blocked' &&
        !msg.includes('Pending promise was never set')
      ) {
        alert(`Google Sign-In notice: ${msg || 'Authentication error'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await firebaseAuthService.signOut();
  };

  const handleRunMigration = async () => {
    // 1. Strict Administrator Authorization Pre-flight check
    if (authState.role !== 'admin') {
      alert(
        'Administrator Access Required: Initial master question bank migration can only be performed by the designated administrator (nikhilprasad9797@gmail.com). You are currently logged in as ' +
          (authState.user ? 'a Faculty Member (' + authState.user.email + ')' : 'an unauthenticated user') +
          '.'
      );
      return;
    }

    setIsMigrating(true);
    setMigrationNotice(null);
    setMigrationProgress({
      stage: 'checking',
      currentBatch: 0,
      totalBatches: 0,
      migratedCount: 0,
      skippedCount: 0,
      message: 'Connecting to Cloud Firestore and verifying existing records...',
    });

    try {
      const performer =
        authState.profile?.displayName || authState.user?.displayName || 'Administrator';
      const res = await firebaseQuestionBankService.migrateInitialBank(
        performer,
        authState.user?.uid,
        (progress) => setMigrationProgress(progress)
      );
      setMigrationNotice(
        `Cloud Migration Successful: ${res.migratedCount} questions migrated, ${res.skippedCount} already in Firestore. Total: ${res.totalInCloud} questions in Cloud Firestore.`
      );
      setCloudCount(firebaseQuestionBankService.getCloudQuestionCount());
      handleRefresh();
    } catch (err: any) {
      setMigrationNotice(`Migration stopped: ${err.message}`);
    } finally {
      setIsMigrating(false);
      setMigrationProgress(null);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'question-bank', label: 'All Questions', count: stats.totalQuestions, icon: Database },
    {
      id: 'corrections',
      label: 'Correction Requests',
      count: pendingCorrectionsCount,
      icon: Flag,
      highlight: pendingCorrectionsCount > 0,
    },
    { id: 'add-question', label: 'Add Question', icon: PlusCircle },
    { id: 'bulk-import', label: 'Bulk Import', icon: UploadCloud },
    { id: 'pending-verification', label: 'Pending Review', count: stats.pendingVerification, icon: Clock },
    { id: 'approved', label: 'Approved (Live)', count: stats.approvedQuestions, icon: CheckCircle2 },
    { id: 'archived', label: 'Archived', count: stats.archivedQuestions, icon: Archive },
    { id: 'backups', label: 'Backups & Recovery', icon: HardDrive, adminOnly: true },
    { id: 'audit-logs', label: 'Audit Trail', icon: Activity, adminOnly: true },
    { id: 'settings', label: 'Assessment Settings', icon: Sliders },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 text-slate-800 text-left">
      {/* Faculty Portal Top Administrative Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand and Portal Identity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Vallabh Classes
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 font-bold uppercase tracking-wider">
                    {authState.role === 'admin' ? 'Super Admin Portal' : 'Faculty Portal'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Maths Assessment System · Hemang Shah Sir
                </div>
              </div>
            </div>

            {/* Action Bar Right: Sync Indicator, Auth User, Navigation */}
            <div className="flex items-center gap-3">
              {/* Real-time Cloud Sync Indicator */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border"
                style={{
                  backgroundColor:
                    syncStatus === 'saved'
                      ? 'rgba(13, 148, 136, 0.15)'
                      : syncStatus === 'empty_cloud'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : syncStatus === 'saving' || syncStatus === 'syncing'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                  borderColor:
                    syncStatus === 'saved'
                      ? 'rgba(13, 148, 136, 0.3)'
                      : syncStatus === 'empty_cloud'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : syncStatus === 'saving' || syncStatus === 'syncing'
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(245, 158, 11, 0.3)',
                  color:
                    syncStatus === 'saved'
                      ? '#2dd4bf'
                      : syncStatus === 'empty_cloud'
                      ? '#fcd34d'
                      : syncStatus === 'saving' || syncStatus === 'syncing'
                      ? '#93c5fd'
                      : '#fcd34d',
                }}
              >
                {syncStatus === 'saved' && (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-teal-400" />
                    <span>Cloud Synced ({cloudCount} in Cloud)</span>
                  </>
                )}
                {syncStatus === 'empty_cloud' && (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cloud: 0 (Local Bank Active)</span>
                  </>
                )}
                {(syncStatus === 'saving' || syncStatus === 'syncing') && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span>{syncStatus === 'saving' ? 'Saving...' : 'Syncing...'}</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Local Bank (Offline)</span>
                  </>
                )}
              </div>

              {/* Real Firebase Authentication Status */}
              {authState.user ? (
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight">
                      {authState.profile?.displayName || authState.user.displayName || authState.user.email || 'Authorized User'}
                    </div>
                    <div className="text-[10px] font-mono flex items-center justify-end gap-1">
                      <span className={authState.role === 'admin' ? 'text-teal-300 font-bold' : 'text-amber-300 font-medium'}>
                        {authState.role === 'admin' ? 'Role: Administrator' : 'Role: Faculty Member'}
                      </span>
                    </div>
                  </div>
                  {authState.role !== 'admin' && (
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/30 transition-colors"
                      title="Switch to Administrator Google account (nikhilprasad9797@gmail.com)"
                    >
                      Admin Sign In
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
                    title="Sign Out of Portal"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white transition-colors cursor-pointer shadow-2xs"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>{isSigningIn ? 'Connecting...' : 'Faculty / Admin Sign In'}</span>
                </button>
              )}

              {/* Security Protocol Status Button */}
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                title="View Firebase Security & Rule Architecture"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Rules: Active</span>
              </button>

              {/* Exit Portal / Back to Student Website */}
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
                <span>Student Site</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs Bar (Desktop) */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-2xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isHighlight = 'highlight' in item && item.highlight;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as DashboardSection)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : isHighlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {'count' in item && item.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-slate-800 text-teal-300'
                          : isHighlight
                          ? 'bg-amber-200 text-amber-900 font-bold'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as DashboardSection);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {'count' in item && item.count !== undefined && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Section Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Data Migration Action Banner */}
        {migrationNotice ? (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{migrationNotice}</span>
            </div>
            <button
              onClick={() => setMigrationNotice(null)}
              className="text-teal-700 hover:text-teal-950 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : cloudCount > 0 ? (
          <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <HardDrive className="w-4 h-4 text-teal-700" />
                <span>Cloud Question Bank Synchronized</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-teal-200 text-teal-900 font-bold">
                  {cloudCount} Live in Firestore
                </span>
              </div>
              <p className="text-teal-800 text-[11px]">
                Central Cloud Firestore database is active and populated. Live student assessments are backed by persistent cloud documents.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-mono text-xs font-semibold text-center whitespace-nowrap">
              Cloud Ready
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <HardDrive className="w-4 h-4 text-teal-700" />
                <span>Central Cloud Question Bank Initialization</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-amber-100 text-amber-900 font-bold">
                  0 in Cloud · Local Bank Active (100)
                </span>
              </div>

              {authState.role === 'admin' ? (
                <p className="text-xs text-slate-600">
                  You are authenticated as <strong>Administrator</strong> ({authState.user?.email}). Cloud Firestore has not yet been populated. Click below to migrate the 100 master questions into Cloud Firestore.
                </p>
              ) : authState.user ? (
                <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <strong>Administrator Authorization Required:</strong> You are currently signed in as a <strong>Faculty Member</strong> ({authState.user.email}). Initial cloud database migration is restricted to Administrator (<strong>nikhilprasad9797@gmail.com</strong>).
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Cloud Firestore contains 0 questions. Please sign in with Google as Administrator (<strong>nikhilprasad9797@gmail.com</strong>) to initialize the cloud question bank.
                </p>
              )}

              {/* Real-time Migration Progress Indicator */}
              {isMigrating && migrationProgress && (
                <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-teal-300 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      {migrationProgress.message}
                    </span>
                    {migrationProgress.totalBatches > 0 && (
                      <span className="font-mono text-slate-400">
                        Batch {migrationProgress.currentBatch} of {migrationProgress.totalBatches}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-400 h-full transition-all duration-300"
                      style={{
                        width: `${
                          migrationProgress.totalBatches > 0
                            ? Math.min(100, Math.round((migrationProgress.currentBatch / migrationProgress.totalBatches) * 100))
                            : 10
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {authState.role === 'admin' ? (
                <button
                  onClick={handleRunMigration}
                  disabled={isMigrating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-800 hover:bg-teal-700 text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Migrating Questions...' : 'Sync 100 Questions to Firestore'}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
                  title="Only Administrator (nikhilprasad9797@gmail.com) can trigger migration"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{authState.user ? 'Admin Authorization Required' : 'Admin Sign-In Required'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Section Routing */}
        {activeSection === 'overview' && (
          <FacultyOverview
            stats={stats}
            cloudCount={cloudCount}
            isCloudSynchronized={cloudCount > 0}
            onNavigateSection={(sec) => setActiveSection(sec as DashboardSection)}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeSection === 'question-bank' && (
          <QuestionBankManager
            key={`all-${refreshKey}`}
            initialStatusFilter="All"
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onRefresh={handleRefresh}
          />
        )}

        {activeSection === 'corrections' && (
          <CorrectionRequestsView onRefresh={handleRefresh} />
        )}

        {activeSection === 'add-question' && (
          <AddQuestionForm
            onQuestionAdded={() => {
              handleRefresh();
              setActiveSection('question-bank');
            }}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeSection === 'bulk-import' && (
          <BulkImportView
            onImportCompleted={() => {
              handleRefresh();
            }}
          />
        )}

        {activeSection === 'pending-verification' && (
          <QuestionBankManager
            key={`pending-${refreshKey}`}
            initialStatusFilter="Pending Verification"
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onRefresh={handleRefresh}
          />
        )}

        {activeSection === 'approved' && (
          <QuestionBankManager
            key={`approved-${refreshKey}`}
            initialStatusFilter="Approved"
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onRefresh={handleRefresh}
          />
        )}

        {activeSection === 'archived' && (
          <QuestionBankManager
            key={`archived-${refreshKey}`}
            initialStatusFilter="Archived"
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onRefresh={handleRefresh}
          />
        )}

        {activeSection === 'backups' && <BackupManagerView />}

        {activeSection === 'audit-logs' && <AuditLogsView />}

        {activeSection === 'settings' && <AssessmentSettingsManager />}
      </main>

      {/* Backend Security Protocol Modal */}
      <BackendSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};
