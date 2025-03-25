import React from 'react';

interface GradeInputProps {
  defaultGrade?: number;
  onSubmit: (grade: number) => void;
  onCancel: () => void;
}

const GradeInput: React.FC<GradeInputProps> = ({ defaultGrade = 4, onSubmit, onCancel }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const grade = parseFloat(formData.get('grade') as string);
    if (grade >= 0 && grade <= 10) {
      onSubmit(grade);
    }
  };

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center p-2 rounded-lg">
      <form onSubmit={handleSubmit} className="w-full">
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
          Nota:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            id="grade"
            name="grade"
            min="4"
            max="10"
            step="0.5"
            defaultValue={defaultGrade}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            ✕
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeInput; 