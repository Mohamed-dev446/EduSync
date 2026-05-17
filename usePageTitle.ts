import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendario Académico',
  '/classes': 'Mis Clases',
  '/assignments': 'Tareas',
  '/attendance': 'Control de Asistencia',
  '/students': 'Alumnos',
  '/users': 'Gestión de Usuarios',
  '/statistics': 'Estadísticas',
  '/notifications': 'Notificaciones',
  '/profile': 'Mi Perfil',
};

export function usePageTitle(): string {
  const location = useLocation();
  return PAGE_TITLES[location.pathname] || 'EduSync';
}
