import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { 
  Button,
  FormField,
  Select,
  DatePicker,
  FileDropzone,
  DataTable,
  ColumnDef,
  StatusChip,
  SeverityBadge,
  KpiCard,
  Gauge,
  ProgressRing,
  Stepper,
  Timeline,
  Tabs,
  Drawer,
  Modal,
  useToast,
  Tooltip,
  Skeleton,
  EmptyState,
  ErrorState,
  Avatar,
  AdvisoryBanner,
  Breadcrumb,
  VerificationStatusType,
  ApplicationStatusType,
  SeverityLevel
} from '../components/design-system';
import { 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Send, 
  Palette, 
  Type, 
  Layout, 
  BarChart3, 
  Sliders 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';

export const Styleguide: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useTheme();
  const { showToast } = useToast();

  // Interactive component states
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(2);
  const [activeTab, setActiveTab] = useState('components');
  const [gaugeValue, setGaugeValue] = useState(38);
  const [progressVal, setProgressVal] = useState(72);
  const [formInput, setFormInput] = useState('Saraswati Education Society');
  const [formErrorInput, setFormErrorInput] = useState('invalid_number');
  const [selectedRole, setSelectedRole] = useState('OFFICIAL_SCRUTINY');
  const [selectedDate, setSelectedDate] = useState('2026-03-31');

  // Colour Tokens for Palette Swatch Board
  const colorTokens = [
    { name: 'navy-900', hex: '#0B1F4B', role: 'Header, Officials, High Hierarchy' },
    { name: 'navy-700', hex: '#1F3A93', role: 'Primary Action, Brand Base' },
    { name: 'navy-500', hex: '#3B5BC4', role: 'Secondary Accents, Focus' },
    { name: 'navy-50', hex: '#EEF2FB', role: 'Subtle Backgrounds, Active Rows' },
    { name: 'saffron-500', hex: '#FF9933', role: 'National Accent, CTA, Focus Outline' },
    { name: 'saffron-50', hex: '#FFF4E5', role: 'Saffron Tint, Callout Background' },
    { name: 'green-600', hex: '#138808', role: 'Verified, Success, Valid Documents' },
    { name: 'green-50', hex: '#E8F5E6', role: 'Success Badges & Tints' },
    { name: 'danger', hex: '#C62828', role: 'Mismatch, Revocation, Deficit' },
    { name: 'warning', hex: '#B26A00', role: 'Expired, Needs Correction' },
    { name: 'info', hex: '#0B6BCB', role: 'Informational, Authority Crosscheck' },
    { name: 'chakra-blue', hex: '#000080', role: 'Chakra Line Art Only' },
  ];

  // Sample data for DataTable
  interface SampleDoc {
    id: string;
    docName: string;
    category: string;
    status: VerificationStatusType;
    confidence: number;
    authority: string;
  }

  const sampleDocs: SampleDoc[] = [
    {
      id: 'DOC-001',
      docName: '7_12_Extract_Land_Registry.pdf',
      category: 'LAND_OWNERSHIP',
      status: 'VERIFIED',
      confidence: 0.99,
      authority: 'Mahabhumi Portal'
    },
    {
      id: 'DOC-002',
      docName: 'Building_Safety_Plan_Block_B.pdf',
      category: 'BUILDING_PLAN',
      status: 'MISMATCH_DETECTED',
      confidence: 0.95,
      authority: 'Municipal Corporation'
    },
    {
      id: 'DOC-003',
      docName: 'Fire_Safety_Certificate_2021.pdf',
      category: 'FIRE_NOC',
      status: 'EXPIRED',
      confidence: 0.98,
      authority: 'State Fire Services'
    },
    {
      id: 'DOC-004',
      docName: 'Faculty_Appointment_Roster.pdf',
      category: 'FACULTY_APPOINTMENT',
      status: 'MANUAL_REVIEW_REQUIRED',
      confidence: 0.92,
      authority: 'Academic Staff Registry'
    },
    {
      id: 'DOC-005',
      docName: 'Bank_Joint_FDR_Receipt.pdf',
      category: 'FDR_DEPOSIT',
      status: 'VERIFIED',
      confidence: 0.99,
      authority: 'State Bank CBS'
    }
  ];

  const columns: ColumnDef<SampleDoc>[] = [
    {
      key: 'id',
      header: 'Doc ID',
      accessor: (row) => <span className="font-mono text-12 font-bold">{row.id}</span>,
      sortable: true,
      width: '110px',
      isTabular: true
    },
    {
      key: 'docName',
      header: 'Document Name',
      accessor: (row) => <span className="font-semibold text-gov-text">{row.docName}</span>,
      sortable: true
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row) => <span className="text-12 text-gov-muted font-mono">{row.category}</span>,
      sortable: true
    },
    {
      key: 'status',
      header: 'Verification Status',
      accessor: (row) => <StatusChip status={row.status} size="sm" />,
      sortable: true
    },
    {
      key: 'confidence',
      header: 'Confidence',
      accessor: (row) => (
        <span className="tabular-nums font-bold text-12 text-navy-700">
          {(row.confidence * 100).toFixed(0)}%
        </span>
      ),
      sortable: true,
      align: 'right',
      isTabular: true
    },
    {
      key: 'authority',
      header: 'Cross-Check Source',
      accessor: (row) => (
        <span className="text-11 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
          {row.authority}
        </span>
      )
    }
  ];

  // Colour-blind-safe chart data (Navy, Saffron, Green, Teal, Plum)
  const chartData = [
    { category: 'Land', verified: 45, mismatch: 8, expired: 2 },
    { category: 'Building', verified: 38, mismatch: 12, expired: 0 },
    { category: 'Fire NOC', verified: 30, mismatch: 4, expired: 18 },
    { category: 'Faculty', verified: 52, mismatch: 14, expired: 1 },
    { category: 'FDR Deposit', verified: 48, mismatch: 2, expired: 0 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Portal Administration' },
          { label: 'Design System & Component Library (/styleguide)' }
        ]}
      />

      {/* Styleguide Hero Banner */}
      <div className="p-6 bg-gov-surface border border-gov-border rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-12 font-bold px-2 py-0.5 rounded bg-navy-50 text-navy-700 border border-navy-500/30 uppercase tracking-wider font-mono">
              Design System Spec A1
            </span>
            <span className="text-12 font-bold px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-600/30">
              WCAG 2.1 AA Compliant
            </span>
          </div>

          <h1 className="text-24 sm:text-32 font-black text-gov-text mt-2 leading-tight">
            AICTE SATYAPAN Design System
          </h1>
          <p className="text-14 text-gov-muted max-w-2xl mt-1">
            Official visual identity tokens, accessible component library, and trilingual typography specifications for the National Regulatory Approval Processing Platform.
          </p>
        </div>

        {/* Global Live Theme and Language Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gov-subtle p-3 rounded-lg border border-gov-border">
          <div>
            <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
              Active Theme
            </label>
            <div className="flex rounded border border-gov-border bg-gov-surface p-0.5 text-12 font-bold">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2 py-1 rounded transition-colors ${theme === 'light' ? 'bg-navy-700 text-white' : 'text-gov-muted'}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2 py-1 rounded transition-colors ${theme === 'dark' ? 'bg-navy-700 text-white' : 'text-gov-muted'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('high-contrast')}
                className={`px-2 py-1 rounded transition-colors ${theme === 'high-contrast' ? 'bg-black text-[#FFD600] ring-1 ring-[#FFD600]' : 'text-gov-muted'}`}
              >
                High Contrast
              </button>
            </div>
          </div>

          <div>
            <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
              Active Language
            </label>
            <div className="flex rounded border border-gov-border bg-gov-surface p-0.5 text-12 font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-navy-700 text-white' : 'text-gov-muted'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded transition-colors ${language === 'hi' ? 'bg-navy-700 text-white' : 'text-gov-muted'}`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 rounded transition-colors ${language === 'mr' ? 'bg-navy-700 text-white' : 'text-gov-muted'}`}
              >
                मराठी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Navigation Tabs */}
      <Tabs
        activeTabId={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'components', label: 'Component Library', icon: <Layout className="w-4 h-4" /> },
          { id: 'tokens', label: 'Color Tokens & Palette', icon: <Palette className="w-4 h-4" /> },
          { id: 'typography', label: 'Typography & Scale', icon: <Type className="w-4 h-4" /> },
          { id: 'charts', label: 'Accessible Charts', icon: <BarChart3 className="w-4 h-4" /> },
        ]}
      />

      {/* TAB 1: COMPONENT LIBRARY */}
      {activeTab === 'components' && (
        <div className="space-y-10">
          {/* Section 1: Buttons */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Buttons & Actions</h2>
              <p className="text-12 text-gov-muted">Primary navy, secondary outline, saffron CTA, danger, loading states, and size scales.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Navy</Button>
              <Button variant="secondary">Secondary Outline</Button>
              <Button variant="saffron" rightIcon={<Send className="w-4 h-4" />}>
                Saffron Call-to-Action
              </Button>
              <Button variant="danger">Danger Action</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" isLoading>Processing...</Button>
              <Button variant="primary" disabled>Disabled State</Button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary">Small (12px)</Button>
              <Button size="md" variant="secondary">Medium (14px)</Button>
              <Button size="lg" variant="secondary">Large (16px)</Button>
            </div>
          </section>

          {/* Section 2: Form Controls */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Form Controls & Validation</h2>
              <p className="text-12 text-gov-muted">Floating labels, inline validation states, selects, date pickers, and dropzone.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField
                label="Institution Name"
                required
                value={formInput}
                onChange={(e) => setFormInput(e.target.value)}
                helperText="Must match land deed and AICTE previous EoA exactly"
                success
              />

              <FormField
                label="AICTE Permanent Application ID"
                required
                value={formErrorInput}
                onChange={(e) => setFormErrorInput(e.target.value)}
                error="Invalid AICTE ID format. Must follow AICTE-1-XXXXXXXXX."
              />

              <Select
                label="Designated Scrutiny Officer Role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={[
                  { value: 'OFFICIAL_SCRUTINY', label: 'OFFICIAL_SCRUTINY • Scrutiny Official' },
                  { value: 'OFFICIAL_SENIOR', label: 'OFFICIAL_SENIOR • Regional Director' },
                  { value: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN • Policy Administrator' }
                ]}
                helperText="Role defines document approval authorization limits"
              />

              <DatePicker
                label="Compliance Inspection Audit Date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                helperText="Scheduled physical / digital verification date"
              />

              <div className="md:col-span-2">
                <FileDropzone
                  label="Regulatory Compliance Document Dropzone"
                  helperText="Upload Land Title / Building Plan / Fire NOC PDF up to 10MB"
                  onFileSelect={(file) => {
                    showToast({
                      type: 'success',
                      title: 'Document Uploaded',
                      message: `${file.name} queued for OCR layout geometry extraction.`
                    });
                  }}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Status Chips & Severity Badges */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Status Chips & Severity Badges (Exact Enums)</h2>
              <p className="text-12 text-gov-muted">
                Mandatory Principle 5 Enums: <code>VERIFIED</code>, <code>MISMATCH_DETECTED</code>, <code>EXPIRED</code>, <code>VERIFICATION_PENDING</code>, <code>SOURCE_UNAVAILABLE</code>, <code>MANUAL_REVIEW_REQUIRED</code>.
              </p>
            </div>

            <div>
              <h4 className="text-12 font-bold text-gov-muted uppercase tracking-wider mb-2.5">
                Verification Status Chips (Principle 5)
              </h4>
              <div className="flex flex-wrap gap-2.5">
                <StatusChip status="VERIFIED" />
                <StatusChip status="MISMATCH_DETECTED" />
                <StatusChip status="EXPIRED" />
                <StatusChip status="VERIFICATION_PENDING" />
                <StatusChip status="SOURCE_UNAVAILABLE" />
                <StatusChip status="MANUAL_REVIEW_REQUIRED" />
              </div>
            </div>

            <div>
              <h4 className="text-12 font-bold text-gov-muted uppercase tracking-wider mb-2.5">
                Application Lifecycle Statuses
              </h4>
              <div className="flex flex-wrap gap-2.5">
                <StatusChip status="DRAFT" />
                <StatusChip status="SUBMITTED" />
                <StatusChip status="UNDER_SCRUTINY" />
                <StatusChip status="DEFICIENCY_COMMUNICATED" />
                <StatusChip status="RECOMMENDED" />
                <StatusChip status="NOT_RECOMMENDED" />
                <StatusChip status="APPROVED" />
                <StatusChip status="REJECTED" />
              </div>
            </div>

            <div>
              <h4 className="text-12 font-bold text-gov-muted uppercase tracking-wider mb-2.5">
                Regulatory Deficiency Severity Badges
              </h4>
              <div className="flex flex-wrap gap-2.5">
                <SeverityBadge level="LOW" />
                <SeverityBadge level="MEDIUM" />
                <SeverityBadge level="HIGH" />
                <SeverityBadge level="CRITICAL" />
              </div>
            </div>
          </section>

          {/* Section 4: Data Table with Sticky Header & Features */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-18 font-bold text-gov-text">Data Table with Sticky Header & Tabular Figures</h2>
                <p className="text-12 text-gov-muted">Sortable columns, sticky header, pagination, column chooser, row actions, and bulk selection.</p>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={sampleDocs}
              keyField="id"
              title="Verified Regulatory Documents Roster"
              actions={[
                { label: 'Inspect Bounding Box', action: 'inspect' },
                { label: 'Download Scrutiny Extract', action: 'download' },
                { label: 'Re-run Model OCR', action: 'rescan' }
              ]}
              onRowAction={(act, row) => {
                showToast({
                  type: 'info',
                  title: `Action: ${act}`,
                  message: `Executed action on document ${row.id}`
                });
              }}
            />
          </section>

          {/* Section 5: KPI Cards, Gauges & Progress Rings */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Metrics, Risk Gauges & Progress Rings</h2>
              <p className="text-12 text-gov-muted">Direct visual decision-support metrics formatted with <code>tabular-nums</code>.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Scrutinized Applications"
                value="1,428"
                subtitle="Cycle 2026-27 Applications"
                change="+12.4%"
                changeType="positive"
                sparklineData={[{ value: 20 }, { value: 35 }, { value: 42 }, { value: 58 }, { value: 70 }]}
              />

              <KpiCard
                title="Advisory Deficiency Rate"
                value="8.2%"
                subtitle="Deficiencies communicated"
                change="-2.1%"
                changeType="positive"
                sparklineData={[{ value: 40 }, { value: 32 }, { value: 28 }, { value: 22 }, { value: 16 }]}
              />

              <KpiCard
                title="Cross-Check Authority Uptime"
                value="99.8%"
                subtitle="DigiLocker & Land Registry"
                change="Nominal"
                changeType="neutral"
                sparklineData={[{ value: 99 }, { value: 99 }, { value: 100 }, { value: 99 }, { value: 100 }]}
              />

              <KpiCard
                title="Critical Tamper Detections"
                value="3"
                subtitle="Referred to Appellate Committee"
                change="+3"
                changeType="negative"
                sparklineData={[{ value: 0 }, { value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-center">
              <Gauge
                value={gaugeValue}
                title="Composite Advisory Risk Index"
                subtitle="Dynamic algorithm score (0 to 100)"
              />

              <div className="p-4 bg-gov-surface border border-gov-border rounded-lg shadow-xs flex flex-col items-center justify-center space-y-3">
                <p className="text-12 font-semibold text-gov-muted uppercase">
                  Adjust Interactive Gauge
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gaugeValue}
                  onChange={(e) => setGaugeValue(Number(e.target.value))}
                  className="w-full accent-saffron-500 cursor-pointer"
                />
                <span className="text-14 font-mono font-bold text-navy-700">
                  Value: {gaugeValue}/100
                </span>
              </div>

              <div className="p-4 bg-gov-surface border border-gov-border rounded-lg shadow-xs flex items-center justify-around">
                <ProgressRing progress={progressVal} label="OCR Geometry Extraction" />
                <ProgressRing progress={100} label="Signature Hash Match" />
              </div>
            </div>
          </section>

          {/* Section 6: Workflow Stepper & Audit Timeline */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-6">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Workflow Stepper & Regulatory Audit Timeline</h2>
              <p className="text-12 text-gov-muted">Step tracking and immutable legal timestamp audit log.</p>
            </div>

            <div className="p-4 bg-gov-subtle rounded-lg border border-gov-border">
              <Stepper
                activeStep={activeStep}
                onStepClick={setActiveStep}
                steps={[
                  { id: 1, title: 'Document Ingestion', description: 'PDF Upload & Hash' },
                  { id: 2, title: 'AI OCR & Geometry', description: 'Tesseract & Layout' },
                  { id: 3, title: 'Authority Cross-Check', description: 'DigiLocker & Bhulekh' },
                  { id: 4, title: 'Official Scrutiny Desk', description: 'Human Decision' },
                  { id: 5, title: 'EoA Issuance', description: 'Council Approval' },
                ]}
              />
            </div>

            <div className="pt-2">
              <h4 className="text-14 font-bold text-gov-text mb-3">
                Live Audit Trail Timeline
              </h4>
              <Timeline
                events={[
                  {
                    id: 'EVT-1',
                    timestamp: '2026-10-27 14:32:10 IST',
                    actor: 'Dr. Arvind Deshmukh',
                    role: 'OFFICIAL_SCRUTINY',
                    action: 'Recommended Extension of Approval (EoA)',
                    details: 'Remarks: Inspected all 8 documents against APH 2026-27 norms. Zero unresolved deficiencies.',
                    type: 'approval'
                  },
                  {
                    id: 'EVT-2',
                    timestamp: '2026-10-27 14:15:02 IST',
                    actor: 'AICTE SATYAPAN Engine',
                    role: 'AUTOMATED_PIPELINE',
                    action: 'Cross-checked Land Record with Mahabhumi Survey Registry',
                    details: 'Matched Survey SRV-PUNE-402: 3.25 Acres unencumbered educational title confirmed.',
                    type: 'system'
                  },
                  {
                    id: 'EVT-3',
                    timestamp: '2026-10-27 11:20:44 IST',
                    actor: 'Dr. Prakash Patil',
                    role: 'INSTITUTE_ADMIN',
                    action: 'Uploaded Extension of Approval Dossier',
                    details: 'Submitted 8 certified PDFs with PKCS#7 digital signature tokens.',
                    type: 'upload'
                  }
                ]}
              />
            </div>
          </section>

          {/* Section 7: Overlays (Drawer, Modal, Toast, Tooltips) */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Overlays, Drawers & Notification Toasts</h2>
              <p className="text-12 text-gov-muted">Interactive dialogs, slide-over panels, tooltips, and toast triggers.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Open Regulatory Dialog Modal
              </Button>

              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                Open Scrutiny Inspection Drawer
              </Button>

              <Button
                variant="saffron"
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'Decision Recorded',
                    message: 'Official recommendation submitted to AICTE Central Regulatory Registry.'
                  });
                }}
              >
                Trigger Success Toast
              </Button>

              <Button
                variant="danger"
                onClick={() => {
                  showToast({
                    type: 'error',
                    title: 'Deficiency Communicated',
                    message: 'Deficiency memo dispatched to Institute Principal email.'
                  });
                }}
              >
                Trigger Danger Toast
              </Button>

              <Tooltip content="WCAG AA Accessible Tooltip with 7:1 contrast ratio">
                <Button variant="ghost">Hover or Focus for Tooltip</Button>
              </Tooltip>
            </div>
          </section>

          {/* Section 8: Skeletons, Empty & Error States */}
          <section className="bg-gov-surface border border-gov-border rounded-lg p-5 sm:p-6 shadow-xs space-y-6">
            <div className="border-b border-gov-border pb-3">
              <h2 className="text-18 font-bold text-gov-text">Loading Skeletons, Empty States & Error States</h2>
              <p className="text-12 text-gov-muted">Graceful state handling for slow connections and network interruptions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skeleton loading demo */}
              <div className="p-4 bg-gov-subtle rounded-lg border border-gov-border space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
                <Skeleton variant="rectangular" height={80} />
                <Skeleton variant="text" />
              </div>

              {/* Empty state demo */}
              <EmptyState
                title="No Deficiencies Found"
                description="This institution fulfills all parameters defined in APH 2026-27."
                actionLabel="View Verified Dossier"
                onAction={() => alert("Opening dossier...")}
              />

              {/* Error state demo */}
              <ErrorState
                title="DigiLocker Gateway Latency"
                errorCode="GATEWAY_504_SIMULATED"
                message="Simulated source timed out after 5000ms. Offline fallback activated."
                onRetry={() => showToast({ type: 'info', title: 'Retrying Gateway', message: 'Re-authenticating with simulated source...' })}
              />
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: COLOR TOKENS & PALETTE */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-gov-surface border border-gov-border rounded-lg p-6 shadow-xs">
            <h2 className="text-18 font-bold text-gov-text mb-1">Government Portal Color Palette</h2>
            <p className="text-12 text-gov-muted mb-4">
              Calm, dense, authoritative color tokens strictly mapped to CSS variables and Tailwind utilities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {colorTokens.map((token) => (
                <div key={token.name} className="border border-gov-border rounded-lg overflow-hidden bg-gov-surface shadow-xs">
                  <div
                    className="h-20 w-full flex items-end p-2"
                    style={{ backgroundColor: token.hex }}
                  >
                    <span className="text-11 font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                      {token.hex}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-14 font-bold text-gov-text">{token.name}</p>
                    <p className="text-11 text-gov-muted mt-0.5">{token.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY & DEVANAGARI SCALE */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <div className="bg-gov-surface border border-gov-border rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-18 font-bold text-gov-text">Typography Specimen: Noto Sans & Noto Sans Devanagari</h2>
            <p className="text-12 text-gov-muted">
              Self-hosted via <code>@fontsource</code> (offline capable). Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40. Ample padding and line-height ensure zero Devanagari clipping for matras.
            </p>

            <div className="divide-y divide-gov-border pt-2">
              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">40px • Title Display</span>
                <div className="flex-1">
                  <p className="text-40 font-bold text-gov-text leading-tight">
                    AICTE SATYAPAN • एआईसीटीई सत्यापन
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">32px • Primary Header</span>
                <div className="flex-1">
                  <p className="text-32 font-bold text-gov-text leading-tight">
                    Regulatory Scrutiny Desk • नियामक तपासणी कक्ष
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">24px • Sub-heading</span>
                <div className="flex-1">
                  <p className="text-24 font-bold text-gov-text">
                    Extension of Approval (EoA) • मान्यता विस्तार प्रक्रिया
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">20px • Card Title</span>
                <div className="flex-1">
                  <p className="text-20 font-semibold text-gov-text">
                    Minimum Land Requirement Norms • किमान जमिनीची आवश्यकता
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">18px • Section Title</span>
                <div className="flex-1">
                  <p className="text-18 font-semibold text-gov-text">
                    Faculty-to-Student Ratio Verification • शिक्षक-विद्यार्थी प्रमाण
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">16px • Base Body</span>
                <div className="flex-1">
                  <p className="text-16 text-gov-text leading-relaxed">
                    AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials with mandatory written remarks.
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">14px • Form & Table</span>
                <div className="flex-1">
                  <p className="text-14 text-gov-text">
                    Survey No. 402, Hinjawadi Phase 2, Pune 411057 • महाराष्ट्र शासन भूमी अभिलेख
                  </p>
                </div>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <span className="text-11 font-mono text-gov-muted w-32">12px • Badges & Meta</span>
                <div className="flex-1">
                  <p className="text-12 text-gov-muted tabular-nums">
                    Ref: AICTE/APH/2026/CH-1/SEC-4.3 • Timestamp: 2026-10-27T15:30:00Z
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCESSIBLE CHARTS */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="bg-gov-surface border border-gov-border rounded-lg p-6 shadow-xs">
            <h2 className="text-18 font-bold text-gov-text mb-1">Color-Blind-Safe Regulatory Charts</h2>
            <p className="text-12 text-gov-muted mb-4">
              Recharts implementation using curated high-contrast palette (Navy `#1F3A93`, Saffron `#FF9933`, Green `#138808`) with direct labels.
            </p>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="category" stroke="var(--color-text-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="verified" name="Verified Genuine" fill="#138808" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mismatch" name="Mismatch Flagged" fill="#FF9933" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expired" name="Expired Certificate" fill="#C62828" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Official Scrutiny Regulatory Hearing"
        description="Application Reference: AICTE/EOA/2026/MH-PUNE-402"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                showToast({ type: 'success', title: 'Hearing Recorded', message: 'Proceeding logged to legal register.' });
              }}
            >
              Confirm Official Hearing
            </Button>
          </>
        }
      >
        <p className="text-14 text-gov-text leading-relaxed">
          You are confirming the physical hearing date for Saraswati Institute of Technology before the Regional Scrutiny Committee.
        </p>
        <FormField
          label="Hearing Chamber / Meeting Room"
          defaultValue="Chamber 4B, WRO AICTE, Churchgate, Mumbai"
        />
      </Modal>

      {/* Interactive Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Document Evidence & Inspection Drawer"
        subtitle="7_12_Extract_Land_Registry.pdf (Page 1)"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-12 text-gov-muted font-mono">SIMULATED SOURCE</span>
            <Button variant="primary" size="sm" onClick={() => setDrawerOpen(false)}>
              Close Drawer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border-l-4 border-saffron-500 rounded text-12 text-gov-text">
            <strong>Advisory Extraction:</strong> Land area verified as 3.25 Acres. AICTE APH threshold requires 2.50 Acres. Norm complied.
          </div>

          <div className="p-4 bg-gov-subtle rounded border border-gov-border font-mono text-12 space-y-1.5">
            <p><strong>Survey Reference:</strong> SRV-PUNE-402</p>
            <p><strong>Owner:</strong> Saraswati Education Society</p>
            <p><strong>Title:</strong> Clear & Unencumbered</p>
            <p><strong>Hash (SHA-256):</strong> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
