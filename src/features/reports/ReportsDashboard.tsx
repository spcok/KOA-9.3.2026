import React, { useState, useRef } from 'react';
import { 
  CalendarDays, 
  ListOrdered, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRightLeft, 
  Download,
  Loader2,
  FileText,
  ChevronRight,
  Scale,
  Eye,
  Wrench
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { db } from '../../lib/db';
import { useHybridQuery } from '../../lib/dataEngine';
import { Animal } from '../../types';
import { generateDailyLogDocx } from './utils/docxExportService';

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  exportFn: () => Promise<boolean>;
  columns: string[];
}

const REPORTS: ReportDefinition[] = [
  {
    id: 'husbandry',
    title: 'Daily log',
    description: 'Export daily feeding, cleaning, and observation records.',
    icon: CalendarDays,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal ID', 'Log Type', 'Notes', 'Recorded By']
  },
  {
    id: 'disposition',
    title: 'Disposition Ledger',
    description: 'Track animal arrivals, departures, and status changes.',
    icon: ArrowRightLeft,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Microchip', 'Status', 'Origin/Dest']
  },
  {
    id: 'maintenance',
    title: 'Facility Maintenance',
    description: 'UV bulb tracking and pending work orders.',
    icon: Wrench,
    exportFn: async () => { return true; },
    columns: ['Enclosure', 'Task', 'Status', 'Date']
  },
  {
    id: 'census',
    title: 'Annual Census',
    description: 'Complete inventory of all animals currently on site.',
    icon: ListOrdered,
    exportFn: async () => { return true; },
    columns: ['Name', 'Species', 'Category', 'Sex', 'Location']
  },
  {
    id: 'stocklist',
    title: 'Stock List (Section 9)',
    description: 'Acquisition, disposition, and internal transfer records.',
    icon: ArrowRightLeft,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Type', 'Source', 'Destination', 'Notes']
  },
  {
    id: 'rounds',
    title: 'Rounds Checklist',
    description: 'Verification of completed daily operational rounds.',
    icon: CheckSquare,
    exportFn: async () => { return true; },
    columns: ['Date', 'Shift', 'Status', 'Completed By', 'Notes']
  },
  {
    id: 'incidents',
    title: 'Incident Log',
    description: 'Log of recorded operational and safety incidents.',
    icon: AlertTriangle,
    exportFn: async () => { return true; },
    columns: ['Date', 'Type', 'Severity', 'Description', 'Reported By']
  },
  {
    id: 'weight',
    title: 'Weight History',
    description: 'Historical weight records for all animals.',
    icon: Scale,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Weight', 'Change', 'Staff']
  }
];

export default function ReportsDashboard() {
  const [activeReportId, setActiveReportId] = useState('husbandry');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  const animals = useHybridQuery<Animal[]>('animals', () => db.animals.toArray(), []);

  // Preview State
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];

  const generatePreview = async () => {
    setIsGenerating(true);
    setPreviewBlob(null);
    setError(null);

    try {
      if (activeReportId === 'husbandry') {
        const dates = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
        while (currentDate <= endDateObj) {
          dates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const logs = await db.daily_logs
          .where('log_date')
          .between(startDate, endDate, true, true)
          .toArray();

        const blob = await generateDailyLogDocx(animals || [], logs, dates, selectedCategory);
        setPreviewBlob(blob);
        
        if (previewContainerRef.current) {
          await renderAsync(blob, previewContainerRef.current, undefined, {
            className: 'docx-preview-page',
            inWrapper: true,
          });
        }
      }
      // ... handle other reports ...
    } catch (err) {
      console.error("Failed to generate preview:", err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Daily_Log.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reports</h2>
          </div>
          <p className="text-sm font-medium text-slate-500">Select report type</p>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {REPORTS.map((report) => (
            <button
              key={report.id}
              onClick={() => {
                setActiveReportId(report.id);
                setPreviewBlob(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                activeReportId === report.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-sm font-medium">
                {report.title}
              </span>
              {activeReportId === report.id && (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 print:hidden">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            {activeReport.title}
          </h1>
          <p className="text-slate-500 mt-1">{activeReport.description}</p>
        </div>

        <div className="bg-white border-b border-slate-200 px-8 py-4 print:hidden">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
              <select 
                value={orientation} 
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">ALL</option>
                <option value="OWLS">OWLS</option>
                <option value="RAPTORS">RAPTORS</option>
                <option value="MAMMALS">MAMMALS</option>
                <option value="EXOTICS">EXOTICS</option>
              </select>
            </div>

            <button
              onClick={generatePreview}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 h-[38px]"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Generate Preview
            </button>
            <button
              onClick={handleDownload}
              disabled={!previewBlob}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 h-[38px]"
            >
              <Download className="w-4 h-4" />
              Download Report (.docx)
            </button>
          </div>
        </div>

        <div className="flex-grow flex flex-col p-8 overflow-hidden">
          {/* Preview Pane */}
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-100/50 rounded-xl border border-slate-200">
            {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
            {/* DOCX Preview Container */}
            <div ref={previewContainerRef} className="bg-white min-h-[600px] shadow-inner" />
          </div>
        </div>
      </div>
    </div>
  );
}
