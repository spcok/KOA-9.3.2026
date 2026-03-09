import { db } from '@/src/lib/db';
import { Timesheet, TimesheetStatus } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';
import { useHybridQuery, mutateOnlineFirst } from '@/src/lib/dataEngine';
import { supabase } from '@/src/lib/supabase';

export function useTimesheetData() {
  const timesheets = useHybridQuery<Timesheet[]>(
    'timesheets',
    supabase.from('timesheets').select('*'),
    () => db.timesheets.toArray(),
    []
  );

  const addTimesheet = async (timesheet: Omit<Timesheet, 'id'>) => {
    const newTimesheet = {
      ...timesheet,
      id: uuidv4()
    };
    await mutateOnlineFirst('timesheets', newTimesheet as unknown as Record<string, unknown>, 'upsert');
  };

  const deleteTimesheet = async (id: string) => {
    await mutateOnlineFirst('timesheets', { id }, 'delete');
  };

  const seedTimesheets = async () => {
    const count = await db.timesheets.count();
    if (count === 0) {
      const seeds = [
        {
          id: uuidv4(),
          staff_name: 'John Doe',
          date: new Date().toISOString().split('T')[0],
          clock_in: '08:00',
          clock_out: '16:00',
          total_hours: 8,
          notes: 'Completed shift',
          status: TimesheetStatus.COMPLETED
        },
        {
          id: uuidv4(),
          staff_name: 'Jane Smith',
          date: new Date().toISOString().split('T')[0],
          clock_in: '09:00',
          status: TimesheetStatus.ACTIVE
        }
      ];
      
      for (const seed of seeds) {
        await mutateOnlineFirst('timesheets', seed as unknown as Record<string, unknown>, 'upsert');
      }
    }
  };

  return {
    timesheets: timesheets || [],
    addTimesheet,
    deleteTimesheet,
    seedTimesheets
  };
}
