import React, { useState } from 'react';

interface Subject {
  id: number;
  name: string;
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Physics' },
    { id: 3, name: 'Chemistry' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleCreateSubject = () => {
    if(newSubjectName.trim() !== ''){
      const newSubject: Subject = {
        id: subjects.length + 1,
        name: newSubjectName,
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
      setShowModal(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subject Management</h1>
      <button 
        onClick={() => setShowModal(true)} 
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        Create Subject
      </button>
      <ul className="border rounded p-4">
        {subjects.map((subject) => (
          <li key={subject.id} className="p-2 border-b last:border-0">
            {subject.name}
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Create New Subject</h2>
            <input 
              type="text" 
              placeholder="Subject Name" 
              value={newSubjectName} 
              onChange={(e) => setNewSubjectName(e.target.value)} 
              className="border p-2 rounded mb-4 w-full"
            />
            <div className="flex justify-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="bg-gray-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateSubject} 
                className="bg-green-500 text-white p-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
