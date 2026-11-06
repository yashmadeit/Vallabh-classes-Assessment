import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
  Send,
  Eye
} from 'lucide-react';
import { CsvImportPreviewItem, VerifiedQuestion } from '../../types/assessment';
import { questionBankStore } from '../../services/questionBankStore';
import { QuestionPreviewModal } from './QuestionPreviewModal';

interface BulkImportViewProps {
  onImportCompleted?: (count: number) => void;
}

export const BulkImportView: React.FC<BulkImportViewProps> = ({ onImportCompleted }) => {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<CsvImportPreviewItem[]>([]);
  const [targetStatus, setTargetStatus] = useState<'Pending Verification' | 'Draft'>('Pending Verification');
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [inspectedQuestion, setInspectedQuestion] = useState<VerifiedQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent = questionBankStore.generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vallabh_classes_maths_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        processParsedCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteProcess = () => {
    if (!csvText.trim()) return;
    processParsedCsv(csvText);
  };

  const processParsedCsv = (text: string) => {
    const items = questionBankStore.parseCsv(text);
    setPreviewItems(items);
    setActiveTab('preview');
    setImportResult(null);
  };

  const handleConfirmImport = () => {
    const validItems = previewItems
      .filter((item) => item.isValid && item.parsedQuestion)
      .map((item) => {
        const { id, createdAt, updatedAt, ...rest } = item.parsedQuestion!;
        return rest;
      });

    if (validItems.length === 0) return;

    const result = questionBankStore.bulkImport(validItems, targetStatus);
    setImportResult({ count: result.importedCount, errors: result.errors });

    if (onImportCompleted) {
      onImportCompleted(result.importedCount);
    }
  };

  const validCount = previewItems.filter((i) => i.isValid).length;
  const invalidCount = previewItems.filter((i) => !i.isValid).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-left space-y-7">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Batch Assessment Operations
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Bulk Question Import (CSV Only)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated schema validation, duplicate detection, and staging for Hemang Shah Sir's question bank.
          </p>
          <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Format Notice: Only standard CSV (.csv, .txt) files are supported. Binary Excel (.xlsx/.xls) is not supported; please save or export your spreadsheet as CSV before importing.</span>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-teal-700" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Import Status Alert */}
      {importResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            importResult.count > 0 ? 'bg-teal-50 border-teal-200 text-teal-950' : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                Import Complete: {importResult.count} Questions Staged as "{targetStatus}"
              </div>
              <p className="text-xs mt-0.5 text-teal-800">
                In compliance with security protocols, bulk-imported questions are placed in Draft or Pending Verification and never published directly to live assessments without manual review.
              </p>
              {importResult.errors.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-[11px] text-red-700 space-y-0.5">
                  {importResult.errors.map((err, eIdx) => (
                    <li key={eIdx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>1. Upload or Paste CSV</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          disabled={previewItems.length === 0}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : previewItems.length === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. Inspection & Row Validation ({previewItems.length})</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {fileName ? `Selected file: ${fileName}` : 'Click to browse or drag and drop your CSV file (.csv only)'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Expected CSV columns: class, board, subject, chapter, topic, difficulty, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, source, sourceReference. (Binary XLSX is not supported).
              </p>
            </div>
          </div>

          {/* Alternative: Raw CSV Paste */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Or Paste Raw CSV Data Directly
              </label>
              <button
                type="button"
                onClick={() => {
                  setCsvText(questionBankStore.generateSampleCsvTemplate());
                }}
                className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                Insert Sample Data
              </button>
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste comma-separated rows with header line..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasteProcess}
                disabled={!csvText.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Parse & Validate Data →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROW PREVIEW & VALIDATION */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500 uppercase font-semibold text-[10px]">Total Parsed Rows</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{previewItems.length}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40">
              <span className="text-teal-800 uppercase font-semibold text-[10px]">Valid for Staging</span>
              <div className="text-xl font-bold font-mono text-teal-700 mt-0.5">{validCount}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40">
              <span className="text-red-800 uppercase font-semibold text-[10px]">Rows with Errors</span>
              <div className="text-xl font-bold font-mono text-red-700 mt-0.5">{invalidCount}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500 uppercase font-semibold text-[10px]">Target Staging Status</span>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full mt-1 text-xs font-bold bg-white border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="Pending Verification">Pending Verification</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Table of Rows */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Chapter</th>
                    <th className="py-2.5 px-3">Question Statement</th>
                    <th className="py-2.5 px-2 text-center">Correct</th>
                    <th className="py-2.5 px-3">Validation Diagnostics</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.map((item) => (
                    <tr
                      key={item.rowNumber}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !item.isValid ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">
                        #{item.rowNumber}
                      </td>

                      <td className="py-3 px-3">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Error</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {item.raw.chapter || '—'}
                      </td>

                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={item.raw.question}>
                        {item.raw.question}
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                        {item.raw.correctAnswer || '—'}
                      </td>

                      <td className="py-3 px-3">
                        {item.errors.length > 0 ? (
                          <ul className="text-[11px] text-red-700 space-y-0.5">
                            {item.errors.map((err, eIdx) => (
                              <li key={eIdx}>• {err.message}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Source: {item.raw.source} ({item.raw.sourceReference})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {item.parsedQuestion && (
                          <button
                            onClick={() => setInspectedQuestion(item.parsedQuestion!)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Import Bottom Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-700 font-semibold">
                Ready to stage <strong className="text-teal-800">{validCount} valid question(s)</strong> into the repository?
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staged questions will be labeled as "{targetStatus}". Only authorised faculty can approve questions for student tests.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('upload')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Change File
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Import ({validCount} Questions)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      <QuestionPreviewModal
        question={inspectedQuestion}
        onClose={() => setInspectedQuestion(null)}
      />
    </div>
  );
};
