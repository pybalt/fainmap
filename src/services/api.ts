import { Career, SubjectNode } from '../types/database';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Base fetch function with common headers and error handling
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Configure headers
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  };
  
  try {
    // Make request with credentials to send cookies
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    // Handle auth errors
    if (response.status === 401) {
      console.log('Authentication error, redirecting to login...');
      
      // Alert user
      alert('Your session has expired. Please log in again.');
      
      // Clear user data
      localStorage.removeItem('userLegajo');
      
      // Redirect to login
      window.location.href = '/';
    }
    
    return response;
  } catch (error) {
    console.error(`Error in fetchWithAuth for ${url}:`, error);
    throw error;
  }
};

/**
 * Career-related API services
 */
export const careerService = {
  /**
   * Get all available careers
   */
  getCareers: async (): Promise<Career[]> => {
    const response = await fetchWithAuth(`${API_URL}/api/careers`);
    
    if (!response.ok) {
      throw new Error(`Error loading careers: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  /**
   * Get subjects with prerequisites for a career
   */
  getSubjectsWithPrerequisites: async (careerId: number): Promise<SubjectNode[]> => {
    const response = await fetchWithAuth(`${API_URL}/api/careers/${careerId}/subjects-with-prerequisites`);
    
    if (!response.ok) {
      throw new Error(`Error loading subjects: ${response.status} ${response.statusText}`);
    }
    
    const subjectsData = await response.json();
    
    // Map API data to our format
    return subjectsData.map((subject: any) => ({
      subjectid: subject.subjectid,
      code: subject.code,
      name: subject.name,
      status: 'pending' as const,
      prerequisites: subject.prerequisites || [],
      suggested_year: subject.suggested_year || 1,
      suggested_quarter: subject.suggested_quarter || 1,
      position: { x: 0, y: 0 }
    }));
  }
};

/**
 * Student-related API services
 */
export const studentService = {
  /**
   * Get approved subjects for a student
   */
  getApprovedSubjects: async (studentId: string, careerId: number): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/api/students/${studentId}/approved-subjects-with-details?careerid=${careerId}`
    );
    
    if (!response.ok) {
      throw new Error(`Error loading approved subjects: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  /**
   * Get in-progress subjects for a student
   */
  getInProgressSubjects: async (studentId: string): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/api/students/${studentId}/in-progress-subjects`
    );
    
    if (!response.ok) {
      throw new Error(`Error loading in-progress subjects: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  /**
   * Update subject status (approved, in-progress, pending)
   */
  updateSubjectStatus: async (
    studentId: string, 
    subjectId: number, 
    status: 'pending' | 'in_progress' | 'approved',
    grade?: number
  ): Promise<void> => {
    let endpoint = '';
    let method = 'POST';
    let body: any = { subjectid: subjectId };
    
    if (status === 'approved') {
      endpoint = `/api/students/${studentId}/approved-subjects`;
      if (grade !== undefined) {
        body.grade = grade;
      }
    } else if (status === 'in_progress') {
      endpoint = `/api/students/${studentId}/in-progress-subjects`;
    } else {
      // For pending status, delete from both approved and in-progress
      method = 'DELETE';
      endpoint = `/api/students/${studentId}/subjects/${subjectId}`;
      body = null;
    }
    
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method,
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Error updating subject status: ${response.status} ${response.statusText}`);
    }
  },
  
  /**
   * Update subject position
   */
  updateSubjectPosition: async (
    studentId: string,
    careerId: number,
    subjectId: number,
    position: { x: number; y: number }
  ): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/api/students/${studentId}/subject-positions`, {
      method: 'POST',
      body: JSON.stringify({
        careerid: careerId,
        subjectid: subjectId,
        position
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error updating subject position: ${response.status} ${response.statusText}`);
    }
  }
}; 