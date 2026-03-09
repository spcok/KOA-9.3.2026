import React from 'react';
import { Animal, LogType, LogEntry } from '../../../types';

interface ExoticRowProps {
  animal: Animal;
  getTodayLog: (animalId: string, type: LogType) => LogEntry | undefined;
  onCellClick: (animal: Animal, type: LogType) => void;
}

export const ExoticRow: React.FC<ExoticRowProps> = ({ animal, getTodayLog, onCellClick }) => {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="p-4 flex items-center gap-3">
        <img src={animal.image_url || '/placeholder.png'} alt={animal.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
        <div>
          <div className="font-bold text-slate-800">{animal.name}</div>
          <div className="text-xs text-slate-500">{animal.species}</div>
        </div>
      </td>
      <td className="p-4">
        <button onClick={() => onCellClick(animal, LogType.FEED)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
          {getTodayLog(animal.id, LogType.FEED)?.value || 'Feed'}
        </button>
      </td>
      <td className="p-4">
        <button onClick={() => onCellClick(animal, LogType.MISTING)} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs font-bold text-blue-800">
          {getTodayLog(animal.id, LogType.MISTING)?.value || 'Mist'}
        </button>
      </td>
      <td className="p-4">
        <button onClick={() => onCellClick(animal, LogType.TEMPERATURE)} className="text-xs font-bold text-slate-600 hover:text-emerald-600">
          {getTodayLog(animal.id, LogType.TEMPERATURE)?.value || 'Basking / Cool'}
        </button>
      </td>
    </tr>
  );
};
