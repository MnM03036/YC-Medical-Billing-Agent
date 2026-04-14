"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UrgencyDashboard() {
  const [appeals, setAppeals] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAppeals() {
      // Sort dynamically by the closest deadline (Task 5.2 constraints)
      const { data } = await supabase
        .from('appeals')
        .select(`
           id, patient_state, insurance_plan_type, denial_date, deadline_date, status, created_at,
           legal_frameworks(applicable_law)
        `)
        .order('deadline_date', { ascending: true });
        
      if (data) setAppeals(data);
    }
    fetchAppeals();
  }, []);

  const getUrgencyColor = (deadline: string) => {
    if (!deadline) return 'bg-slate-100 text-slate-800';
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (daysLeft <= 14) return 'bg-red-100 text-red-700 border-red-200';
    if (daysLeft <= 30) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/' }>
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight">Appeals Pipeline<span className="text-indigo-600">.</span></span>
        </div>
        <div className="flex gap-4">
          <Link href="/appeals" className="text-sm font-medium hover:text-indigo-600 border border-slate-300 px-4 py-2 rounded-lg transition-colors">Start New Appeal</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-12 mb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Active Deadlines <Clock className="inline w-6 h-6 ml-1 text-slate-400"/></h1>
          <p className="text-slate-500 mt-2">Appeals are automatically sorted by statutory urgency.</p>
        </div>

        <div className="grid gap-4">
          {appeals.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
               No appeals tracked. Create one to begin generating legal templates.
            </div>
          ) : appeals.map((app) => {
            const isSent = app.status === 'Sent';
            
            return (
              <div key={app.id} className={`p-6 rounded-2xl border ${isSent ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                <div className="flex gap-4 items-center">
                  <div className={`px-4 py-2 rounded-xl text-center border ${isSent ? 'bg-slate-100 text-slate-500 border-slate-200' : getUrgencyColor(app.deadline_date)}`}>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">Deadline</div>
                    <div className="text-lg font-extrabold">{new Date(app.deadline_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{app.insurance_plan_type}</h3>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold">{app.patient_state}</span>
                      <span>Denied: {new Date(app.denial_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center md:min-w-[200px] justify-end">
                   {isSent ? (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold px-4 py-2 bg-emerald-50 rounded-lg">
                       <Mail className="w-5 h-5" /> Submitted
                     </div>
                   ) : (
                     <Link href={`/appeals/review/${app.id}`} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition w-full md:w-auto text-center flex items-center justify-center gap-2">
                       Take Action <ArrowRight className="w-4 h-4" />
                     </Link>
                   )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
}
