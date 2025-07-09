
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ImageGenerationPanel from '@/components/admin/ImageGenerationPanel';

const AdminImageGeneration: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Image Generation</h1>
        <p className="text-gray-600 mt-2">
          Generate professional category images using AI to enhance your marketplace appearance.
        </p>
      </div>
      
      <ImageGenerationPanel />
    </div>
  );
};

export default AdminImageGeneration;
