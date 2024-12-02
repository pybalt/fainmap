interface StatsDisplayProps {
  stats: {
    progress: number;
    weightedProgress: number;
    inProgress: number;
    average: string;
  };
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:gap-4 text-sm text-gray-500">
      <div>
        <span className="font-medium">Progreso: </span>
        {stats.progress}%
      </div>
      <div>
        <span className="font-medium">Pond.: </span>
        {stats.weightedProgress}%
      </div>
      <div>
        <span className="font-medium">En curso: </span>
        {stats.inProgress}
      </div>
      <div>
        <span className="font-medium">Promedio: </span>
        {stats.average}
      </div>
    </div>
  );
};

export default StatsDisplay; 