import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, LogType, LogEntry } from '../../../types';
import { getMaidstoneDailyWeather } from '../../../services/weatherService';
import { Loader2 } from 'lucide-react';

interface MammalRowProps {
  animal: Animal;
  getTodayLog: (animalId: string, type: LogType) => LogEntry | undefined;
  onCellClick: (animal: Animal, type: LogType) => void;
  addLogEntry: (entry: LogEntry) => Promise<void>;
  viewDate: string;
}

export const MammalRow: React.FC<MammalRowProps> = ({ animal, getTodayLog, onCellClick, addLogEntry, viewDate }) => {
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const handleMammalAutoWeather = async (animal: Animal) => {
    setIsWeatherLoading(true);
    try {
      const weather = await getMaidstoneDailyWeather();
      await addLogEntry({
        id: uuidv4(),
        animal_id: animal.id,
        log_type: LogType.TEMPERATURE,
        log_date: viewDate,
        value: weather.rangeString || `Max: ${weather.maxTemp}°C / Min: ${weather.minTemp}°C`,
        notes: weather.description
      });
    } catch (error) {
      console.error('Failed to auto-fetch mammal weather', error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const envLog = getTodayLog(animal.id, LogType.TEMPERATURE);

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
        <button onClick={() => onCellClick(animal, LogType.WEIGHT)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">
          {getTodayLog(animal.id, LogType.WEIGHT)?.value || '--'}
        </button>
      </td>
      <td className="p-4">
        <button onClick={() => onCellClick(animal, LogType.FEED)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
          {getTodayLog(animal.id, LogType.FEED)?.value || 'Feed'}
        </button>
      </td>
      <td className="p-4">
        <div className="flex items-center min-w-[140px]">
          {envLog ? (
            <button 
              onClick={() => onCellClick(animal, LogType.TEMPERATURE)}
              className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors truncate"
            >
              {envLog.value}
            </button>
          ) : (
            <div className="flex gap-2 items-center w-full">
              <button 
                onClick={() => handleMammalAutoWeather(animal)}
                disabled={isWeatherLoading}
                className="flex-1 flex justify-center items-center gap-1 px-2 py-2 bg-sky-50 border-2 border-sky-200 hover:bg-sky-100 text-sky-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                {isWeatherLoading ? <Loader2 size={14} className="animate-spin" /> : '☁️ Auto'}
              </button>
              <button 
                onClick={() => onCellClick(animal, LogType.TEMPERATURE)}
                className="flex-1 flex justify-center items-center gap-1 px-2 py-2 bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                ✍️ Manual
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
