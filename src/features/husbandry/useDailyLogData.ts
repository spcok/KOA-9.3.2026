import { useState, useEffect, useCallback } from 'react';
import { LogEntry, LogType } from '../../types';
import { db } from '../../lib/db';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (viewDate: string, activeCategory: string) => {
  const { animals } = useAnimalsData();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchLogs = useCallback(async () => {
    const allLogs = await db.daily_logs.toArray();
    return allLogs.filter(log => log.log_date === viewDate);
  }, [viewDate]);

  useEffect(() => {
    let isMounted = true;
    fetchLogs().then(logs => {
      if (isMounted) setLogs(logs);
    });
    return () => { isMounted = false; };
  }, [fetchLogs]);

  const getTodayLog = (animalId: string, type: LogType) => {
    return logs.find(log => log.animal_id === animalId && log.log_type === type);
  };

  const addLogEntry = async (entry: Partial<LogEntry>) => {
    await db.daily_logs.add(entry as LogEntry);
    await fetchLogs().then(logs => setLogs(logs));
  };

  const filteredAnimals = animals.filter(a => activeCategory === 'all' || a.category === activeCategory);

  return { animals: filteredAnimals, getTodayLog, addLogEntry };
};
