import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Career, SubjectNode as SubjectNodeType, UserProgress, YearLabel, QuarterLabel } from '../types/database';
import type { Theme } from '../types/theme';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SubjectMap from '../components/SubjectMap';

// Constante para el tiempo de vencimiento de las carreras (3 semanas)
const CAREERS_CACHE_DURATION = 1000 * 60 * 60 * 24 * 21; // 21 días

interface CriticalityScore {
  subjectId: number;
  score: number;
}

interface NodePosition {
  x: number;
  y: number;
}

interface NodeWithPosition extends SubjectNodeType {
  position: NodePosition;
  suggested_year: number;
  suggested_quarter: number;
}

interface LayoutData {
  subjects: SubjectNodeType[];
  yearLabels: YearLabel[];
  quarterLabels: QuarterLabel[];
}

const CARD_WIDTH = window.innerWidth < 768 ? 140 : 180;
const CARD_HEIGHT = window.innerWidth < 768 ? 80 : 100;
const MARGIN_X = window.innerWidth < 768 ? 80 : 150;
const MARGIN_Y = window.innerWidth < 768 ? 30 : 50;
const YEAR_SPACING = window.innerWidth < 768 ? 50 : 100;
const QUARTER_SPACING = window.innerWidth < 768 ? 30 : 50;
const HEADER_HEIGHT = 30;

// Función para detectar colisiones entre nodos
const doNodesCollide = (node1: NodePosition, node2: NodePosition): boolean => {
  return Math.abs(node1.x - node2.x) < CARD_WIDTH && 
         Math.abs(node1.y - node2.y) < CARD_HEIGHT;
};

// Función para resolver colisiones entre nodos
const resolveCollisions = (nodes: NodeWithPosition[]): NodeWithPosition[] => {
  const sortedNodes = [...nodes].sort((a, b) => 
    a.suggested_year === b.suggested_year ? 
      a.suggested_quarter - b.suggested_quarter : 
      a.suggested_year - b.suggested_year
  );

  for (let i = 0; i < sortedNodes.length; i++) {
    const currentNode = sortedNodes[i];
    let hasCollision;
    
    do {
      hasCollision = false;
      for (let j = 0; j < i; j++) {
        if (doNodesCollide(currentNode.position, sortedNodes[j].position)) {
          hasCollision = true;
          currentNode.position.y += CARD_HEIGHT + MARGIN_Y;
          break;
        }
      }
    } while (hasCollision);
  }

  return sortedNodes;
};

// Función para calcular las posiciones iniciales
const calculateInitialPositions = (subjects: SubjectNodeType[]): LayoutData => {
  const maxYear = Math.max(...subjects.map(s => s.suggested_year || 1));
  const maxQuarter = Math.max(...subjects.map(s => s.suggested_quarter || 1));

  const yearLabels: YearLabel[] = [];
  const quarterLabels: QuarterLabel[] = [];

  // Generar etiquetas de años y cuatrimestres
  for (let year = 1; year <= maxYear; year++) {
    const yearX = (year - 1) * (CARD_WIDTH + MARGIN_X + YEAR_SPACING) + MARGIN_X;
    yearLabels.push({ year, x: yearX, y: 10 });

    for (let quarter = 1; quarter <= maxQuarter; quarter++) {
      const quarterX = yearX + (quarter - 1) * (CARD_WIDTH + QUARTER_SPACING);
      quarterLabels.push({ year, quarter, x: quarterX, y: HEADER_HEIGHT });
    }
  }

  // Calcular posiciones iniciales de las materias
  const materiasConPosicion = subjects.map(subject => {
    const year = subject.suggested_year || 1;
    const quarter = subject.suggested_quarter || 1;
    
    let baseY = HEADER_HEIGHT * 2;
    if (subject.prerequisites.length > 0) {
      const prerequisiteYs = subject.prerequisites.map(prereqId => {
        const prereq = subjects.find(s => s.subjectid === prereqId);
        return prereq?.position?.y || baseY;
      });
      baseY = Math.max(...prerequisiteYs);
    }

    const baseX = (year - 1) * (CARD_WIDTH + MARGIN_X + YEAR_SPACING) + MARGIN_X;
    const x = baseX + (quarter - 1) * (CARD_WIDTH + QUARTER_SPACING);
    
    return {
      ...subject,
      position: { x, y: baseY }
    };
  });

  const subjectsWithCollisions = resolveCollisions(materiasConPosicion);

  return {
    subjects: subjectsWithCollisions,
    yearLabels,
    quarterLabels
  };
};

