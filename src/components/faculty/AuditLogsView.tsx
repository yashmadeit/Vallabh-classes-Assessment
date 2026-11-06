import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  User,
  ShieldCheck,
  Search,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { AuditLog } from '../../types/assessment';
import { firebaseQuestionBankService } from '../../services/firebaseQuestionBankService';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const list = await firebaseQuestionBankService.getAuditLogs();
      setLogs(list);
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            System Compliance & Integrity
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Immutable Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chronological record of question modifications, approvals, issue reports, and database restorations.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter audit logs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filteredLogs.length} Events Logged
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Activity className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-800 text-sm">No Audit Events</div>
            <p className="text-xs text-slate-500">
              Audit events are recorded when questions are edited, flagged, approved, or restored.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-teal-300">
                      {log.action}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">{log.targetId}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                  {log.details}
                </p>
                <div className="text-[10px] text-slate-400">
                  Performed by: <span className="font-semibold text-slate-600">{log.performedBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
