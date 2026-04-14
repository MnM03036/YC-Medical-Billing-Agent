"use client";

import React, { useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, ShieldCheck, Loader2, Download, DollarSign, Activity } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { processFileForOCR, extractStructuredData } from '@/utils/ocr';

export default function Home() {
  const [auditFile, setAuditFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  
  // States spanning Phase 2, 4, 5
  const [structuredData, setStructuredData] = useState<any>(null);
  const [auditReport, setAuditReport] = useState<any>(null);

  const handleRunAuditPhase = async () => {
    if (!auditFile) return;
    setIsProcessing(true);
    setOcrError(null);
    try {
      // PHASE 2
      const rawText = await processFileForOCR(auditFile, setOcrProgress);
      if (rawText.trim().length < 20) {
         setOcrError("Document appears blank, blurry, or unreadable.");
         setIsProcessing(false); return;
      }
      setOcrProgress("Structuring Data...");
      const parsed = extractStructuredData(rawText);
      setStructuredData(parsed);

      // PHASE 4
      setOcrProgress("Running AI Evaluation...");
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, structuredData: parsed })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI Audit request failed.");
      
      setAuditReport(data);

    } catch (err: any) {
      setOcrError(err.message || "An error occurred.");
    } finally {
      setIsProcessing(false);
      setOcrProgress('');
    }
  };

  const getTagColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'upcoding': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'unbundling': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'duplicate': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'phantom': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-20 print:bg-white print:pb-0">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">BillAuditor<span className="text-blue-600">.</span></span>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:text-blue-600 transition-colors">Documentation</button>
          <button className="text-sm font-medium hover:text-blue-600 transition-colors">Settings</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 print:block print:w-full print:mt-4">
        
        {/* Left Column */}
        <div className="space-y-8 print:hidden">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Audit Medical Bills <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                with AI Precision.
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              Upload your medical bills securely. Our AI cross-references procedures with Medicare benchmarks to detect upcoding, unbundling, and duplicate charges in seconds.
            </p>
          </div>

          <FileUpload onFileSelect={(file) => {
            setAuditFile(file);
            setStructuredData(null);
            setAuditReport(null);
            setOcrError(null);
          }} />
        </div>

        {/* Right Column / Print Area */}
        <div className={`bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full min-h-[500px] print:shadow-none print:border-none print:p-0 ${auditReport ? 'print:block' : ''}`}>
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 print:mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {auditReport ? <Activity className="w-6 h-6 text-blue-500" /> : <FileText className="w-6 h-6 text-slate-400" />}
              {auditReport ? 'Official Audit Report' : 'Audit Pipeline'}
            </h2>
            <span className={`text-sm px-3 py-1 rounded-full font-medium print:hidden ${auditReport ? 'bg-emerald-100 text-emerald-700' : auditFile ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              {auditReport ? 'Audit Complete' : auditFile ? 'File ready' : 'Waiting for input'}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            
            {/* Initial State */}
            {!auditFile && (
              <div className="space-y-6">
                <div className="relative mx-auto w-20 h-20 flex justify-center items-center">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse" />
                  <ShieldCheck className="w-16 h-16 text-slate-300 relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-700">No bill audited yet</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm">
                    Upload a document to the left to initiate the automated OCR and AI analysis pipeline.
                  </p>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
               <div className="space-y-6 flex flex-col items-center w-full">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-2" />
                  <h3 className="font-semibold text-xl text-blue-900 animate-pulse">{ocrProgress || 'Analyzing...'}</h3>
               </div>
            )}

            {/* Error State */}
            {ocrError && !isProcessing && (
               <div className="w-full text-left bg-red-50 p-6 rounded-2xl border border-red-100 text-red-800">
                 <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                 <h3 className="font-bold text-lg mb-1">Extraction Failed</h3>
                 <p className="text-sm opacity-90">{ocrError}</p>
                 <button onClick={() => setOcrError(null)} className="mt-4 text-sm font-medium underline">Dismiss</button>
               </div>
            )}

            {/* Audit Ready to Run */}
            {auditFile && !isProcessing && !ocrError && !auditReport && (
                <div className="space-y-6 w-full mt-auto mb-auto">
                  <div className="p-8 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
                    <h3 className="font-semibold text-lg text-blue-900">File Staged Successfully</h3>
                    <p className="text-blue-700 mt-2 max-w-sm">
                      We're ready to perform visual extraction and semantic AI mapping against Medicare standards.
                    </p>
                  </div>
                  <button onClick={handleRunAuditPhase} className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95 text-lg">
                    Execute Full AI Audit
                  </button>
                </div>
            )}

            {/* Final Report (Phase 5) */}
            {auditReport && !isProcessing && (
              <div className="w-full text-left flex flex-col h-full animate-in fade-in zoom-in duration-500">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2 opacity-90">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Total Potential Savings</span>
                  </div>
                  <h2 className="text-5xl font-bold">${auditReport.totalPotentialSavings.toFixed(2)}</h2>
                  <p className="mt-3 text-emerald-100 text-sm leading-relaxed">{auditReport.auditSummary}</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-4">
                  <h3 className="font-bold border-b pb-2 text-slate-800 flex justify-between">
                    Detected Anomalies
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{auditReport.flags?.length || 0} Flags</span>
                  </h3>
                  
                  {auditReport.flags?.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 border border-dashed rounded-xl border-slate-200">
                      No billing anomalies detected. Charges appear inline with standards.
                    </div>
                  ) : (
                    auditReport.flags?.map((flag: any, i: number) => (
                      <div key={i} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3 relative overflow-hidden group hover:border-slate-300 transition-colors">
                         <div className="flex justify-between items-start">
                           <div className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border ${getTagColor(flag.errorType)}`}>
                             {flag.errorType}
                           </div>
                           <div className="text-right">
                             <div className="text-lg font-bold text-slate-800">${flag.billedAmount}</div>
                             <div className="text-xs text-slate-500 font-medium">Billed</div>
                           </div>
                         </div>
                         <p className="text-sm text-slate-700 leading-relaxed">
                           {flag.explanation}
                         </p>
                         <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                           {flag.cptCode && <span>CPT: <span className="text-slate-800">{flag.cptCode}</span></span>}
                           <span>Benchmark: <span className="text-emerald-600">${flag.correctAmount}</span></span>
                           <span className="text-indigo-600">Savings: +${flag.potentialSavings}</span>
                         </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 print:hidden flex gap-3">
                  <button onClick={() => window.print()} className="w-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold py-3.5 rounded-xl shadow-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Export PDF
                  </button>
                  <button onClick={() => {
                      setAuditFile(null); 
                      setAuditReport(null);
                    }} className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl shadow-sm hover:bg-slate-800 transition-colors">
                    Start New Audit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
