import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { UtilityBar, GovFooter, AshokaEmblem } from '../components/design-system';
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

const PAGE_DATA: Record<string, { title: string; subtitle: string; sections: { heading: string; body: string }[] }> = {
  '/policies': {
    title: 'Website Policies & Data Protection',
    subtitle: 'Regulatory guidelines governing digital document handling under SATYAPAN.',
    sections: [
      {
        heading: 'Encrypted Storage Policy',
        body: 'All institutional documents uploaded to SATYAPAN are stored in an AES-256-GCM encrypted vault. Decryption occurs strictly in-memory during authorized scrutiny sessions.'
      },
      {
        heading: 'Privacy & Retention Mandate',
        body: 'In accordance with digital data protection principles, non-essential PII is masked, and access logs are immutably preserved in the cryptographic audit trail for regulatory accountability.'
      }
    ]
  },
  '/accessibility': {
    title: 'Accessibility Statement',
    subtitle: 'Commitment to universal accessibility under GIGW and WCAG 2.1 AA standards.',
    sections: [
      {
        heading: 'Compliance Level',
        body: 'SATYAPAN complies with WCAG 2.1 Level AA standards, featuring high-contrast modes, dynamic font resizing (A-, A, A+), keyboard navigation, and full screen reader accessibility.'
      },
      {
        heading: 'Assistive Technologies',
        body: 'All UI components provide descriptive ARIA attributes, semantic headings, and skip-to-content links for rapid keyboard traversal.'
      }
    ]
  },
  '/terms': {
    title: 'Terms of Use & Regulatory Framework',
    subtitle: 'Statutory rules governing technical education approvals and scrutiny submissions.',
    sections: [
      {
        heading: 'Institutional Submissions',
        body: 'Submitting institutions certify that all uploaded credentials, certificates, and infrastructure declarations are authentic and unaltered.'
      },
      {
        heading: 'Regulatory Decision Authority',
        body: 'AI-assisted findings are strictly advisory. Final decisions are authorized exclusively by designated AICTE Scrutiny Officials with mandatory written justifications.'
      }
    ]
  },
  '/help': {
    title: 'Help Desk & Sahayak Support',
    subtitle: 'Guidance and assistance for institutions, faculty, and scrutiny officers.',
    sections: [
      {
        heading: 'Toll-Free AICTE Portal Helpdesk',
        body: 'For technical inquiries, contact the National Portal Support Cell at 1800-11-2233 (Mon–Fri, 09:30 to 18:00 IST).'
      },
      {
        heading: 'Sahayak AI Assistance',
        body: 'Access the embedded Sahayak AI Assistant from the bottom-right drawer of your portal for step-by-step guidance on document requirements.'
      }
    ]
  },
  '/contact': {
    title: 'Contact Officials & Regional Offices',
    subtitle: 'Directory of AICTE Headquarters and Western Regional Office (WRO).',
    sections: [
      {
        heading: 'Western Regional Office (WRO)',
        body: 'Industrial Assurance Building, 2nd Floor, Veer Nariman Road, Churchgate, Mumbai, Maharashtra 400020.'
      },
      {
        heading: 'AICTE Headquarters',
        body: 'Nelson Mandela Marg, Vasant Kunj, New Delhi 110070. Phone: 011-26131576-78.'
      }
    ]
  },
  '/feedback': {
    title: 'Citizen & Institutional Feedback',
    subtitle: 'We value your input to continuously enhance the regulatory scrutiny experience.',
    sections: [
      {
        heading: 'Feedback Redressal System',
        body: 'Feedback submitted via this portal is reviewed weekly by the Quality Assurance Committee. Institutional responses are acknowledged within 3 business days.'
      },
      {
        heading: 'Grievance Mechanism',
        body: 'Official regulatory grievances should be submitted via the designated AICTE CPGRAMS portal for formal tracking.'
      }
    ]
  }
};

export const StaticInfoPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = PAGE_DATA[location.pathname] || PAGE_DATA['/policies'];

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased">
      <UtilityBar />

      <header className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AshokaEmblem className="w-8 h-10 text-white shrink-0" />
            <div>
              <span className="text-18 font-black tracking-tight text-saffron-500 leading-none block">
                SATYAPAN
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Regulatory Portal Information
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 text-13 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        <div className="bg-gov-card rounded-2xl border border-gov-border shadow-sm p-6 sm:p-10 space-y-8">
          <div className="border-b border-gov-border pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 border border-saffron-500/20 text-12 font-bold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Policy & Guidance</span>
            </div>
            <h1 className="text-28 font-bold tracking-tight text-navy-950 dark:text-white">
              {page.title}
            </h1>
            <p className="mt-2 text-15 text-slate-600 dark:text-slate-300">
              {page.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            {page.sections.map((sec, i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-50 dark:bg-navy-900/40 border border-gov-border">
                <h2 className="text-16 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  {sec.heading}
                </h2>
                <p className="mt-2 text-14 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {sec.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
};
