
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const generalSettingsSchema = z.object({
  marketplaceName: z.string().min(2, { message: 'Marketplace name must be at least 2 characters' }),
  tagline: z.string().optional(),
  contactEmail: z.string().email({ message: 'Please enter a valid email address' }),
  contactPhone: z.string().optional(),
  currency: z.string().default('INR'),
  maintenanceMode: z.boolean().default(false),
  allowNewRegistrations: z.boolean().default(true),
  requireSellerApproval: z.boolean().default(true),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

const GeneralSettings: React.FC = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Default form values - in a real application these would come from an API
  const defaultValues: GeneralSettingsFormValues = {
    marketplaceName: 'Switchgear Shop',
    tagline: 'The premier marketplace for electrical switchgear equipment',
    contactEmail: 'contact@switchgearshop.com',
    contactPhone: '+91 1234567890',
    currency: 'INR',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireSellerApproval: true,
  };
  
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });
  
  const onSubmit = async (data: GeneralSettingsFormValues) => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, you would save these settings to your backend
      console.log('Saved settings:', data);
      
      toast({
        title: 'Settings saved',
        description: 'Your marketplace settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'There was a problem saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="marketplaceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marketplace Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your marketplace name" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name that will appear throughout your marketplace.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The default currency for your marketplace. Currently set to INR.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marketplace Tagline</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a short tagline" {...field} />
              </FormControl>
              <FormDescription>
                A short description of your marketplace that appears on the homepage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  The main contact email for your marketplace.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+91 1234567890" {...field} />
                </FormControl>
                <FormDescription>
                  The main contact phone number for your marketplace.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="maintenanceMode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Maintenance Mode</FormLabel>
                  <FormDescription>
                    When enabled, only admin users can access the marketplace.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="allowNewRegistrations"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Allow New Registrations</FormLabel>
                  <FormDescription>
                    When disabled, new users cannot register for an account.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="requireSellerApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Require Seller Approval</FormLabel>
                <FormDescription>
                  When enabled, new seller accounts require admin approval before they can list products.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
};

export default GeneralSettings;
