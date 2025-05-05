
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  loginAttempts: z.coerce.number().min(1).max(10),
  passwordExpiry: z.coerce.number().min(0),
  passwordMinLength: z.coerce.number().min(6).max(32),
  requireStrongPassword: z.boolean().default(true),
  sessionTimeout: z.coerce.number().min(5),
  apiAccessEnabled: z.boolean().default(false),
  ipWhitelist: z.string().optional(),
});

type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;

const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Default form values - in a real application these would come from an API
  const defaultValues: SecuritySettingsFormValues = {
    twoFactorAuth: false,
    loginAttempts: 5,
    passwordExpiry: 90,
    passwordMinLength: 8,
    requireStrongPassword: true,
    sessionTimeout: 30,
    apiAccessEnabled: false,
    ipWhitelist: '',
  };
  
  const form = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues,
  });
  
  const onSubmit = async (data: SecuritySettingsFormValues) => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, you would save these settings to your backend
      console.log('Saved security settings:', data);
      
      toast({
        title: 'Security settings saved',
        description: 'Your security settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'There was a problem saving your security settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Settings</CardTitle>
            <CardDescription>Configure authentication and login security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="twoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Require two-factor authentication for admin and seller accounts
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requireStrongPassword"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Require Strong Passwords</FormLabel>
                      <FormDescription>
                        Enforce mixed case, numbers, and special characters
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="loginAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Login Attempts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of failed login attempts before account lockout
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passwordMinLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Password Length</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum length required for all user passwords
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passwordExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Expiry (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Days before passwords must be changed (0 for never)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sessionTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Timeout (Minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Time in minutes before inactive sessions are logged out
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>API Security</CardTitle>
            <CardDescription>Configure API access and restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="apiAccessEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable API Access</FormLabel>
                    <FormDescription>
                      Allow external applications to access your marketplace API
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('apiAccessEnabled') && (
              <FormField
                control={form.control}
                name="ipWhitelist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Whitelist</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 192.168.1.1, 10.0.0.1" />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of IP addresses allowed to access the API (leave empty to allow all)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch('apiAccessEnabled') && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">API Keys</h3>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="text-sm text-gray-600 mb-4">No API keys generated yet. Generate keys to allow external applications to access your marketplace API.</p>
                  <Button type="button" variant="outline" size="sm">
                    Generate New API Key
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </form>
    </Form>
  );
};

export default SecuritySettings;
