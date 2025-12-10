
export interface User {
  name: string;
  email: string;
  gender?: 'male' | 'female';
  age?: number;
  height?: number; // cm
  weight?: number; // kg
}

export interface Mission {
  id: string;
  title: string;
  Icon: string;
  description: string;
  points: number;
  remindable?: boolean;
  reminderConfig?: {
    type: 'daily' | 'interval';
    time?: string;
    hours?: number;
    startHour?: number;
    endHour?: number;
  };
}

export interface WellnessProgram {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  Icon: string;
  numWeeks: number;
  daily?: Mission[];
  weekly?: Mission[];
  dailyTarget?: number;
  dailyMaxTarget?: number;
  weeklyMinTarget?: number;
  weeklyMaxTarget?: number;
  unlocksAt?: number;
  dependsOn?: string;
  isSmart?: boolean;
}

export interface WellnessProgramsData {
    [key: string]: WellnessProgram;
}
