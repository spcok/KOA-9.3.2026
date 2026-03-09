import React, { useState, useEffect } from 'react';
import { Animal, LogEntry, LogType, AnimalCategory } from '../../types';
import { useDailyLogData } from './useDailyLogData';
import AddEntryModal from './AddEntryModal';
import { getMaidstone1300Weather } from '../../services/weatherService';
import { Cloud, Loader2 } from 'lucide-react';

const DailyLog: React.FC = () => {
  const [viewDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<AnimalCategory>(AnimalCategory.OWLS);
  const { animals, getTodayLog, addLogEntry } = useDailyLogData(viewDate, activeCategory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedType, setSelectedType] = useState<LogType>(LogType.GENERAL);
  const [weatherLoading, setWeatherLoading] = useState<Record<string, boolean>>({});

  const categories = [
    AnimalCategory.OWLS,
    AnimalCategory.RAPTORS,
    AnimalCategory.MAMMALS,
    AnimalCategory.EXOTICS
  ];

  useEffect(() => {
    const fetchMissingWeather = async () => {
      if (activeCategory === AnimalCategory.OWLS || activeCategory === AnimalCategory.RAPTORS) {
        for (const animal of animals) {
          if (!getTodayLog(animal.id, LogType.TEMPERATURE)) {
            setWeatherLoading(prev => ({ ...prev, [animal.id]: true }));
            try {
              const weather = await getMaidstone1300Weather();
              await addLogEntry({
                id: crypto.randomUUID(),
                animal_id: animal.id,
                log_type: LogType.TEMPERATURE,
                log_date: viewDate,
                value: `${Math.round(weather.temperature)}°C`,
                notes: weather.description
              });
            } catch (error) {
              console.error('Failed to auto-fetch weather', error);
            } finally {
              setWeatherLoading(prev => ({ ...prev, [animal.id]: false }));
            }
          }
        }
      }
    };
    fetchMissingWeather();
  }, [animals, getTodayLog, addLogEntry, viewDate, activeCategory]);

  const handleMammalWeatherFetch = async (animal: Animal) => {
    setWeatherLoading(prev => ({ ...prev, [animal.id]: true }));
    try {
      const weather = await getMaidstone1300Weather();
      await addLogEntry({
        id: crypto.randomUUID(),
        animal_id: animal.id,
        log_type: LogType.TEMPERATURE,
        log_date: viewDate,
        value: `${Math.round(weather.temperature)}°C`,
        notes: weather.description
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
      
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

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
                    <button onClick={() => openModal(animal, LogType.TEMPERATURE)} className="text-xs font-bold text-slate-600 hover:text-emerald-600">
                      {getTodayLog(animal.id, LogType.TEMPERATURE)?.value || 'Basking / Cool'}
                    </button>
                  ) : animal.category === AnimalCategory.MAMMALS ? (
                    <>
                      <button onClick={() => openModal(animal, LogType.TEMPERATURE)} className="text-xs font-bold text-slate-600 hover:text-emerald-600">
                        {getTodayLog(animal.id, LogType.TEMPERATURE)?.value || '--'}
                      </button>
                      <button onClick={() => handleMammalWeatherFetch(animal)} className="p-1.5 bg-sky-100 hover:bg-sky-200 rounded-lg text-sky-600">
                        {weatherLoading[animal.id] ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => openModal(animal, LogType.TEMPERATURE)} className="text-xs font-bold text-slate-600 hover:text-emerald-600">
                      {getTodayLog(animal.id, LogType.TEMPERATURE)?.value || '--'}
                    </button>
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
