interface StatsDisplayProps {
  stats: {
    progress: number;
    weightedProgress: number;
    inProgress?: number;
    average?: string;
    totalSubjects?: number;
    approvedSubjects?: number;
  };
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  // Calculate inProgress count if not provided directly
  const inProgress = stats.inProgress !== undefined 
    ? stats.inProgress 
    : (stats.totalSubjects && stats.approvedSubjects 
        ? stats.totalSubjects - stats.approvedSubjects 
        : 0);
        
  // Format average if available
  const average = stats.average || 'N/A';
  
  return (
    <div data-testid="stats-display" className="grid grid-cols-2 gap-2 md:flex md:gap-4 text-sm text-gray-500">
      <div>
        <span className="font-medium">Progreso: </span>
        {Math.round(stats.progress)}%
      </div>
      <div>
        <span className="font-medium">Pond.: </span>
        {Math.round(stats.weightedProgress)}%
      </div>
      <div>
        <span className="font-medium">En curso: </span>
        {inProgress}
      </div>
      <div>
        <span className="font-medium">Promedio: </span>
        {average}
      </div>
    </div>
  );
};

export default StatsDisplay; 