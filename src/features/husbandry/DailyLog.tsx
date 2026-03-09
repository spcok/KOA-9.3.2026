import React, { useState, useEffect } from 'react';
import { Animal, LogEntry, LogType } from '../../types';
import { useDailyLogData } from './useDailyLogData';
import AddEntryModal from './AddEntryModal';
import { getFullWeather } from '../../services/weatherService';
import { AnimalCategory } from '../../types';
import { Cloud, Loader2 } from 'lucide-react';

const DailyLog: React.FC = () => {
  const [viewDate] = useState(new Date().toISOString().split('T')[0]);
  const { animals, getTodayLog, addLogEntry } = useDailyLogData(viewDate, 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedType, setSelectedType] = useState<LogType>(LogType.GENERAL);
  const [weatherLoading, setWeatherLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMissingWeather = async () => {
      for (const animal of animals) {
        if ((animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) && !getTodayLog(animal.id, LogType.TEMPERATURE)) {
          setWeatherLoading(prev => ({ ...prev, [animal.id]: true }));
          try {
            const weather = await getFullWeather();
            await addLogEntry({
              animal_id: animal.id,
              log_type: LogType.TEMPERATURE,
              log_date: viewDate,
              value: `${Math.round(weather.current.temperature)}°C`,
              notes: weather.current.description
            });
          } catch (error) {
            console.error('Failed to auto-fetch weather', error);
          } finally {
            setWeatherLoading(prev => ({ ...prev, [animal.id]: false }));
          }
        }
      }
    };
    fetchMissingWeather();
  }, [animals, getTodayLog, addLogEntry, viewDate]);

  const handleWeatherClick = async (animal: Animal) => {
    setWeatherLoading(prev => ({ ...prev, [animal.id]: true }));
    try {
      const weather = await getFullWeather();
      await addLogEntry({
        animal_id: animal.id,
        log_type: LogType.TEMPERATURE,
        log_date: viewDate,
        value: `${Math.round(weather.current.temperature)}°C`,
        notes: weather.current.description
      });
    } catch (error) {
      console.error('Failed to fetch weather', error);
    } finally {
      setWeatherLoading(prev => ({ ...prev, [animal.id]: false }));
    }
  };

  const openModal = (animal: Animal, type: LogType) => {
    setSelectedAnimal(animal);
    setSelectedType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">Daily Operations - {viewDate}</h1>
      <table className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Animal</th>
            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">WT</th>
            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">ENV</th>
            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">FEED</th>
          </tr>
        </thead>
        <tbody>
          {animals.map(animal => (
            <tr key={animal.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-4 flex items-center gap-3">
                <img src={animal.image_url || '/placeholder.png'} alt={animal.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-slate-800">{animal.name}</div>
                  <div className="text-xs text-slate-500">{animal.species}</div>
                </div>
              </td>
              <td className="p-4">
                <button onClick={() => openModal(animal, LogType.WEIGHT)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">
                  {getTodayLog(animal.id, LogType.WEIGHT)?.value || '--'}
                </button>
              </td>
              <td className="p-4">
                <div className="flex gap-2 items-stretch">
                  {animal.category === AnimalCategory.EXOTICS ? (
                    <span className="text-xs font-bold text-slate-600 self-center">Basking / Cool</span>
                  ) : animal.category === AnimalCategory.MAMMALS ? (
                    <>
                      <span className="text-xs font-bold text-slate-600 self-center">{getTodayLog(animal.id, LogType.TEMPERATURE)?.value || '--'}</span>
                      <button onClick={() => handleWeatherClick(animal)} className="p-1.5 bg-sky-100 hover:bg-sky-200 rounded-lg text-sky-600">
                        {weatherLoading[animal.id] ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 self-center">{getTodayLog(animal.id, LogType.TEMPERATURE)?.value || '--'}</span>
                  )}
                </div>
              </td>
              <td className="p-4">
                <button onClick={() => openModal(animal, LogType.FEED)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                  {getTodayLog(animal.id, LogType.FEED)?.value || 'Feed'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && selectedAnimal && (
        <AddEntryModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={async (entry) => {
            await addLogEntry(entry as LogEntry);
            setIsModalOpen(false);
          }}
          animal={selectedAnimal}
          initialType={selectedType}
          foodOptions={[]}
          feedMethods={[]}
          eventTypes={[]}
          initialDate={viewDate}
          allAnimals={animals}
        />
      )}
    </div>
  );
};

export default DailyLog;
