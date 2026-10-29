import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export const WhatIfSimulatorView: React.FC = () => {
  // Simulator State Inputs
  const [facultyCount, setFacultyCount] = useState(32);
  const [studentIntake, setStudentIntake] = useState(600);
  const [landArea, setLandArea] = useState(3.2); // acres
  const [fireNocValid, setFireNocValid] = useState(true);
  const [fdrAmount, setFdrAmount] = useState(35); // lakhs INR
  const [pwdSafetyValid, setPwdSafetyValid] = useState(true);

  // Compute metrics
  const sfr = studentIntake / (facultyCount || 1);
  const sfrCompliant = sfr <= 20.0;
  const landCompliant = landArea >= 2.5;
  const fdrCompliant = fdrAmount >= 35;

  // Calculate simulated risk score (0 to 100, where lower is better)
  let riskScore = 12.0; // baseline
  const deficiencies: string[] = [];
  const clearances: string[] = [];

  if (!sfrCompliant) {
    riskScore += 28.0;
    deficiencies.push(`Student-Faculty Ratio (1:${sfr.toFixed(1)}) violates AICTE norm (<= 1:20).`);
  } else {
    clearances.push(`Student-Faculty Ratio (1:${sfr.toFixed(1)}) complies with Chapter 4 norms.`);
  }

  if (!landCompliant) {
    riskScore += 35.0;
    deficiencies.push(`Contiguous land area (${landArea} acres) is below statutory 2.50 acres threshold.`);
  } else {
    clearances.push(`Land area (${landArea} acres) meets contiguous unencumbered norms.`);
  }

  if (!fireNocValid) {
    riskScore += 40.0;
    deficiencies.push('Fire NOC certificate is expired or invalid under Municipal Fire Safety Act.');
  } else {
    clearances.push('Fire NOC certificate verified unexpired.');
  }

  if (!fdrCompliant) {
    riskScore += 18.0;
    deficiencies.push(`FDR security deposit (₹${fdrAmount} Lakhs) is below required ₹35 Lakhs lock-in.`);
  } else {
    clearances.push(`FDR security deposit (₹${fdrAmount} Lakhs) satisfies AICTE joint escrow requirement.`);
  }

  if (!pwdSafetyValid) {
    riskScore += 25.0;
    deficiencies.push('PWD structural stability certificate is missing or unverified.');
  } else {
    clearances.push('PWD structural stability certificate verified compliant.');
  }

  riskScore = Math.min(100, Math.max(5, riskScore));

  const readinessScore = (100 - riskScore);
  const isSubmissionReady = riskScore < 30.0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              What-If Regulatory Readiness Simulator
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
              Interactive Pre-Check
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate institutional parameters against the AICTE Approval Process Handbook (APH 2026-27) before formal dossier submission.
          </p>
        </div>
      </div>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Institutional Parameter Modeler
          </h3>

          <div className="space-y-5">
            {/* Faculty Count Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Total Approved Faculty Count:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{facultyCount} Faculty</span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                value={facultyCount}
                onChange={(e) => setFacultyCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-400">
                Minimum SFR standard requires 1 faculty per 20 students.
              </span>
            </div>

            {/* Student Intake Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Sanctioned Student Intake:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{studentIntake} Students</span>
              </div>
              <input
                type="range"
                min={240}
                max={1200}
                step={60}
                value={studentIntake}
                onChange={(e) => setStudentIntake(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Calculated SFR: <strong>1:{sfr.toFixed(1)}</strong></span>
                <span className={sfrCompliant ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {sfrCompliant ? 'Compliant (<= 1:20)' : 'Deficient (> 1:20)'}
                </span>
              </div>
            </div>

            {/* Land Area Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Contiguous Land Area:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{landArea.toFixed(1)} Acres</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={6.0}
                step={0.1}
                value={landArea}
                onChange={(e) => setLandArea(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className={landCompliant ? 'text-[11px] text-emerald-600 font-medium' : 'text-[11px] text-rose-600 font-medium'}>
                {landCompliant ? '✓ Meets 2.50 acre statutory norm' : '✗ Below 2.50 acre statutory norm'}
              </span>
            </div>

            {/* FDR Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Joint Security Deposit (FDR):</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">₹{fdrAmount} Lakhs</span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={fdrAmount}
                onChange={(e) => setFdrAmount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className={fdrCompliant ? 'text-[11px] text-emerald-600 font-medium' : 'text-[11px] text-rose-600 font-medium'}>
                {fdrCompliant ? '✓ Satisfies ₹35L joint deposit norm' : '✗ Deficit below ₹35L norm'}
              </span>
            </div>

            {/* Boolean Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fireNocValid}
                  onChange={(e) => setFireNocValid(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Fire Safety NOC</span>
                  <span className="text-[10px] text-slate-400">State Fire Services valid certificate</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pwdSafetyValid}
                  onChange={(e) => setPwdSafetyValid(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">PWD Stability Certificate</span>
                  <span className="text-[10px] text-slate-400">Executive Engineer structural clearance</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcomes Column (1 col) */}
        <div className="space-y-4">
          {/* Predicted Readiness Gauge */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-center">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Predicted Dossier Readiness
            </span>

            <div className="py-2">
              <div
                className={`text-4xl font-black font-mono ${
                  isSubmissionReady ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {readinessScore.toFixed(0)}%
              </div>
              <span
                className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${
                  isSubmissionReady
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {isSubmissionReady ? 'PRE-CHECK PASSED' : 'HIGH RISK OF DEFICIENCY'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">Predicted AI Risk Score:</span>
                <span className="font-bold text-slate-900 dark:text-white">{riskScore.toFixed(1)} / 100</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">Expected Scrutiny SLA:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isSubmissionReady ? '3.5 Days' : 'Inspection Required'}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Feedback list */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Statutory Findings ({deficiencies.length} Deficiencies, {clearances.length} Clearances)
            </h4>

            {deficiencies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Items to Remedy:</span>
                {deficiencies.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Verified Standards:</span>
              {clearances.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

