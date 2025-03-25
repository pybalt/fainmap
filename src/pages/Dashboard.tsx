import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubjects } from '../hooks/useSubjects';
import { useTheme } from '../hooks/useTheme';
import { useCareers } from '../hooks/useCareers';
import SubjectMap from '../components/SubjectMap';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard: React.FC = () => {
  const { userLegajo } = useAuth();
  const { currentTheme } = useTheme();
  const { careers, selectedCareer, setSelectedCareer } = useCareers();
  const [loading, setLoading] = useState(true);

  const {
    subjects,
    loading: subjectsLoading,
    error,
    updateSubjectPosition,
    updateSubjectStatus,
    updateSubjectGrade,
    stats
  } = useSubjects({ careerId: selectedCareer || 0, studentId: userLegajo || '' });

  useEffect(() => {
    setLoading(subjectsLoading);
  }, [subjectsLoading]);

  if (loading) return <div>Cargando información...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!subjects) return <div>No hay materias disponibles</div>;

  const handleCareerChange = (careerId: number) => {
    setSelectedCareer(careerId);
  };

  const handlePositionUpdate = (subjectId: number, position: { x: number; y: number }) => {
    updateSubjectPosition(subjectId, position, false);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header 
        currentTheme={currentTheme}
        selectedCareer={selectedCareer}
        careers={careers}
        stats={stats}
        onCareerChange={handleCareerChange}
      />
      <main className="flex-1 relative">
        <SubjectMap
          subjects={subjects}
          onPositionUpdate={handlePositionUpdate}
          onStatusChange={updateSubjectStatus}
          onGradeChange={updateSubjectGrade}
        />
      </main>
      <Footer currentTheme={currentTheme} />
    </div>
  );
};

export default Dashboard; 