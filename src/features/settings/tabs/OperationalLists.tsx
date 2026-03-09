import React, { useState } from 'react';
import { Utensils, Ticket, Plus, Trash2, Activity, MapPin } from 'lucide-react';
import { AnimalCategory } from '../../../types';

// This component uses local state for demonstration as per the legacy code structure.
// In a full V2 implementation, these would be persisted in Dexie.

const OperationalLists: React.FC = () => {
  const [foodOptions, setFoodOptions] = useState<Record<string, string[]>>({
    [AnimalCategory.OWLS]: ['Day Old Chick', 'Mouse (S)'],
    [AnimalCategory.RAPTORS]: ['Mouse (M)', 'Rat (S)'],
    [AnimalCategory.MAMMALS]: ['Rat (M)', 'Quail'],
    [AnimalCategory.REPTILES]: ['Rabbit'],
    [AnimalCategory.INVERTEBRATES]: ['Insects'],
    [AnimalCategory.AMPHIBIANS]: ['Insects'],
    [AnimalCategory.EXOTICS]: ['Special Diet'],
    [AnimalCategory.ALL]: []
  });
  const [feedMethods, setFeedMethods] = useState<Record<string, string[]>>({
    [AnimalCategory.OWLS]: ['Hand Fed', 'Bowl Fed'],
    [AnimalCategory.RAPTORS]: ['Tongs'],
    [AnimalCategory.MAMMALS]: ['Bowl Fed'],
    [AnimalCategory.REPTILES]: ['Tongs'],
    [AnimalCategory.INVERTEBRATES]: ['Scatter Fed'],
    [AnimalCategory.AMPHIBIANS]: ['Scatter Fed'],
    [AnimalCategory.EXOTICS]: ['Tongs'],
    [AnimalCategory.ALL]: []
  });
  const [eventTypes, setEventTypes] = useState<string[]>(['Training', 'Public Display', 'Medical Treatment']);
  const [locations, setLocations] = useState<string[]>(['Enclosure 1', 'Enclosure 2', 'Hospital', 'Quarantine']);
  
  const [listSection, setListSection] = useState<AnimalCategory>(AnimalCategory.OWLS);

  const handleAddList = (type: 'food' | 'method' | 'location' | 'events', value: string) => {
    if (!value.trim()) return;
    const val = value.trim();
    if (type === 'food') {
      setFoodOptions(prev => ({ ...prev, [listSection]: [...(prev[listSection] || []), val] }));
    } else if (type === 'method') {
      setFeedMethods(prev => ({ ...prev, [listSection]: [...(prev[listSection] || []), val] }));
    } else if (type === 'location') {
      setLocations(prev => [...prev, val]);
    } else if (type === 'events') {
      setEventTypes(prev => [...prev, val]);
    }
  };

  const handleRemoveList = (type: 'food' | 'method' | 'location' | 'events', value: string) => {
    if (type === 'food') {
      setFoodOptions(prev => ({ ...prev, [listSection]: (prev[listSection] || []).filter(i => i !== value) }));
    } else if (type === 'method') {
      setFeedMethods(prev => ({ ...prev, [listSection]: (prev[listSection] || []).filter(i => i !== value) }));
    } else if (type === 'location') {
      setLocations(prev => prev.filter(i => i !== value));
    } else if (type === 'events') {
      setEventTypes(prev => prev.filter(i => i !== value));
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300 uppercase tracking-widest";

  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
      <div className="border-b-2 border-slate-200 pb-6">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <Utensils size={28} className="text-orange-500" /> Operational Registries
        </h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage Dropdown Options & Standard Lists</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EVENT TYPES */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col h-[500px]">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Ticket size={16} className="text-purple-600" /> Event Classifications
          </h4>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="New Event Type..." onKeyDown={(e) => { if (e.key === 'Enter') handleAddList('events', (e.target as HTMLInputElement).value); }} className={inputClass} id="newEventInput" />
            <button onClick={() => { const input = document.getElementById('newEventInput') as HTMLInputElement; handleAddList('events', input.value); input.value = ''; }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {eventTypes.map(item => (
              <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-purple-200 transition-colors">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item}</span>
                <button onClick={() => handleRemoveList('events', item)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* FOOD OPTIONS */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Utensils size={16} className="text-orange-500" /> Diet Inventory
            </h4>
            <select value={listSection} onChange={(e) => setListSection(e.target.value as AnimalCategory)} className="text-[10px] font-bold bg-slate-100 border-none rounded-lg py-1 pl-2 pr-6 uppercase tracking-widest focus:ring-0 cursor-pointer">
              {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="New Food Item..." onKeyDown={(e) => { if (e.key === 'Enter') handleAddList('food', (e.target as HTMLInputElement).value); }} className={inputClass} id="newFoodInput" />
            <button onClick={() => { const input = document.getElementById('newFoodInput') as HTMLInputElement; handleAddList('food', input.value); input.value = ''; }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {(foodOptions[listSection] || []).map(item => (
              <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-orange-200 transition-colors">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item}</span>
                <button onClick={() => handleRemoveList('food', item)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* FEED METHODS */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Feed Methods
            </h4>
            <select value={listSection} onChange={(e) => setListSection(e.target.value as AnimalCategory)} className="text-[10px] font-bold bg-slate-100 border-none rounded-lg py-1 pl-2 pr-6 uppercase tracking-widest focus:ring-0 cursor-pointer">
              {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="New Method..." onKeyDown={(e) => { if (e.key === 'Enter') handleAddList('method', (e.target as HTMLInputElement).value); }} className={inputClass} id="newMethodInput" />
            <button onClick={() => { const input = document.getElementById('newMethodInput') as HTMLInputElement; handleAddList('method', input.value); input.value = ''; }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {(feedMethods[listSection] || []).map(item => (
              <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item}</span>
                <button onClick={() => handleRemoveList('method', item)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* LOCATIONS */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col h-[500px]">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-500" /> Site Locations
          </h4>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="New Location..." onKeyDown={(e) => { if (e.key === 'Enter') handleAddList('location', (e.target as HTMLInputElement).value); }} className={inputClass} id="newLocationInput" />
            <button onClick={() => { const input = document.getElementById('newLocationInput') as HTMLInputElement; handleAddList('location', input.value); input.value = ''; }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {locations.map(item => (
              <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item}</span>
                <button onClick={() => handleRemoveList('location', item)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalLists;
