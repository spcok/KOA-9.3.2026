import React, { ReactNode } from 'react';
import { AnimalCategory, UserRole } from '../types';
import { AppContext, AppContextType } from './Context';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: AppContextType = {
    foodOptions: ['Day Old Chick', 'Mouse (S)', 'Mouse (M)', 'Mouse (L)', 'Rat (S)', 'Rat (M)', 'Quail', 'Rabbit'],
    feedMethods: {
      [AnimalCategory.OWLS]: ['Hand Fed', 'Bowl Fed', 'Tongs'],
      [AnimalCategory.RAPTORS]: ['Hand Fed', 'Bowl Fed', 'Tongs'],
      [AnimalCategory.MAMMALS]: ['Bowl Fed', 'Scatter Fed'],
      [AnimalCategory.EXOTICS]: ['Tongs', 'Bowl Fed'],
    },
    eventTypes: ['Training', 'Public Display', 'Medical Treatment', 'Cleaning', 'Moulting'],
    activeShift: null,
    clockIn: async () => {},
    clockOut: async () => {},
    orgProfile: {
      name: 'Kent Owl Academy',
      logo_url: 'https://picsum.photos/seed/koa/200/200',
    },
    users: [
      { id: '1', email: 'admin@koa.com', name: 'John Doe', role: UserRole.ADMIN, initials: 'JD' },
      { id: '2', email: 'volunteer@koa.com', name: 'Jane Smith', role: UserRole.VOLUNTEER, initials: 'JS' }
    ]
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
