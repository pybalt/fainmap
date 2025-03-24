import React, { useEffect, useRef } from 'react';
import type { Theme } from '../types/theme';

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  theme: Theme;
  grade?: number;
  onGradeClick: () => void;
  status: 'pending' | 'in_progress' | 'approved';
  name: string;
  code: string;
}

const SubjectContextMenu: React.FC<Props> = ({
  x,
  y,
  onClose,
  theme,
  grade,
  onGradeClick,
  status,
  name,
  code
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Ajustar posición horizontal si se sale de la pantalla
      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${viewportWidth - rect.width - 8}px`;
      }

      // Ajustar posición vertical si se sale de la pantalla
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${viewportHeight - rect.height - 8}px`;
      }
    }
  }, [x, y]);

  return (
    <>
      {/* Backdrop con blur */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
        onClick={onClose}
      />
      
      <div
        ref={menuRef}
        className={`
          absolute z-[1000] rounded-lg shadow-lg
          ${theme.cardBg} ${theme.textColor}
          border border-gray-200 dark:border-gray-700
          animate-fadeIn
        `}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          minWidth: '200px',
          transform: 'translate(4px, 0)'
        }}
      >
        <div className="py-1">
          <div className="px-4 py-2 text-sm font-semibold border-b border-gray-200 dark:border-gray-700">
            Detalles de la materia
          </div>

          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-[auto,1fr] gap-x-2 text-sm">
              <span className="text-gray-500">Nombre:</span>
              <span className="font-medium truncate">{name}</span>
              <span className="text-gray-500">Código:</span>
              <span className="font-medium">{code}</span>
            </div>
          </div>
          
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profesores</span>
              <span className="text-xs italic">(Próximamente)</span>
            </div>
            
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Apuntes</span>
              <span className="text-xs italic">(Próximamente)</span>
            </div>

            {status === 'approved' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGradeClick();
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Nota: {grade || 'No registrada'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubjectContextMenu; 