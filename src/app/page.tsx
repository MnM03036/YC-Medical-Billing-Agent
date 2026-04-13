import React from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-20">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">BillAuditor<span className="text-blue-600">.</span></span>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:text-blue-600 transition-colors">Documentation</button>
          <button className="text-sm font-medium hover:text-blue-600 transition-colors">Settings</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Column: Hero & Upload */}
        <div className="space-y-8">
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

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group bg-white shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drag & drop your medical bill</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Supports PDF, PNG, and JPG. All PII is processed locally or securely transmitted.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95">
              Select File to Audit
            </button>
          </div>
        </div>

        {/* Right Column: Empty Results Dashboard / Placeholder */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-slate-400" />
              Audit Results
            </h2>
            <span className="text-sm px-3 py-1 bg-slate-100 text-slate-500 rounded-full font-medium">
              Waiting for input
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse" />
              <ShieldCheck className="w-20 h-20 text-slate-300 relative z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">No bill audited yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                Upload a document to the left to initiate the automated OCR and AI analysis pipeline.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-8 opacity-40 grayscale pointer-events-none">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">Potential Upcoding</div>
                  <div className="text-xs text-slate-500 mt-1">Checking against benchmarks</div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">Valid Charges</div>
                  <div className="text-xs text-slate-500 mt-1">Verifying CPT codes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
