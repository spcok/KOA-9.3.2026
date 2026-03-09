import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, LogEntry, LogType, AnimalCategory } from '../../../types';
import { getMaidstoneDailyWeather } from '../../../services/weatherService';

export const useWeatherSync = (
  animals: Animal[],
  getTodayLog: (animalId: string, type: LogType) => LogEntry | undefined,
  addLogEntry: (entry: LogEntry) => Promise<void>,
  viewDate: string
) => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncWeather = async () => {
      const today = new Date().toISOString().split('T')[0];
      if (viewDate !== today) return;
      if (animals.length === 0) return;

      const birdsToSync = animals.filter(
        animal =>
          (animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) &&
          !getTodayLog(animal.id, LogType.TEMPERATURE)
      );

      if (birdsToSync.length === 0) return;

      setIsSyncing(true);
      try {
        const weather = await getMaidstoneDailyWeather();
        
        for (const bird of birdsToSync) {
          await addLogEntry({
            id: uuidv4(),
            animal_id: bird.id,
            log_type: LogType.TEMPERATURE,
            log_date: viewDate,
            value: `${Math.round(weather.currentTemp)}°C`,
            notes: weather.description
          });
        }
      } catch (error) {
        console.error('Failed to auto-sync weather for birds:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWeather();
  }, [animals, getTodayLog, addLogEntry, viewDate]);

  return { isSyncing };
};
