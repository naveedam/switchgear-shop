
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Phone } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Your account details and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{user.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Role</label>
                <div>
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'seller' ? 'default' : 'secondary'}>
                    {user.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-lg">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Company
                </label>
                <p className="text-lg">{user.companyName || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-lg">{user.phoneNumber || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-lg">{user.createdAt?.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
