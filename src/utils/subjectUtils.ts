import { SubjectNode, YearLabel, QuarterLabel } from '../types/database';

// Constants for layout calculations
const getLayoutConstants = () => {
  const isMobile = window.innerWidth < 768;
  return {
    CARD_WIDTH: isMobile ? 140 : 180,
    CARD_HEIGHT: isMobile ? 80 : 100,
    MARGIN_X: isMobile ? 80 : 150,
    MARGIN_Y: isMobile ? 30 : 50,
    YEAR_SPACING: isMobile ? 50 : 100,
    QUARTER_SPACING: isMobile ? 30 : 50,
    HEADER_HEIGHT: 30
  };
};

// Node position interface
export interface NodePosition {
  x: number;
  y: number;
}

// Extended subject node with position
export interface NodeWithPosition extends SubjectNode {
  position: NodePosition;
}

// Layout data interface
export interface LayoutData {
  subjects: SubjectNode[];
  yearLabels: YearLabel[];
  quarterLabels: QuarterLabel[];
}

/**
 * Check if two nodes collide with each other
 */
export const doNodesCollide = (
  node1: { x: number; y: number },
  node2: { x: number; y: number }
): boolean => {
  const { CARD_WIDTH, CARD_HEIGHT } = getLayoutConstants();
  return (
    Math.abs(node1.x - node2.x) < CARD_WIDTH && 
    Math.abs(node1.y - node2.y) < CARD_HEIGHT
  );
};

/**
 * Resolve collisions between nodes by adjusting positions
 */
export const resolveCollisions = (
  nodes: Array<SubjectNode & { position: { x: number; y: number } }>
): Array<SubjectNode & { position: { x: number; y: number } }> => {
  const { CARD_HEIGHT, MARGIN_Y } = getLayoutConstants();
  
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

/**
 * Calculate initial positions for subjects in a graph layout
 */
export const calculateInitialPositions = (subjects: SubjectNode[]) => {
  console.log('Calculating initial positions for', subjects.length, 'subjects');
  
  const { 
    CARD_WIDTH, 
    MARGIN_X, 
    YEAR_SPACING, 
    QUARTER_SPACING, 
    HEADER_HEIGHT 
  } = getLayoutConstants();
  
  const maxYear = Math.max(...subjects.map(s => s.suggested_year || 1));
  
  const yearLabels: Array<{ year: number; x: number; y: number }> = [];
  const quarterLabels: Array<{ year: number; quarter: number; x: number; y: number }> = [];
  
  // Calculate the maximum quarter for each year individually
  const maxQuarterByYear = new Map<number, number>();
  
  subjects.forEach(subject => {
    const year = subject.suggested_year || 1;
    const quarter = subject.suggested_quarter || 1;
    
    // Update the max quarter for this year
    const currentMax = maxQuarterByYear.get(year) || 0;
    if (quarter > currentMax) {
      maxQuarterByYear.set(year, quarter);
    }
  });
  
  // Generate year and quarter labels
  for (let year = 1; year <= maxYear; year++) {
    const yearX = (year - 1) * (CARD_WIDTH + MARGIN_X + YEAR_SPACING) + MARGIN_X;
    yearLabels.push({ year, x: yearX, y: 10 });
    
    // Get the max quarter for this year
    const maxQuarterForYear = maxQuarterByYear.get(year) || 1;

    for (let quarter = 1; quarter <= maxQuarterForYear; quarter++) {
      const quarterX = yearX + (quarter - 1) * (CARD_WIDTH + QUARTER_SPACING);
      quarterLabels.push({ year, quarter, x: quarterX, y: HEADER_HEIGHT });
    }
  }

  // Calculate initial positions for subjects
  const subjectsWithPositions = subjects.map(subject => {
    const year = subject.suggested_year || 1;
    const quarter = subject.suggested_quarter || 1;
    
    let baseY = HEADER_HEIGHT * 2;
    if (subject.prerequisites.length > 0) {
      const prerequisiteYs = subject.prerequisites.map(prereq => {
        // Get prerequisite ID based on format
        let prereqId: number;
        if (typeof prereq === 'object' && 'id' in prereq) {
          prereqId = prereq.id;
        } else if (typeof prereq === 'number') {
          prereqId = prereq;
        } else {
          // Handle string code case by finding matching subject
          const prereqCode = typeof prereq === 'string' ? prereq : (prereq as any).code;
          const prereqSubject = subjects.find(s => s.code === prereqCode);
          prereqId = prereqSubject?.subjectid || 0;
        }
        
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
  
  const subjectsWithCollisionsResolved = resolveCollisions(subjectsWithPositions);
  
  return {
    subjects: subjectsWithCollisionsResolved,
    yearLabels,
    quarterLabels
  };
};

/**
 * Calculates criticality score for each subject
 */
export const calculateCriticalityScores = (
  subjects: SubjectNode[]
): Array<{ subjectId: number; score: number }> => {
  // Create a map of prerequisite counts
  const childrenCount = new Map<number, number>();
  
  // Count how many subjects depend on each subject
  subjects.forEach(subject => {
    subject.prerequisites.forEach(prereq => {
      // Get prerequisite ID based on format
      let prereqId: number;
      if (typeof prereq === 'object' && 'id' in prereq) {
        prereqId = prereq.id;
      } else if (typeof prereq === 'number') {
        prereqId = prereq;
      } else {
        // Handle string code case by finding matching subject
        const prereqCode = typeof prereq === 'string' ? prereq : (prereq as any).code;
        const prereqSubject = subjects.find(s => s.code === prereqCode);
        prereqId = prereqSubject?.subjectid || 0;
      }
      
      if (prereqId) {
        childrenCount.set(prereqId, (childrenCount.get(prereqId) || 0) + 1);
      }
    });
  });
  
  // Calculate centrality (importance) of each node
  const criticalityScores = subjects
    .filter(subject => subject.status !== 'approved') // Only include non-approved subjects
    .map(subject => {
      // Direct children count (subjects that depend on this one)
      const directChildren = childrenCount.get(subject.subjectid) || 0;
      
      // Calculate score based on direct dependencies and year/quarter
      const yearFactor = (5 - (subject.suggested_year || 1)) / 4; // Earlier years are more critical
      const score = directChildren * 2 + yearFactor * 5;
      
      return {
        subjectId: subject.subjectid,
        score
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score in descending order
  
  return criticalityScores;
};

/**
 * Calculates weighted progress based on subject criticality
 */
export const calculateWeightedProgress = (
  subjects: SubjectNode[], 
  criticalNodes: Array<{ subjectId: number; score: number; }>
): {
  weightedProgress: number;
  totalWeight: number;
  approvedWeight: number;
} => {
  // Create a map for faster lookups
  const scoreMap = new Map<number, number>();
  criticalNodes.forEach(node => {
    scoreMap.set(node.subjectId, node.score);
  });
  
  // Calculate weights
  let totalWeight = 0;
  let approvedWeight = 0;
  
  subjects.forEach(subject => {
    // Get weight (importance) of the subject
    const weight = scoreMap.get(subject.subjectid) || 1;
    
    totalWeight += weight;
    if (subject.status === 'approved') {
      approvedWeight += weight;
    }
  });
  
  // Calculate weighted progress as a percentage
  const weightedProgress = totalWeight > 0 ? (approvedWeight / totalWeight) * 100 : 0;
  
  return {
    weightedProgress,
    totalWeight,
    approvedWeight
  };
}; 