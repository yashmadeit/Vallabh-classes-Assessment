import React from 'react';
import { X, ShieldCheck, ShieldAlert, Key, Database, Server, CheckCircle2, Lock } from 'lucide-react';

interface BackendSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendSecurityModal: React.FC<BackendSecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Faculty Authorization & Security Architecture</h3>
              <p className="text-xs text-slate-300">Backend Authentication Requirements for Vallabh Classes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700 text-left">
          {/* Current Security Mode */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Current Security Status: Local Sandbox / Public Audit Mode</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              In accordance with security standards, <strong>hardcoded frontend PINs and client-side password checks have been completely eradicated</strong>. A client-side PIN compiled into JavaScript can be inspected or bypassed in seconds via browser DevTools.
            </p>
            <p className="text-amber-800 leading-relaxed">
              Consequently, in this public application, question additions and CSV imports run in a <strong>protected local sandbox</strong> for testing and staging. Direct publishing to the production database is locked until backend authentication is configured.
            </p>
          </div>

          {/* Three Pillars of Future Firebase Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Required Backend Authorization Protocol (Firebase)
            </h4>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Key className="w-3.5 h-3.5 text-teal-600" />
                  <span>1. Firebase Auth</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Google OAuth or MFA login restricted to Hemang Shah Sir’s verified email address.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Server className="w-3.5 h-3.5 text-teal-600" />
                  <span>2. Custom Claims</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Server-side cryptographic token claims: <code className="bg-slate-200 px-1 rounded text-teal-900 font-mono">role: 'faculty'</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>3. Firestore Rules</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Strict database rules: <code className="bg-slate-200 px-1 rounded text-teal-900 font-mono">request.auth.token.role == 'faculty'</code> required for question mutations.
                </p>
              </div>
            </div>
          </div>

          {/* Architecture Code Snippet */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-900">Firestore Rules Architecture:</span>
            <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// Cloud Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public Students: Read-only access to Approved questions
    match /question_bank/{questionId} {
      allow read: if resource.data.verificationStatus == 'Approved'
                  || (request.auth != null && request.auth.token.role == 'faculty');
      allow write: if request.auth != null && request.auth.token.role == 'faculty';
    }
    // Teacher Remarks: Only authorized faculty
    match /assessment_results/{resultId} {
      allow read: if true;
      allow update: if request.auth != null && request.auth.token.role == 'faculty';
    }
  }
}`}
            </pre>
          </div>

          {/* Safe Faculty Workflow */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
            <div className="font-bold text-teal-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Available Sandbox Actions in this Release</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-teal-900 space-y-1">
              <li>Manual question creation with mathematical formula previews</li>
              <li>Bulk CSV import with row-by-row error validation and duplicate detection</li>
              <li>Sample CSV template generation and download</li>
              <li>Staging questions as <strong>Draft</strong> or <strong>Pending Verification</strong></li>
              <li>Filterable question bank inspection across Class 10 CBSE syllabus</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Vallabh Classes Security & Compliance</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
