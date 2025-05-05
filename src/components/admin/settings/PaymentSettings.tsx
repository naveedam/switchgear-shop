
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

const paymentSettingsSchema = z.object({
  commissionPercentage: z.coerce.number().min(0).max(100),
  platformFee: z.coerce.number().min(0),
  taxPercentage: z.coerce.number().min(0).max(100),
  minimumWithdrawalAmount: z.coerce.number().min(0),
  paymentGateway: z.string(),
  razorpayEnabled: z.boolean().default(true),
  razorpayKey: z.string().optional(),
  razorpaySecret: z.string().optional(),
  upiEnabled: z.boolean().default(true),
  netBankingEnabled: z.boolean().default(true),
  codEnabled: z.boolean().default(false),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

const PaymentSettings: React.FC = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Default form values - in a real application these would come from an API
  const defaultValues: PaymentSettingsFormValues = {
    commissionPercentage: 10,
    platformFee: 99,
    taxPercentage: 18,
    minimumWithdrawalAmount: 1000,
    paymentGateway: 'razorpay',
    razorpayEnabled: true,
    razorpayKey: 'rzp_test_example123456',
    razorpaySecret: '••••••••••••••••',
    upiEnabled: true,
    netBankingEnabled: true,
    codEnabled: false,
  };
  
  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues,
  });
  
  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, you would save these settings to your backend
      console.log('Saved payment settings:', data);
      
      toast({
        title: 'Payment settings saved',
        description: 'Your payment settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'There was a problem saving your payment settings. Please try again.',
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
            <CardTitle>Fee Configuration</CardTitle>
            <CardDescription>Configure marketplace fees and commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="commissionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Percentage commission on each sale (0-100).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="platformFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Fixed fee charged per transaction in INR.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="taxPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      GST or other applicable tax rate.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minimumWithdrawalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Withdrawal Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum balance required for seller withdrawals.
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
            <CardTitle>Payment Gateways</CardTitle>
            <CardDescription>Configure payment gateway settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="paymentGateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Payment Gateway</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment gateway" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="paytm">Paytm</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your primary payment processor.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Razorpay Settings</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="razorpayEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Razorpay</FormLabel>
                        <FormDescription>
                          Allow payments via Razorpay gateway
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch('razorpayEnabled') && (
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="razorpayKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Razorpay API Key.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="razorpaySecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Secret</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Razorpay API Secret.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="upiEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>UPI Payments</FormLabel>
                        <FormDescription>
                          Allow payments via UPI
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="netBankingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Net Banking</FormLabel>
                        <FormDescription>
                          Allow payments via Net Banking
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="codEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cash on Delivery</FormLabel>
                        <FormDescription>
                          Allow Cash on Delivery payments
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </form>
    </Form>
  );
};

export default PaymentSettings;
