
import React from 'react';
import { useParams } from 'react-router-dom';

const EditCategory: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Category</h1>
      <p className="text-gray-700">Category ID: {id}</p>
      {/* Here you can add the actual edit form or additional logic */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        🚧 Category editing functionality coming soon!
      </div>
    </div>
  );
};

export default EditCategory;
