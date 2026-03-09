import React, { useState, useRef, useEffect } from 'react';
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
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';
import { renderAsync } from 'docx-preview';
import { generateReportBlob } from './utils/docxExportService';
import { db } from '../../lib/db';

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
    title: 'Daily Husbandry Log',
    description: 'Export daily feeding, cleaning, and observation records.',
    icon: CalendarDays,
    exportFn: async () => { return true; }, // Placeholder, logic handled in dashboard
    columns: ['Date', 'Animal ID', 'Log Type', 'Notes', 'Recorded By']
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

const SECTIONS = ['All Sections', 'Owls', 'Raptors', 'Mammals', 'Reptiles', 'Exotics'];

import { useAuthStore } from '../../store/authStore';
import { useOrgSettings } from '../settings/useOrgSettings';

export default function ReportsDashboard() {
  const [activeReportId, setActiveReportId] = useState('husbandry');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  
  const { currentUser } = useAuthStore();
  const { settings } = useOrgSettings();
  
  // Preview State
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];

  useEffect(() => {
    if (docBlob && previewContainerRef.current) {
      previewContainerRef.current.innerHTML = '';
      renderAsync(docBlob, previewContainerRef.current, previewContainerRef.current, {
        className: 'docx-preview-page',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false
      }).catch(err => console.error("Error rendering docx preview:", err));
    }
  }, [docBlob]);

  const generatePreview = async () => {
    setIsPreviewLoading(true);
    setDocBlob(null);
    setError(null);

    try {
      let data: string[][] = [];

      switch (activeReportId) {
        case 'husbandry': {
          const logs = await db.daily_logs
            .where('log_date')
            .between(startDate, endDate, true, true)
            .toArray();
          
          data = logs.map(log => [
            log.log_date,
            log.animal_id,
            log.log_type,
            log.notes || '',
            log.user_initials || log.created_by || ''
          ]);
          break;
        }
        case 'census': {
          const animals = await db.animals
            .filter(a => !a.archived)
            .toArray();
            
          data = animals.map(a => [
            a.name,
            a.species,
            a.category,
            a.sex || 'Unknown',
            a.location
          ]);
          break;
        }
        case 'stocklist': {
          const movements = await db.internal_movements
            .where('log_date')
            .between(startDate, endDate, true, true)
            .toArray();

          data = movements.map(mov => [
            mov.log_date,
            mov.animal_name,
            mov.movement_type,
            mov.source_location,
            mov.destination_location,
            mov.notes || ''
          ]);
          break;
        }
        case 'rounds': {
          const rounds = await db.daily_rounds
            .where('date')
            .between(startDate, endDate, true, true)
            .toArray();

          data = rounds.map(r => [
            r.date,
            r.shift,
            r.status,
            r.completedBy,
            r.notes || ''
          ]);
          break;
        }
        case 'incidents': {
          const incidents = await db.incidents
            .filter(inc => {
              const d = new Date(inc.date).toISOString().split('T')[0];
              return d >= startDate && d <= endDate;
            })
            .toArray();

          data = incidents.map(inc => [
            new Date(inc.date).toLocaleDateString(),
            inc.type,
            inc.severity,
            inc.description,
            inc.reported_by
          ]);
          break;
        }
        case 'weight': {
          data = []; 
          break;
        }
      }

      const blob = await generateReportBlob(
        activeReport.title,
        "Kent Owl Academy Compliance Report",
        activeReport.columns,
        data,
        {
          logoUrl: settings?.logo_url,
          reportName: activeReport.title,
          startDate,
          endDate,
          generatedBy: currentUser?.name || 'Staff Member'
        }
      );
      setDocBlob(blob);

    } catch (error) {
      console.error("Failed to generate preview:", error);
      setError("Failed to generate preview. Please try again.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = () => {
    if (docBlob) {
      saveAs(docBlob, `${activeReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
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
                setDocBlob(null);
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
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            {activeReport.title}
          </h1>
          <p className="text-slate-500 mt-1">{activeReport.description}</p>
        </div>

        <div className="bg-white border-b border-slate-200 px-8 py-4">
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

            <div className="relative w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
              <button 
                onClick={() => setIsSectionOpen(!isSectionOpen)}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <span>{selectedSection}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSectionOpen ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {isSectionOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsSectionOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden"
                    >
                      {SECTIONS.map(section => (
                        <button
                          key={section}
                          onClick={() => {
                            setSelectedSection(section);
                            setIsSectionOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedSection === section ? 'bg-slate-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {section}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={generatePreview}
              disabled={isPreviewLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 h-[38px]"
            >
              {isPreviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Generate Preview
            </button>
          </div>
        </div>

        <div className="flex-grow flex flex-col p-8 overflow-hidden">
          {/* Preview Pane */}
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-100/50 rounded-xl border border-slate-200">
            {/* Preview Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
              {docBlob && (
                <div className="flex items-center">
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-1 py-1 mr-4">
                    <button 
                      onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-700 w-12 text-center">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button 
                      onClick={() => setPreviewZoom(z => Math.min(2, z + 0.1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Report (.docx)
                  </button>
                </div>
              )}
            </div>

            {/* DOCX Preview Container */}
            <div className="w-full h-[800px] overflow-auto rounded-b-xl border-x border-b border-slate-300 bg-[#f8f9fa] relative">
              {!docBlob && !isPreviewLoading && !error && (
                <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0 pointer-events-none">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Select parameters and click Generate Preview to view the document here.</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center text-red-500 absolute inset-0 pointer-events-none">
                  <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              {isPreviewLoading && (
                <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0 z-10 bg-[#f8f9fa]/80">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-500" />
                  <p className="text-sm font-medium">Generating document preview...</p>
                </div>
              )}
              
              <div style={{ zoom: previewZoom } as React.CSSProperties} className={`${docBlob && !isPreviewLoading ? 'block' : 'hidden'}`}>
                <div ref={previewContainerRef}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
