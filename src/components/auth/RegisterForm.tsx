
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserRole, RegisterData } from '@/types/user';
import SellerRegistrationForm from './SellerRegistrationForm';

const buyerRegistrationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['buyer']).default('buyer'),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
});

type BuyerRegistrationData = z.infer<typeof buyerRegistrationSchema>;

const RegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register: registerUser, isLoading, error } = useAuth();
  const { toast } = useToast();
  const [registrationType, setRegistrationType] = useState<'buyer' | 'seller'>('buyer');
  
  const form = useForm<BuyerRegistrationData>({
    resolver: zodResolver(buyerRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'buyer',
      companyName: '',
      phoneNumber: '',
    },
  });
  
  const onSubmitBuyer = async (data: BuyerRegistrationData) => {
    try {
      const registerData: RegisterData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        companyName: data.companyName,
        phoneNumber: data.phoneNumber,
      };
      
      await registerUser(registerData);
      toast({
        title: 'Registration successful',
        description: 'Welcome to Switchgear Shop',
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: error || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as 'buyer' | 'seller')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buyer">Register as Buyer</TabsTrigger>
          <TabsTrigger value="seller">Register as Seller</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buyer">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitBuyer)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="youremail@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Ltd." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Register as Buyer'}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="seller">
          <SellerRegistrationForm onSuccess={onSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegisterForm;
