import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  console.log('Calculando posiciones iniciales para', subjects.length, 'materias');
  
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
      const prerequisiteYs = subject.prerequisites.map(prereq => {
        // Obtener el ID del prerequisito según el formato
        const prereqId = typeof prereq === 'object' ? prereq.id : prereq;
        const prereqSubject = subjects.find(s => s.subjectid === prereqId);
        return prereqSubject?.position?.y || baseY;
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

  // Si no hay caché, cargar desde el API
  try {
    // Obtener token de autenticación
    const token = localStorage.getItem('token');
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    

    const url = `${apiUrl}/api/careers/${careerid}/subjects-with-prerequisites`;
    
    console.log('Cargando materias y prerrequisitos desde:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
        throw new Error('Error de autenticación');
      }
      throw new Error(`Error al cargar materias y prerrequisitos: ${response.status} ${response.statusText}`);
    }
    
    const subjectsData = await response.json();
    
    if (!subjectsData || subjectsData.length === 0) {
      console.log('No se encontraron materias para la carrera');
      return { subjects: [], yearLabels: [], quarterLabels: [] };
    }

    console.log('Datos de materias recibidos:', subjectsData);

    // Mapear los datos
    const mappedSubjects = subjectsData.map((subject: any) => ({
      subjectid: subject.subjectid,
      code: subject.code,
      name: subject.name,
      status: 'pending' as SubjectNodeType['status'],
      prerequisites: subject.prerequisites || [],
      suggested_year: subject.suggested_year || 1,
      suggested_quarter: subject.suggested_quarter || 1,
      position: { x: 0, y: 0 }
    } as SubjectNodeType));

    // Guardar en localStorage
    localStorage.setItem(cachedSubjectsKey, JSON.stringify(mappedSubjects));

    console.log(`Materias procesadas: ${mappedSubjects.length}`);
    return calculateInitialPositions(mappedSubjects);
  } catch (error) {
    console.error('Error al cargar materias:', error);
    return { subjects: [], yearLabels: [], quarterLabels: [] };
  }
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
  const [loading, setLoading] = useState({
    careers: false,
    subjects: false
  });
  const [loadingStatus, setLoadingStatus] = useState<string>('Iniciando...');
  const [criticalNodes, setCriticalNodes] = useState<Array<{ subjectId: number; score: number; }>>([]);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[isDarkMode ? 1 : 0]);
  const studentid = localStorage.getItem('userLegajo') || '';
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [subjectForGrade, setSubjectForGrade] = useState<{ id: number; isOpen: boolean }>({ id: 0, isOpen: false });

  // Protección de ruta
  useEffect(() => {
    if (!studentid) {
      navigate('/');
    }
  }, [studentid, navigate]);

  // Cargar carreras
  const loadCareers = useCallback(async () => {
    try {
      setLoading(prevState => ({ ...prevState, careers: true }));
      setLoadingStatus('Verificando carreras disponibles...');
      
      console.log('Variables de entorno cargadas:');
      console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      // Verificar si ya hay carreras cacheadas
      const cachedCareers = localStorage.getItem('careers');
      const cacheTimestamp = localStorage.getItem('careers_timestamp');
      
      if (cachedCareers && cacheTimestamp) {
        const currentTime = Date.now();
        const timestamp = parseInt(cacheTimestamp, 10);
        
        // Si la caché no ha expirado, usarla
        if (currentTime - timestamp < CAREERS_CACHE_DURATION) {
          console.log('Usando carreras cacheadas');
          const parsedCareers = JSON.parse(cachedCareers);
          console.log('Carreras en caché:', parsedCareers);
          setCareers(parsedCareers);
          setLoading(prevState => ({ ...prevState, careers: false }));
          
          // Si hay una carrera guardada, seleccionarla
          const savedCareer = localStorage.getItem('selectedCareer');
          if (savedCareer) {
            console.log('Seleccionando carrera guardada:', savedCareer);
            setSelectedCareer(parseInt(savedCareer));
          }
          
          return;
        }
      }

      setLoadingStatus('Cargando carreras desde el servidor...');
      // Si no hay caché válida, cargar desde el API
      // Primero intentar con la URL configurada
      let apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl || apiUrl === '') {
        console.warn('VITE_API_URL no está definido, usando URL por defecto');
        apiUrl = 'http://localhost:3000/api';
      }
      
      // Asegurarse de que estamos usando la ruta con /api/ prefix
      const careersUrl = apiUrl.endsWith('/api') ? 
        `${apiUrl}/careers` : 
        `${apiUrl}/api/careers`;
      
      const response = await fetch(careersUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
          throw new Error('Error de autenticación');
        }
        throw new Error(`Error al cargar carreras: ${response.status} ${response.statusText}`);
      }
      
      const careersData = await response.json();
      console.log('Carreras cargadas:', careersData);
      
      if (!careersData || careersData.length === 0) {
        console.warn('No se encontraron carreras');
        setLoadingStatus('No se encontraron carreras disponibles');
        setCareers([]);
        setLoading(prevState => ({ ...prevState, careers: false }));
        return;
      }
      
      setCareers(careersData);
      
      // Actualizar caché
      localStorage.setItem('careers', JSON.stringify(careersData));
      localStorage.setItem('careers_timestamp', Date.now().toString());
      
      // Si hay una carrera guardada, seleccionarla
      const savedCareer = localStorage.getItem('selectedCareer');
      if (savedCareer) {
        console.log('Seleccionando carrera guardada:', savedCareer);
        setSelectedCareer(parseInt(savedCareer));
      }
      
      setLoadingStatus('Carreras cargadas correctamente');
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      setLoadingStatus('Error al cargar carreras');
      setCareers([]);
    } finally {
      setLoading(prevState => ({ ...prevState, careers: false }));
    }
  }, []);

  // Cargar carreras al montar el componente
  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  // Cargar materias
  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedCareer) return;
      
      try {
        console.log('Cargando materias para carrera:', selectedCareer);
        setLoading(prevState => ({ ...prevState, subjects: true }));
        
        // Obtener token de autenticación
        const token = localStorage.getItem('token');
        
        // Cargar materias desde la base de datos
        const layoutData = await loadSubjectsWithPrerequisites(selectedCareer);
        
        // Inicializar las materias sin estado de aprobación primero
        setSubjects(layoutData.subjects);
        setYearLabels(layoutData.yearLabels);
        setQuarterLabels(layoutData.quarterLabels);
        
        // Luego, cargar materias aprobadas
        const legajo = localStorage.getItem('userLegajo');
        if (legajo) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

          const url = `${apiUrl}/api/students/${legajo}/approved-subjects-with-details?careerid=${selectedCareer}`;
          
          console.log('Cargando materias aprobadas desde:', url);
          const response = await fetch(url, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
              throw new Error('Error de autenticación');
            }
            throw new Error('Error al cargar materias aprobadas');
          }
          
          const approvedData = await response.json();
          
          // Actualizar el estado con las materias aprobadas
          setSubjects(currentSubjects => {
            return currentSubjects.map(subject => {
              const approved = approvedData.find((a: any) => a.subjectid === subject.subjectid);
              if (approved) {
                return {
                  ...subject,
                  status: 'approved',
                  grade: approved.grade
                };
              }
              return {
                ...subject,
                status: 'pending' as const
              };
            });
          });
        }
        
        // Guardar en localStorage sin caché de tiempo
        const progress: UserProgress = {
          studentid,
          careerid: selectedCareer,
          subjects: layoutData.subjects.reduce((acc, subject) => ({
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
        setLoading(prevState => ({ ...prevState, subjects: false }));
      }
    };

    loadSubjects();
  }, [selectedCareer]);

  const handleCareerChange = (careerid: number) => {
    setSelectedCareer(careerid);
    localStorage.setItem('selectedCareer', careerid.toString());
  };

  const handleSubjectStatusChange = async (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => {
    try {
      if (!selectedCareer) return;
      
      const legajo = localStorage.getItem('userLegajo');
      const token = localStorage.getItem('token');
      // Token de reCAPTCHA simulado para desarrollo
      const recaptchaToken = 'test-token-recaptcha-123456';
      
      if (!legajo) {
        console.error('No se encontró el legajo del usuario');
        return;
      }
      
      // Si está cambiando a aprobado, mostrar el diálogo para la nota
      if (status === 'approved') {
        setSubjectForGrade({ id: subjectId, isOpen: true });
        return;
      }
      
      // Si está cambiando a pendiente, eliminar la materia aprobada
      if (status === 'pending') {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/students/${legajo}/approved-subjects`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'x-recaptcha-token': recaptchaToken
          },
          body: JSON.stringify({
            subjectid: subjectId,
            careerid: selectedCareer
          })
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
            throw new Error('Error de autenticación');
          }
          throw new Error('Error al eliminar materia aprobada');
        }
      }
      
      // Actualizar el estado local
      updateSubjectStatus(subjectId, status);
      
      // Cargar materias aprobadas para actualizar la vista
      loadApprovedSubjects();
    } catch (error) {
      console.error('Error al cambiar estado de materia:', error);
    }
  };

  const handleSubjectGradeChange = async (subjectId: number, grade: number) => {
    try {
      const token = localStorage.getItem('token');
      const legajo = localStorage.getItem('userLegajo');
      
      if (!legajo) {
        console.error('No se encontró el legajo del usuario');
        return;
      }
      
      const recaptchaToken = 'test-token-recaptcha-123456'; // Token de prueba para desarrollo
      
      console.log('Enviando solicitud para guardar materia aprobada:');
      console.log('URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/${legajo}/approved-subjects`);
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-recaptcha-token': recaptchaToken
      });
      console.log('Body:', JSON.stringify({
        subjectid: subjectId,
        careerid: selectedCareer,
        grade
      }));
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/students/${legajo}/approved-subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-recaptcha-token': recaptchaToken
        },
        body: JSON.stringify({
          subjectid: subjectId,
          careerid: selectedCareer,
          grade
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${errorText}`);
        
        try {
          // Intentar parsear como JSON para mostrar un mensaje más claro
          const errorJson = JSON.parse(errorText);
          console.error('Error detallado:', errorJson);
        } catch (e) {
          // No es JSON, usar el texto directamente
        }
        
        // Si obtenemos un 401, podríamos intentar actualizar el token
        if (response.status === 401) {
          console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
          throw new Error('Error de autenticación');
        }
        
        throw new Error(`Error al guardar materia aprobada: ${response.status} ${errorText}`);
      }
      
      // Actualizar el estado local
      updateSubjectStatus(subjectId, 'approved');
      
      // Cerrar el diálogo
      setSubjectForGrade({ id: 0, isOpen: false });
      
      // Cargar materias aprobadas para actualizar la vista
      loadApprovedSubjects();
    } catch (error) {
      console.error('Error al guardar nota:', error);
      setSubjectForGrade({ id: 0, isOpen: false });
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
    const prerequisiteMap = new Map<string, number[]>();
    
    // Primero, construir el grafo de dependencias
    subjects.forEach(subject => {
      subject.prerequisites.forEach(prereq => {
        // Obtener el código del prerequisito según su formato
        let prereqCode: string;
        
        if (typeof prereq === 'object' && prereq.code) {
          prereqCode = prereq.code;
        } else if (typeof prereq === 'object' && prereq.id) {
          // Buscar el código por ID
          const prereqSubject = subjects.find(s => s.subjectid === prereq.id);
          prereqCode = prereqSubject?.code || String(prereq.id);
        } else {
          // Si es un número, buscar el código correspondiente o usar el número como string
          const prereqSubject = subjects.find(s => s.subjectid === prereq);
          prereqCode = prereqSubject?.code || String(prereq);
        }
        
        if (!prerequisiteMap.has(prereqCode)) {
          prerequisiteMap.set(prereqCode, []);
        }
        prerequisiteMap.get(prereqCode)?.push(subject.subjectid);
      });
    });

    // Función recursiva para contar materias desbloqueadas
    const countUnlockedSubjects = (subjectId: number, visited = new Set<number>()): number => {
      if (visited.has(subjectId)) return 0;
      visited.add(subjectId);

      // Buscar el código de la materia
      const subject = subjects.find(s => s.subjectid === subjectId);
      if (!subject) return 0;
      
      const directDependents = prerequisiteMap.get(subject.code) || [];
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

  // Actualizar el estado de una materia en el componente
  const updateSubjectStatus = (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => {
    setSubjects(currentSubjects => {
      return currentSubjects.map(subject =>
        subject.subjectid === subjectId
          ? { ...subject, status }
          : subject
      );
    });
  };

  // Cargar materias aprobadas desde el API
  const loadApprovedSubjects = async () => {
    try {
      if (!selectedCareer) return;
      
      const legajo = localStorage.getItem('userLegajo');
      const token = localStorage.getItem('token'); // Obtener el token
      
      if (!legajo) {
        console.error('No se encontró el legajo del usuario');
        return;
      }
      
      // Cargar las materias aprobadas desde el API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';


      const url = `${apiUrl}/api/students/${legajo}/approved-subjects-with-details?careerid=${selectedCareer}`;
      
      console.log('Cargando materias aprobadas desde:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '', // Incluir el token
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Error de autenticación. Intente iniciar sesión nuevamente.');
          throw new Error('Error de autenticación');
        }
        throw new Error('Error al cargar materias aprobadas');
      }
      
      const approvedData = await response.json();
      
      if (!approvedData) return;
      
      // Actualizar el estado con las materias aprobadas
      setSubjects(currentSubjects => {
        return currentSubjects.map(subject => {
          const approved = approvedData.find((a: any) => a.subjectid === subject.subjectid);
          if (approved) {
            return {
              ...subject,
              status: 'approved',
              grade: approved.grade
            };
          }
          return subject;
        });
      });
    } catch (error) {
      console.error('Error al cargar materias aprobadas:', error);
    }
  };

  if (loading.careers || loading.subjects) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        <p className="text-gray-600">{loadingStatus}</p>
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

      {/* Diálogo para ingresar nota */}
      {subjectForGrade.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${currentTheme.cardBg} ${currentTheme.textColor} p-6 rounded-lg shadow-lg max-w-md w-full`}>
            <h2 className="text-xl font-bold mb-4">Ingresar calificación</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const grade = parseFloat(formData.get('grade') as string);
              if (grade >= 0 && grade <= 10) {
                handleSubjectGradeChange(subjectForGrade.id, grade);
              }
            }}>
              <div className="mb-4">
                <label htmlFor="grade" className="block mb-2">Nota (0-10):</label>
                <input
                  type="number"
                  id="grade"
                  name="grade"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  className={`w-full px-3 py-2 border rounded-md ${
                    currentTheme.bgColor === 'bg-gray-100' 
                      ? 'border-gray-300 text-gray-900 bg-white' 
                      : 'border-gray-700 text-white bg-gray-700'
                  }`}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSubjectForGrade({ id: 0, isOpen: false })}
                  className="px-4 py-2 border rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 