// Agregar interfaces para los datos de Supabase
interface CareerSubject {
  subjectid: number;
  suggested_year: number;
  suggested_quarter: number;
  subjects: {
    subjectid: number;
    code: string;
    name: string;
  };
}

// Modificar la función loadSubjectsWithPrerequisites
const loadSubjectsWithPrerequisites = async (careerid: number): Promise<LayoutData> => {
  console.log('Cargando materias para carrera:', careerid);
  
  // Intentar cargar desde localStorage
  const cachedSubjectsKey = `mapped_subjects_${careerid}`;
  const cachedSubjects = localStorage.getItem(cachedSubjectsKey);
  
  if (cachedSubjects) {
    const parsedSubjects = JSON.parse(cachedSubjects);
    console.log('Usando materias cacheadas');
    return calculateInitialPositions(parsedSubjects);
  }

  // Si no hay caché, cargar de la base de datos
  const { data: careerSubjectsData, error: careerSubjectsError } = await supabase
    .from('careersubjects_enhanced')
    .select(`
      subjectid,
      suggested_year,
      suggested_quarter,
      subjects (
        subjectid,
        code,
        name
      )
    `)
    .eq('careerid', careerid) as { data: CareerSubject[] | null, error: any };

  if (careerSubjectsError) throw careerSubjectsError;
  if (!careerSubjectsData || careerSubjectsData.length === 0) {
    console.log('No se encontraron materias para la carrera');
    return { subjects: [], yearLabels: [], quarterLabels: [] };
  }

  const { data: prerequisitesData, error: prerequisitesError } = await supabase
    .from('prerequisites_enhanced')
    .select('*');

  if (prerequisitesError) throw prerequisitesError;

  // Mapear los datos
  const mappedSubjects = careerSubjectsData.map(cs => {
    if (!cs.subjects) {
      console.error('Materia sin datos:', cs);
      return null;
    }
    return {
      subjectid: cs.subjectid,
      code: cs.subjects.code,
      name: cs.subjects.name,
      status: 'pending' as SubjectNodeType['status'],
      prerequisites: prerequisitesData
        ?.filter(p => p.subjectid === cs.subjectid)
        .map(p => p.prerequisiteid) || [],
      suggested_year: cs.suggested_year,
      suggested_quarter: cs.suggested_quarter,
      position: { x: 0, y: 0 }
    } as SubjectNodeType;
  }).filter((subject): subject is SubjectNodeType => subject !== null);

  // Guardar en localStorage
  localStorage.setItem(cachedSubjectsKey, JSON.stringify(mappedSubjects));

  console.log('Materias procesadas:', mappedSubjects);
  return calculateInitialPositions(mappedSubjects);
};

const calculateWeightedProgress = (subjects: SubjectNodeType[], criticalNodes: Array<{ subjectId: number; score: number; }>): {
  weightedProgress: number;
  totalWeight: number;
  approvedWeight: number;
} => {
  // Obtener el máximo score para normalizar los pesos
  const maxScore = Math.max(...criticalNodes.map(node => node.score));
  
  // Calcular el peso de cada materia (mínimo 1, máximo 3)
  const getWeight = (subjectId: number): number => {
    const node = criticalNodes.find(n => n.subjectId === subjectId);
    if (!node) return 1;
    // Normalizar el score a un rango de 1 a 3
    return 1 + (node.score / maxScore) * 2;
  };

  // Calcular el peso total y el peso de las materias aprobadas
  const totalWeight = subjects.reduce((sum, subject) => sum + getWeight(subject.subjectid), 0);
  const approvedWeight = subjects
    .filter(s => s.status === 'approved')
    .reduce((sum, subject) => sum + getWeight(subject.subjectid), 0);

  return {
    weightedProgress: (approvedWeight / totalWeight) * 100,
    totalWeight,
    approvedWeight
  };
};

