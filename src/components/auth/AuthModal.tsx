
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultTab = 'login' 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switchgear Nexus Account</DialogTitle>
          <DialogDescription>
            Login or create an account to continue
          </DialogDescription>
        </DialogHeader>
        <Tabs 
          defaultValue={activeTab} 
          className="w-full" 
          onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <RegisterForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
