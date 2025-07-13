export interface Tool {
  id: string;
  path: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    darkMode: boolean;
    layout: 'sidebar' | 'grid';
  };
}