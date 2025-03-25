import { SubjectNode } from '../types/database';

/**
 * Calculate the criticality score for each subject
 * Criticality is a measure of how many other subjects depend on this one
 */
export const calculateCriticalNodes = (subjects: SubjectNode[]): Array<{ subjectId: number; score: number }> => {
  // Create a map of subjects that are prerequisites for others
  const prerequisiteMap = new Map<string, number[]>();
  
  // First, build the dependency graph
  subjects.forEach(subject => {
    subject.prerequisites.forEach(prereq => {
      // Get the code of the prerequisite based on its format
      let prereqCode: string;
      
      if (typeof prereq === 'object' && prereq.code) {
        prereqCode = prereq.code;
      } else if (typeof prereq === 'object' && prereq.id) {
        // Look up the code by ID
        const prereqSubject = subjects.find(s => s.subjectid === prereq.id);
        prereqCode = prereqSubject?.code || String(prereq.id);
      } else if (typeof prereq === 'number') {
        // Look up the code for this ID
        const prereqSubject = subjects.find(s => s.subjectid === prereq);
        prereqCode = prereqSubject?.code || String(prereq);
      } else {
        prereqCode = String(prereq);
      }
      
      if (!prerequisiteMap.has(prereqCode)) {
        prerequisiteMap.set(prereqCode, []);
      }
      prerequisiteMap.get(prereqCode)?.push(subject.subjectid);
    });
  });

  // Recursive function to count subjects unlocked
  const countUnlockedSubjects = (subjectId: number, visited = new Set<number>()): number => {
    if (visited.has(subjectId)) return 0;
    visited.add(subjectId);

    // Find the subject code
    const subject = subjects.find(s => s.subjectid === subjectId);
    if (!subject) return 0;
    
    // Get direct dependents
    const directDependents = prerequisiteMap.get(subject.code) || [];
    let count = directDependents.length;

    // Count indirect dependents
    directDependents.forEach(dependentId => {
      count += countUnlockedSubjects(dependentId, visited);
    });

    return count;
  };

  // Calculate criticality score for each subject
  const scores: Array<{ subjectId: number; score: number }> = subjects.map(subject => ({
    subjectId: subject.subjectid,
    score: countUnlockedSubjects(subject.subjectid)
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  return scores;
}; 