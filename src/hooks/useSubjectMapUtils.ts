import { SubjectNode } from '../types/database';

export interface UseSubjectMapUtilsProps {
  subjects: SubjectNode[];
  hoveredSubject: number | null;
}

export const useSubjectMapUtils = ({
  subjects,
  hoveredSubject
}: UseSubjectMapUtilsProps) => {
  // Obtener el color del borde según la criticidad de la materia
  const getNodeBorderColor = (subject: SubjectNode): string => {
    // Aquí deberíamos tener una función que calcule la criticidad
    // basada en cuántas materias dependen de esta
    const criticalityScore = getCriticalityScore(subject, subjects);
    
    if (criticalityScore >= 5) {
      return 'red';
    } else if (criticalityScore >= 3) {
      return 'orange';
    }
    
    return 'transparent';
  };
  
  // Calcular puntaje de criticidad (cuántas materias dependen de esta)
  const getCriticalityScore = (subject: SubjectNode, allSubjects: SubjectNode[]): number => {
    return allSubjects.filter(s => s.prerequisites.some(prereq => {
      if (typeof prereq === 'object' && prereq.code) {
        return prereq.code === subject.code;
      } else if (typeof prereq === 'number') {
        return prereq === subject.subjectid;
      } else {
        return String(prereq) === subject.code;
      }
    })).length;
  };
  
  // Verificar si una materia está habilitada para ser marcada
  const isSubjectEnabled = (subject: SubjectNode): boolean => {
    // Una materia está habilitada si está aprobada o
    // si todos sus prerrequisitos están aprobados
    if (subject.status === 'approved') {
      return true;
    }
    
    // Si no tiene prerrequisitos, está habilitada
    if (!subject.prerequisites || subject.prerequisites.length === 0) {
      return true;
    }
    
    // Caso Legacy: verificar si hay algún formato antiguo de prerrequisitos
    for (const prereq of subject.prerequisites) {
      let prereqSubject;
      
      if (typeof prereq === 'object' && prereq.code) {
        prereqSubject = subjects.find(s => s.code === prereq.code);
      } else if (typeof prereq === 'number') {
        // Caso legacy - advertencia
        console.log('ADVERTENCIA: Formato de prerrequisito antiguo detectado');
        prereqSubject = subjects.find(s => s.subjectid === prereq);
      } else {
        prereqSubject = subjects.find(s => s.code === String(prereq));
      }
      
      // Si no se encuentra el prerrequisito o no está aprobado
      if (!prereqSubject || prereqSubject.status !== 'approved') {
        return false;
      }
    }
    
    return true;
  };
  
  // Verificar si una materia está correlativa con la que está siendo observada
  const isCorrelative = (subject: SubjectNode): boolean => {
    if (!hoveredSubject) return false;
    
    // Encontrar la materia que está siendo observada
    const hoveredSubjectObj = subjects.find(s => s.subjectid === hoveredSubject);
    if (!hoveredSubjectObj) return false;
    
    // Verificar si esta materia es un prerrequisito de la observada
    const isPrerequisite = hoveredSubjectObj.prerequisites.some(prereq => {
      if (typeof prereq === 'object' && prereq.code) {
        return prereq.code === subject.code;
      } else if (typeof prereq === 'number') {
        return prereq === subject.subjectid;
      } else {
        return String(prereq) === subject.code;
      }
    });
    
    // Verificar si la materia observada es un prerrequisito de esta
    const isDependentOn = subject.prerequisites.some(prereq => {
      if (typeof prereq === 'object' && prereq.code) {
        return prereq.code === hoveredSubjectObj.code;
      } else if (typeof prereq === 'number') {
        return prereq === hoveredSubjectObj.subjectid;
      } else {
        return String(prereq) === hoveredSubjectObj.code;
      }
    });
    
    return isPrerequisite || isDependentOn;
  };
  
  return {
    getNodeBorderColor,
    isSubjectEnabled,
    isCorrelative
  };
}; 