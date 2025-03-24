import { useNavigate } from 'react-router-dom';
import type { Career } from '../types/database';
import type { Theme } from '../types/theme';
import StatsDisplay from './StatsDisplay';

interface HeaderProps {
  currentTheme: Theme;
  selectedCareer: number | null;
  careers: Career[];
  stats: {
    progress: number;
    weightedProgress: number;
    inProgress: number;
    average: string;
  };
  onCareerChange: (careerid: number) => void;
  onReload?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentTheme,
  selectedCareer,
  careers,
  stats,
  onCareerChange,
  onReload
}) => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  return (
    <header className={`${currentTheme.headerBg} shadow transition-colors duration-200 fixed top-0 left-0 right-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-start">
          <div className="space-y-3">
            <h1 className={`text-xl md:text-2xl font-bold ${currentTheme.textColor}`}>
              Mapa de Correlatividades
            </h1>
            <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:gap-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Legajo: </span>
                {localStorage.getItem('userLegajo')}
              </div>
              <div className="relative">
                <select
                  value={selectedCareer || ''}
                  onChange={(e) => onCareerChange(Number(e.target.value))}
                  className="w-full md:w-auto text-sm border rounded-md py-1.5 pl-2 pr-6 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    minWidth: isMobile ? 'auto' : '200px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  <option value="">Seleccionar carrera</option>
                  {careers.map(career => (
                    <option key={career.careerid} value={career.careerid}>
                      {career.name}
                    </option>
                  ))}
                </select>
              </div>
              <StatsDisplay stats={stats} />
            </div>
          </div>
          <div className="flex gap-2">
            {onReload && (
              <button
                onClick={onReload}
                className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700"
                title="Recargar datos desde el servidor"
              >
                Actualizar
              </button>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('userLegajo');
                navigate('/');
              }}
              className="w-full md:w-auto bg-red-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 