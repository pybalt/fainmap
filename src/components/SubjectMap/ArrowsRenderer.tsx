import React, { useMemo } from 'react';
import type { SubjectNode } from '../../types/database';
import Arrow from '../Arrow';

interface ArrowsRendererProps {
  subjects: SubjectNode[];
  hoveredSubject: number | null;
  isDarkMode: boolean;
}

const ArrowsRenderer: React.FC<ArrowsRendererProps> = ({ 
  subjects, 
  hoveredSubject, 
  isDarkMode 
}) => {
  const arrows = useMemo(() => {
    return subjects.flatMap(subject => 
      subject.prerequisites.map(prereq => {
        // Buscar el prerrequisito SIEMPRE por código
        let prerequisiteCode;
        
        // Determinar el código del prerrequisito según el formato
        if (typeof prereq === 'object' && prereq.code) {
          prerequisiteCode = prereq.code;
        } else if (typeof prereq === 'object' && prereq.id) {
          // Esto es un caso de fallback, pero no debería ocurrir
          console.log(`Advertencia: Prerrequisito con ID sin código para ${subject.code}`);
          return null;
        } else if (typeof prereq === 'number') {
          // Caso legacy - intenta obtener el código por ID
          console.log(`Advertencia: Prerrequisito numérico (legacy) para ${subject.code}`);
          return null;
        } else {
          prerequisiteCode = String(prereq);
        }
        
        // Buscar el prerrequisito por código
        const prerequisite = subjects.find(s => s.code === prerequisiteCode);
        
        // Si no se encuentra el prerrequisito, registrarlo
        if (!prerequisite) {
          console.log(`Prerrequisito con código ${prerequisiteCode} no encontrado para ${subject.code}`);
          return null;
        }

        const isHighlighted = hoveredSubject && 
          (hoveredSubject === subject.subjectid || hoveredSubject === prerequisite.subjectid);

        // Asegurar que las posiciones son válidas
        if (!prerequisite.position || !subject.position) {
          console.log(`Posición inválida para ${prerequisiteCode} -> ${subject.code}`);
          return null;
        }

        // Usar colores más intensos para depuración
        const arrowColor = isHighlighted ? '#0066FF' : 
                          (subject.status === 'approved' ? '#00AA00' : 
                          isDarkMode ? '#AAAAAA' : '#666666');

        const isMobile = window.innerWidth < 768;
        
        return (
          <Arrow
            key={`${prerequisite.code}-${subject.code}`}
            start={{ 
              x: prerequisite.position.x + (isMobile ? 140 : 180), 
              y: prerequisite.position.y + (isMobile ? 40 : 50)
            }}
            end={{ 
              x: subject.position.x, 
              y: subject.position.y + (isMobile ? 40 : 50)
            }}
            color={arrowColor}
          />
        );
      }).filter(Boolean)
    );
  }, [subjects, hoveredSubject, isDarkMode]);

  return <>{arrows}</>;
};

export default ArrowsRenderer; 