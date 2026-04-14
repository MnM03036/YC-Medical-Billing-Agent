"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, ShieldAlert, Send, Download, ArrowLeft, Calendar, Scale } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AppealReview() {
  const params = useParams();
  const appealId = params.id as string;
  const [appeal, setAppeal] = useState<any>(null);
  const [classification, setClassification] = useState<any>(null);
  const [framework, setFramework] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!appealId) return;

      const { data: appData } = await supabase.from('appeals').select('*').eq('id', appealId).single();
      if (appData) {
        setAppeal(appData);
        
        // Fetch framework
        const { data: fmData } = await supabase.from('legal_frameworks').select('*').eq('id', appData.legal_framework_id).single();
        setFramework(fmData);

        // Fetch classification
        const { data: clsData } = await supabase.from('denial_classifications').select('*').eq('appeal_id', appealId).single();
        setClassification(clsData);
      }
    }
    loadData();
  }, [appealId]);

  const handleSend = async () => {
    try {
      const res = await fetch('/api/send-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'provider-appeals@insurance.com', appealId })
      });
      if (!res.ok) throw new Error("Failed to send");
      alert("Appeal sent successfully via Resend API!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (!appeal || !framework || !classification) {
    return <div className="p-20 text-center animate-pulse">Loading Appeal Data Engine...</div>;
  }

  // Highlight logic parsing occurrences of the exact laws
  const highlightLaw = (text: string, law: string) => {
    if (!text || !law) return text;
    const parts = text.split(new RegExp(`(${law})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === law.toLowerCase() ? 
          <span key={i} className="bg-indigo-100 text-indigo-900 font-bold px-1 rounded">{part}</span> 
          : part
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/appeals' }>
          <ArrowLeft className="w-6 h-6 text-slate-500 hover:text-slate-900 transition-colors" />
          <span className="text-xl font-bold tracking-tight">Review Appeal<span className="text-indigo-600">.</span></span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12 print:block print:w-full print:mt-0">
        
        {/* Left Sidebar: Logic Transparency */}
        <div className="space-y-6 lg:col-span-1 print:hidden">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-indigo-900">
              <Scale className="w-5 h-5 text-indigo-600" />
              Determinant Jurisdiction
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Based on the <strong>{appeal.patient_state}</strong> state and the <strong>{appeal.insurance_plan_type}</strong> plan type, this appeal strictly falls under:
            </p>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 font-semibold text-indigo-800 text-sm">
              {framework.applicable_law}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              AI Denial Output
            </h3>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded inline-block mb-2">
              {classification.classified_reason}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>Rationale:</strong> {classification.ai_rationale}
            </p>
            <div className="text-xs text-slate-400 mt-2">Confidence: {(classification.confidence_score * 100).toFixed(0)}%</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
             <h3 className="font-bold flex items-center gap-2 text-emerald-900">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Statutory Deadline
            </h3>
            <p className="text-sm text-slate-600">The insurance company must receive this appeal by exactly:</p>
            <div className="text-xl font-bold text-emerald-700">
              {new Date(appeal.deadline_date).toLocaleDateString()}
            </div>
            <p className="text-xs text-slate-500">Based on a {framework.statutory_deadline_days}-day statutory window.</p>
          </div>
        </div>

        {/* Right Editor */}
        <div className="lg:col-span-2">
           <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-200 min-h-[600px] flex flex-col justify-between print:shadow-none print:border-none print:p-0">
             
             <div className="prose prose-slate max-w-none text-sm leading-relaxed pb-8">
               <h2 className="mb-6 border-b pb-2">Formal Letter of Appeal</h2>
               <div className="whitespace-pre-wrap font-serif text-slate-800">
                 {highlightLaw(appeal.ai_generated_appeal_draft, framework.applicable_law)}
               </div>
             </div>

             <div className="flex gap-4 border-t border-slate-100 pt-6 print:hidden">
               <button onClick={handleSend} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                 <Send className="w-5 h-5" /> Dispatch via Resend 
               </button>
               <button onClick={handleDownload} className="flex-1 bg-white text-slate-700 border border-slate-300 font-bold py-4 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2">
                 <Download className="w-5 h-5" /> Download PDF
               </button>
             </div>
           </div>
        </div>

      </main>
    </div>
  );
}