const themes: Theme[] = [
  {
    name: 'Light',
    bgColor: 'bg-gray-100',
    headerBg: 'bg-white',
    cardBg: 'bg-white',
    textColor: 'text-gray-900',
    secondaryText: 'text-gray-500'
  },
  {
    name: 'Dark',
    bgColor: 'bg-gray-900',
    headerBg: 'bg-gray-800',
    cardBg: 'bg-gray-800',
    textColor: 'text-white',
    secondaryText: 'text-gray-300'
  }
];

const Dashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectNodeType[]>([]);
  const [yearLabels, setYearLabels] = useState<YearLabel[]>([]);
  const [quarterLabels, setQuarterLabels] = useState<QuarterLabel[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Iniciando...');
  const [criticalNodes, setCriticalNodes] = useState<Array<{ subjectId: number; score: number; }>>([]);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[isDarkMode ? 1 : 0]);
  const studentid = localStorage.getItem('userLegajo');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Protección de ruta
  useEffect(() => {
    if (!studentid) {
      navigate('/');
    }
  }, [studentid, navigate]);

  // Cargar carreras
  useEffect(() => {
    const loadCareers = async () => {
      try {
        console.log('Cargando carreras...');
        setLoadingStatus('Verificando caché de carreras...');
        
        // Intentar cargar carreras desde localStorage
        const cachedCareersData = localStorage.getItem('careers_cache');
        if (cachedCareersData) {
          const { careers: cachedCareers, timestamp } = JSON.parse(cachedCareersData);
          const now = new Date().getTime();
          
          // Verificar si el caché no ha expirado (3 semanas)
          if (now - timestamp < CAREERS_CACHE_DURATION) {
            console.log('Usando caché de carreras');
            setCareers(cachedCareers);
            const savedCareer = localStorage.getItem('selectedCareer');
            if (savedCareer) {
              setSelectedCareer(parseInt(savedCareer));
            }
            return;
          }
        }

        // Si no hay caché o expiró, cargar desde la base de datos
        setLoadingStatus('Cargando carreras desde la base de datos...');
        const { data, error } = await supabase
          .from('careers_enhanced')
          .select('*');

        if (error) throw error;

        console.log('Carreras cargadas:', data);
        setCareers(data || []);

        // Guardar en caché con timestamp
        localStorage.setItem('careers_cache', JSON.stringify({
          careers: data,
          timestamp: new Date().getTime()
        }));

        const savedCareer = localStorage.getItem('selectedCareer');
        if (savedCareer) {
          console.log('Carrera guardada encontrada:', savedCareer);
          setSelectedCareer(parseInt(savedCareer));
        }
        
        if (!data || data.length === 0) {
          console.log('No se encontraron carreras');
          setLoadingStatus('No se encontraron carreras');
        }
      } catch (error) {
        console.error('Error al cargar carreras:', error);
        setLoadingStatus('Error al cargar carreras');
      }
    };

    loadCareers();
  }, []);

  // Cargar materias
  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedCareer || !studentid) {
        setLoading(false);
        return;
      }

      try {
        setLoadingStatus('Cargando materias...');
        
        // Cargar materias desde la base de datos
        const [layoutData, approvedResponse] = await Promise.all([
          loadSubjectsWithPrerequisites(selectedCareer),
          supabase
            .from('approvedsubjects_enhanced')
            .select('*')
            .eq('studentid', studentid)
        ]);

        if (approvedResponse.error) throw approvedResponse.error;

        const subjectsWithStatus = layoutData.subjects.map(subject => ({
          ...subject,
          status: approvedResponse.data.find(a => a.subjectid === subject.subjectid)
            ? 'approved' as const
            : 'pending' as const
        }));

        setSubjects(subjectsWithStatus);
        setYearLabels(layoutData.yearLabels);
        setQuarterLabels(layoutData.quarterLabels);
        
        // Guardar en localStorage sin caché de tiempo
        const progress: UserProgress = {
          studentid,
          careerid: selectedCareer,
          subjects: subjectsWithStatus.reduce((acc, subject) => ({
            ...acc,
            [subject.subjectid]: {
              status: subject.status,
              grade: subject.grade,
              position: subject.position
            }
          }), {}),
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`progress_${studentid}_${selectedCareer}`, JSON.stringify(progress));
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoadingStatus('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [selectedCareer]);

  const handleCareerChange = (careerid: number) => {
    setSelectedCareer(careerid);
    localStorage.setItem('selectedCareer', careerid.toString());
  };

  const handleSubjectStatusChange = async (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => {
    if (!studentid || !selectedCareer) return;

    try {
      // Actualizar en Supabase
      if (status === 'approved') {
        await supabase
          .from('approvedsubjects_enhanced')
          .upsert({
            studentid,
            subjectid: subjectId,
            grade: null,
            approvaldate: new Date().toISOString().split('T')[0]
          });
      } else {
        // Si no está aprobada, eliminar de approvedsubjects
        await supabase
          .from('approvedsubjects_enhanced')
          .delete()
          .eq('studentid', studentid)
          .eq('subjectid', subjectId);
      }

      // Actualizar estado local
      const updatedSubjects = subjects.map(subject =>
        subject.subjectid === subjectId
          ? { ...subject, status, grade: undefined }
          : subject
      );
      setSubjects(updatedSubjects);

      // Actualizar localStorage
      const progress: UserProgress = {
        studentid,
        careerid: selectedCareer,
        subjects: updatedSubjects.reduce((acc, subject) => ({
          ...acc,
          [subject.subjectid]: {
            status: subject.status,
            grade: subject.grade,
            position: subject.position
          }
        }), {}),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`progress_${studentid}_${selectedCareer}`, JSON.stringify(progress));

      console.log(`Materia ${subjectId} actualizada a estado: ${status}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado de la materia');
    }
  };

  const handleSubjectGradeChange = async (subjectId: number, grade: number) => {
    if (!studentid || !selectedCareer) return;

    try {
      // Actualizar en Supabase
      await supabase
        .from('approvedsubjects_enhanced')
        .upsert({
          studentid,
          subjectid: subjectId,
          grade,
          approvaldate: new Date().toISOString().split('T')[0]
        });

      // Actualizar estado local
      const updatedSubjects = subjects.map(subject =>
        subject.subjectid === subjectId
          ? { ...subject, grade }
          : subject
      );
      setSubjects(updatedSubjects);

      // Actualizar localStorage
      const progress: UserProgress = {
        studentid,
        careerid: selectedCareer,
        subjects: updatedSubjects.reduce((acc, subject) => ({
          ...acc,
          [subject.subjectid]: {
            status: subject.status,
            grade: subject.grade,
            position: subject.position
          }
        }), {}),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`progress_${studentid}_${selectedCareer}`, JSON.stringify(progress));

      console.log(`Nota actualizada para materia ${subjectId}: ${grade}`);
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      alert('Error al guardar la nota');
    }
  };

  // Función debounced para guardar en localStorage
  const debouncedSaveToLocalStorage = useCallback((studentid: string, careerid: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const progress: UserProgress = {
        studentid,
        careerid,
        subjects: subjects.reduce((acc, subject) => ({
          ...acc,
          [subject.subjectid]: {
            status: subject.status,
            grade: subject.grade,
            position: subject.position
          }
        }), {}),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`progress_${studentid}_${careerid}`, JSON.stringify(progress));
      console.log('Posiciones guardadas en localStorage');
    }, 1000);
  }, [subjects]);

  // Función para calcular la criticidad de los nodos
  const calculateCriticalNodes = useCallback((subjects: SubjectNodeType[]) => {
    // Crear un mapa de materias que son prerequisitos de otras
    const prerequisiteMap = new Map<number, number[]>();
    
    // Primero, construir el grafo de dependencias
    subjects.forEach(subject => {
      subject.prerequisites.forEach(prereqId => {
        if (!prerequisiteMap.has(prereqId)) {
          prerequisiteMap.set(prereqId, []);
        }
        prerequisiteMap.get(prereqId)?.push(subject.subjectid);
      });
    });

    // Función recursiva para contar materias desbloqueadas
    const countUnlockedSubjects = (subjectId: number, visited = new Set<number>()): number => {
      if (visited.has(subjectId)) return 0;
      visited.add(subjectId);

      const directDependents = prerequisiteMap.get(subjectId) || [];
      let count = directDependents.length;

      // Contar también las materias que se desbloquean indirectamente
      directDependents.forEach(dependentId => {
        count += countUnlockedSubjects(dependentId, visited);
      });

      return count;
    };

    // Calcular el puntaje de criticidad para cada materia
    const scores: CriticalityScore[] = subjects.map(subject => ({
      subjectId: subject.subjectid,
      score: countUnlockedSubjects(subject.subjectid)
    }));

    // Ordenar por puntaje descendente
    scores.sort((a, b) => b.score - a.score);
    
    // Actualizar el estado con los nodos críticos
    setCriticalNodes(scores);
  }, []);

  // Corregir la función handleSubjectPositionChange
  const handleSubjectPositionChange = useCallback((position: { x: number; y: number }, isDragging: boolean, subjectId: number) => {
    if (!studentid || !selectedCareer) return;

    setSubjects(prev => prev.map(subject => 
      subject.subjectid === subjectId 
        ? { ...subject, position }
        : subject
    ));

    if (!isDragging) {
      debouncedSaveToLocalStorage(studentid, selectedCareer);
    }
  }, [selectedCareer, debouncedSaveToLocalStorage, studentid]);

  // Calcular nodos críticos cuando cambian las materias
  useEffect(() => {
    if (subjects.length > 0) {
      calculateCriticalNodes(subjects);
    }
  }, [subjects, calculateCriticalNodes]);

  // Limpiar el timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const total = subjects.length;
    const approved = subjects.filter(s => s.status === 'approved').length;
    const inProgress = subjects.filter(s => s.status === 'in_progress').length;
    const average = subjects
      .filter(s => s.status === 'approved' && s.grade)
      .reduce((acc, s) => acc + (s.grade || 0), 0) / approved || 0;

    const { weightedProgress } = calculateWeightedProgress(subjects, criticalNodes);

    return {
      progress: total > 0 ? Math.round((approved / total) * 100) : 0,
      weightedProgress: Math.round(weightedProgress),
      inProgress,
      average: average.toFixed(2)
    };
  }, [subjects, criticalNodes]);

  // Efecto para manejar el modo oscuro
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      setCurrentTheme(themes[e.matches ? 1 : 0]);
    };

    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
  }, []);

  // Efecto para manejar el color de fondo
  useEffect(() => {
    // Aplicar estilos al body y html
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
  }, []);

  // Actualizar el título cuando el componente se monta
  useEffect(() => {
    document.title = 'UADE: FAIN MAP';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-2xl text-gray-600 mb-4">Cargando...</div>
        <div className="text-lg text-gray-500">{loadingStatus}</div>
      </div>
    );
  }

  if (!studentid) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-2xl text-gray-600 mb-4">No autorizado</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${currentTheme.bgColor} transition-colors duration-200`}>
      <Header
        currentTheme={currentTheme}
        selectedCareer={selectedCareer}
        careers={careers}
        stats={stats}
        onCareerChange={handleCareerChange}
      />

      <main className="flex-1 overflow-hidden pt-[calc(4rem+1px)] pb-[calc(3.5rem+1px)]">
        <div className="h-full relative">
          <SubjectMap
            subjects={subjects}
            yearLabels={yearLabels}
            quarterLabels={quarterLabels}
            currentTheme={currentTheme}
            criticalNodes={criticalNodes}
            onSubjectStatusChange={handleSubjectStatusChange}
            onSubjectGradeChange={handleSubjectGradeChange}
            onSubjectPositionChange={handleSubjectPositionChange}
          />
        </div>
      </main>

      <Footer theme={currentTheme} />
    </div>
  );
};

export default Dashboard; 