"use client";

import React, { useState } from 'react';
import { ShieldCheck, Calendar, MapPin, Briefcase, FileText, ArrowRight } from 'lucide-react';

export default function AppealsGenerator() {
  const [formData, setFormData] = useState({
    state: 'CA',
    planType: 'Employer (Self-Funded/ERISA)',
    denialDate: '',
    rawText: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const planTypes = [
    "Employer (Self-Funded/ERISA)",
    "ACA Marketplace",
    "Medicare / Medicaid",
    "Surprise Billing (OON)"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert("Database Error: " + (data.error || "Failed to submit."));
      } else {
        setSubmitSuccess(data.id);
      }
    } catch (err: any) {
      alert("Network Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAppeal = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/generate-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId: submitSuccess })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      // Navigate to review interface (Phase 6)
      window.location.href = `/appeals/review/${submitSuccess}`;
    } catch (err: any) {
      alert("Generation Error: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/' }>
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight">BillAuditor<span className="text-indigo-600">.</span></span>
        </div>
        <div className="flex gap-4">
          <a href="/" className="text-sm font-medium hover:text-indigo-600 transition-colors border border-slate-300 px-4 py-2 rounded-lg">Back to Auditing</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 mt-12 mb-20">
        <div className="space-y-4 mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Generate Appeal <span className="text-indigo-600">Letter.</span>
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Determine standard jurisdictional constraints and generate a robust, legally grounded appeal letter based on your denial notice.
          </p>
        </div>

        {submitSuccess ? (
          <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldCheck className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold text-emerald-900">Appeals Data Submitted</h2>
             <p className="text-emerald-700">Your denial information has been ingested into the database.</p>
             <div className="pt-4">
               <button disabled={isSubmitting} onClick={handleGenerateAppeal} className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 transition">
                 {isSubmitting ? 'Processing AI Rules...' : 'Start AI Rule Engine & Draft Letter'}
               </button>
               <button onClick={() => setSubmitSuccess(null)} className="ml-4 px-6 py-3 text-emerald-700 font-medium hover:underline">
                 Cancel
               </button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Patient State
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  required
                >
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Denial Date
                </label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={formData.denialDate}
                  onChange={e => setFormData({...formData, denialDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" /> Insurance Plan Type
              </label>
              <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={formData.planType}
                  onChange={e => setFormData({...formData, planType: e.target.value})}
                  required
                >
                  {planTypes.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Raw Denial Text
              </label>
              <textarea 
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                placeholder="Paste the raw reasoning text from the EOB or Letter..."
                value={formData.rawText}
                onChange={e => setFormData({...formData, rawText: e.target.value})}
                required
              />
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2">
              {isSubmitting ? 'Ingesting...' : 'Ingest & Determine Laws'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
