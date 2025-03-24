export interface Alumno {
  legajo: string;
  carrera: string;
  nombre: string;
}

export interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  carrera: string;
  correlativas: string[];
  año: number;
  cuatrimestre: number;
}

export interface Subject {
  subjectid: number;
  code: string;
  name: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface PrerequisiteSubject {
  id: number;
  code?: string;
  name?: string;
}

export interface SubjectNode extends Subject {
  status: 'pending' | 'in_progress' | 'approved';
  prerequisites: (number | PrerequisiteSubject)[];
  grade?: number;
  position: {
    x: number;
    y: number;
  };
  suggested_year: number;
  suggested_quarter: number;
}

export interface Career {
  careerid: number;
  name: string;
}

export interface UserProgress {
  studentid: string;
  careerid: number;
  subjects: {
    [key: number]: {
      status: 'pending' | 'in_progress' | 'approved';
      grade?: number;
      position?: {
        x: number;
        y: number;
      };
    };
  };
  lastUpdated: string;
}

export interface YearLabel {
  year: number;
  x: number;
  y: number;
}

export interface QuarterLabel {
  year: number;
  quarter: number;
  x: number;
  y: number;
}

export interface CareerSubject {
  subjectid: number;
  suggested_year: number;
  suggested_quarter: number;
  subjects: {
    subjectid: number;
    code: string;
    name: string;
  };
}