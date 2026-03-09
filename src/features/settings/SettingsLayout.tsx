import React, { useState } from 'react';
import { 
  ShieldCheck, Users, FileText, Brain, 
  Database, List, Building, HeartPulse, Bug 
} from 'lucide-react';
import AccessControl from './tabs/AccessControl';
import Directory from './tabs/Directory';
import ZLADocuments from './tabs/ZLADocuments';
import Intelligence from './tabs/Intelligence';
import Migration from './tabs/Migration';
import OperationalLists from './tabs/OperationalLists';
import OrgProfile from './tabs/OrgProfile';
import SystemHealth from './tabs/SystemHealth';
import BugReports from './tabs/BugReports';
import { usePermissions } from '../../hooks/usePermissions';

type TabType = 'access' | 'directory' | 'zla' | 'intelligence' | 'migration' | 'lists' | 'org' | 'health' | 'bugs';

const tabs: { id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'access', label: 'Access Control', icon: ShieldCheck },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'zla', label: 'ZLA Documents', icon: FileText },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'migration', label: 'Migration', icon: Database },
  { id: 'lists', label: 'Operational Lists', icon: List },
  { id: 'org', label: 'Organisation Profile', icon: Building },
  { id: 'health', label: 'System Health', icon: HeartPulse },
  { id: 'bugs', label: 'Bug Reports', icon: Bug, adminOnly: true },
];

const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('org');
  const { isAdmin, isOwner } = usePermissions();

  const renderContent = () => {
    switch (activeTab) {
      case 'access': return <AccessControl />;
      case 'directory': return <Directory />;
      case 'zla': return <ZLADocuments />;
      case 'intelligence': return <Intelligence />;
      case 'migration': return <Migration />;
      case 'lists': return <OperationalLists />;
      case 'org': return <OrgProfile />;
      case 'health': return <SystemHealth />;
      case 'bugs': return <BugReports />;
      default: return <OrgProfile />;
    }
  };

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || (isAdmin || isOwner));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
      <div className="flex gap-6">
        <nav className="w-64 space-y-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
