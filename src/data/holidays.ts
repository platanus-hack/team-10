export interface Holiday {
    id: string;
    name: string;
    date: string; // ISO date string without year (MM-DD)
  }

export const holidays: Holiday[] = [
    {
        id: 'ano-nuevo',
        name: 'Año Nuevo',
        date: '01-01',
    },
    {
        id: 'fiestas-patrias',
        name: 'Fiestas Patrias',
        date: '09-18',
    },
    {
        id: 'navidad',
        name: 'Navidad',
        date: '12-24',
    },
    {
        id: 'halloween',
        name: 'Halloween',
        date: '10-31',
    }
]; 