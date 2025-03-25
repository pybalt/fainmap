import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Student-related API services
 */
const studentService = {
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

export default studentService; 