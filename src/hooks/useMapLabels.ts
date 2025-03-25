import { useMemo } from 'react';
import { SubjectNode, YearLabel, QuarterLabel } from '../types/database';

/**
 * Hook para generar las etiquetas de años y cuatrimestres en el mapa de materias
 */
export const useMapLabels = (subjects: SubjectNode[]) => {
  // Calcular etiquetas de años y cuatrimestres
  const yearLabels = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      if (subject.position && subject.suggested_year !== undefined) {
        const existingLabel = acc.find(label => label.year === subject.suggested_year);
        if (!existingLabel) {
          acc.push({
            year: subject.suggested_year,
            x: subject.position.x - 90,
            y: subject.position.y + 50
          });
        }
      }
      return acc;
    }, [] as YearLabel[]);
  }, [subjects]);

  const quarterLabels = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      if (subject.position && subject.suggested_year !== undefined && subject.suggested_quarter !== undefined) {
        const existingLabel = acc.find(label => 
          label.year === subject.suggested_year && label.quarter === subject.suggested_quarter
        );
        
        if (!existingLabel) {
          acc.push({
            year: subject.suggested_year,
            quarter: subject.suggested_quarter,
            x: subject.position.x - 35,
            y: subject.position.y + 25
          });
        }
      }
      return acc;
    }, [] as QuarterLabel[]);
  }, [subjects]);

  return {
    yearLabels,
    quarterLabels
  };
}; 