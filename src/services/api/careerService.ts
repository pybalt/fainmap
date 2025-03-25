import { Career, SubjectNode } from '../../types/database';
import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Career-related API services
 */
const careerService = {
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

export default careerService; 