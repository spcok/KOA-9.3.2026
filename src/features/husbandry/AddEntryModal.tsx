import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Animal, LogType, LogEntry, AnimalCategory } from '../../types';
import { getFullWeather } from '../../services/weatherService';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<LogEntry>) => void;
  animal: Animal;
  initialType: LogType;
  existingLog?: LogEntry;
  foodOptions: string[];
  feedMethods: string[];
  eventTypes: string[];
  initialDate: string;
  allAnimals: Animal[];
  defaultTemperature?: number;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  animal,
  initialType,
  existingLog,
  foodOptions,
  feedMethods,
  eventTypes,
  initialDate,
  defaultTemperature
}) => {
  const [logType, setLogType] = useState<LogType>(initialType);
  const [date, setDate] = useState(initialDate);
  const [value, setValue] = useState(existingLog?.value || '');
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const [weightGrams, setWeightGrams] = useState<number | ''>(existingLog?.weight_grams || '');
  const [baskingTemp, setBaskingTemp] = useState<number | ''>(existingLog?.basking_temp_c || '');
  const [coolTemp, setCoolTemp] = useState<number | ''>(existingLog?.cool_temp_c || '');
  const [temperature, setTemperature] = useState<number | ''>(existingLog?.temperature_c ?? defaultTemperature ?? '');
  const [healthRecordType, setHealthRecordType] = useState(existingLog?.health_record_type || '');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    if (logType === LogType.TEMPERATURE && temperature === '' && !existingLog) {
      const fetchWeather = async () => {
        setIsWeatherLoading(true);
        try {
          const weather = await getFullWeather();
          if (weather && weather.current) {
            setTemperature(Math.round(weather.current.temperature));
            setNotes(prev => prev ? `${prev} | ${weather.current.description}` : weather.current.description);
          }
        } catch (error) {
          console.error('Failed to auto-fetch weather', error);
        } finally {
          setIsWeatherLoading(false);
        }
      };
      fetchWeather();
    }
  }, [logType, temperature, existingLog]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry: Partial<LogEntry> = {
      id: existingLog?.id,
      animal_id: animal.id,
      log_type: logType,
      log_date: date,
      value: value || logType,
      notes,
    };

    if (logType === LogType.WEIGHT && weightGrams !== '') {
      entry.weight_grams = Number(weightGrams);
      entry.value = `${weightGrams}g`;
    }

    if (logType === LogType.TEMPERATURE) {
      if (animal.category === AnimalCategory.EXOTICS) {
        if (baskingTemp !== '') entry.basking_temp_c = Number(baskingTemp);
        if (coolTemp !== '') entry.cool_temp_c = Number(coolTemp);
        entry.value = `Basking: ${baskingTemp}°C, Cool: ${coolTemp}°C`;
      } else {
        if (temperature !== '') entry.temperature_c = Number(temperature);
        entry.value = `${temperature}°C`;
      }
    }

    if (logType === LogType.HEALTH) {
      entry.health_record_type = healthRecordType;
      entry.value = healthRecordType;
    }

    onSave(entry);
  };

  const renderFields = () => {
    switch (logType) {
      case LogType.WEIGHT:
        return (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight (grams)</label>
            <input 
              type="number" 
              value={weightGrams} 
              onChange={e => setWeightGrams(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
              required
            />
          </div>
        );
      case LogType.FEED:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Food Item / Amount</label>
              <input 
                type="text" 
                value={value} 
                onChange={e => setValue(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
                placeholder="e.g. 2 mice, 50g crickets"
                required
              />
            </div>
            {foodOptions.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Select Food</label>
                <div className="flex flex-wrap gap-2">
                  {foodOptions.map(food => (
                    <button 
                      key={food} 
                      type="button" 
                      onClick={() => setValue(prev => prev ? `${prev}, ${food}` : food)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      {food}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {feedMethods.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Method</label>
                <div className="flex flex-wrap gap-2">
                  {feedMethods.map(method => (
                    <button 
                      key={method} 
                      type="button" 
                      onClick={() => setNotes(prev => prev ? `${prev} | ${method}` : method)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case LogType.TEMPERATURE:
        if (animal.category === AnimalCategory.EXOTICS) {
          return (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Basking Temp (°C)</label>
                <input 
                  type="number" 
                  value={baskingTemp} 
                  onChange={e => setBaskingTemp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cool Temp (°C)</label>
                <input 
                  type="number" 
                  value={coolTemp} 
                  onChange={e => setCoolTemp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
                  required
                />
              </div>
            </div>
          );
        }
        return (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Temperature (°C)</label>
            <input 
              type="number" 
              value={temperature} 
              onChange={e => setTemperature(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
              required
              disabled={isWeatherLoading}
            />
            {isWeatherLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 mt-2">
                <Loader2 size={14} className="animate-spin" />
                <span>☁️ Auto-fetching local weather...</span>
              </div>
            )}
            {!isWeatherLoading && defaultTemperature !== undefined && !existingLog && temperature === defaultTemperature && (
              <p className="text-xs text-slate-500 mt-1">Auto-filled from local weather</p>
            )}
          </div>
        );
      case LogType.EVENT:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Event Type</label>
              <select 
                value={value} 
                onChange={e => setValue(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
                required
              >
                <option value="">Select Event...</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case LogType.HEALTH:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Record Type</label>
              <input 
                type="text" 
                value={healthRecordType} 
                onChange={e => setHealthRecordType(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
                placeholder="e.g. Medication, Vet Visit, Observation"
                required
              />
            </div>
          </div>
        );
      case LogType.MISTING:
      case LogType.WATER:
      case LogType.GENERAL:
      default:
        return (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Value / Detail</label>
            <input 
              type="text" 
              value={value} 
              onChange={e => setValue(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold"
              placeholder={logType === LogType.MISTING ? 'e.g. Heavy mist' : logType === LogType.WATER ? 'e.g. Changed water' : 'Enter detail...'}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {existingLog ? 'Edit' : 'Add'} {logType}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{animal.name} ({animal.species})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
              <select 
                value={logType} 
                onChange={e => setLogType(e.target.value as LogType)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-sm"
              >
                {Object.values(LogType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {renderFields()}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-medium text-sm min-h-[100px] resize-none"
              placeholder="Add any additional observations..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:border-slate-300 transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <Save size={16} /> {existingLog ? 'Update' : 'Save'} Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
