
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Upload, X } from 'lucide-react';

const sellerRegistrationSchema = z.object({
  // Basic Information
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  
  // Company Information
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  companyDescription: z.string().optional(),
  businessType: z.string().min(1, { message: 'Please select business type' }),
  registrationNumber: z.string().optional(),
  website: z.string().optional(),
  
  // Tax Information
  gstNumber: z.string().min(15, { message: 'GST number must be 15 characters' }).max(15),
  companyPanNumber: z.string().min(10, { message: 'PAN number must be 10 characters' }).max(10),
  taxId: z.string().optional(),
  tradeLicenseNumber: z.string().optional(),
  
  // Address Information
  address: z.string().min(10, { message: 'Address must be at least 10 characters' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  postalCode: z.string().min(6, { message: 'Postal code must be at least 6 characters' }),
  country: z.string().default('India'),
  
  // Banking Information
  bankName: z.string().min(2, { message: 'Bank name is required' }),
  bankAccountNumber: z.string().min(8, { message: 'Account number must be at least 8 digits' }),
  bankIfscCode: z.string().min(11, { message: 'IFSC code must be 11 characters' }).max(11),
  
  // Business Details
  annualTurnover: z.string().min(1, { message: 'Please select annual turnover' }),
  yearsInBusiness: z.coerce.number().min(0, { message: 'Years in business must be 0 or more' }),
  primaryProductCategories: z.array(z.string()).min(1, { message: 'Select at least one product category' }),
  certifications: z.array(z.string()).optional(),
});

type SellerRegistrationData = z.infer<typeof sellerRegistrationSchema>;

const businessTypes = [
  'Private Limited Company',
  'Public Limited Company',
  'Partnership Firm',
  'Sole Proprietorship',
  'Limited Liability Partnership (LLP)',
  'One Person Company (OPC)',
];

const annualTurnoverRanges = [
  'Below ₹1 Crore',
  '₹1-5 Crores',
  '₹5-25 Crores',
  '₹25-100 Crores',
  'Above ₹100 Crores',
];

// Category label → slug mapping (must match seller_categories.category_slug used by RFQ router)
const categoryMap: Record<string, string> = {
  'Low Voltage Switchgear': 'low-voltage-switchgears',
  'Control Gear and Signalling Devices': 'controlling-gear-signalling-devices',
  'Wires and Cables': 'wires-cables',
  'Industrial Plugs and Sockets': 'industrial-plugs-sockets',
  'Capacitors and Reactors': 'capacitors-reactors',
  'Relays': 'relays',
  'Industrial Automation (VFD)': 'industrial-automation',
  'LED Lights': 'led-lights',
  'Test and Measuring Instruments': 'test-measuring-instruments',
  'Conduits and Accessories': 'conduits-accessories',
  'Industrial Fans': 'industrial-fans',
  'Switches and Sockets': 'switches-sockets',
  'Meters': 'meters',
  'Hand Tools': 'hand-tools',
  'Fans': 'fans',
};

const productCategories = Object.keys(categoryMap);

const certificationOptions = [
  'ISO 9001:2015',
  'ISO 14001:2015',
  'ISO 45001:2018',
  'BIS Certification',
  'CE Marking',
  'NABL Accreditation',
  'Other',
];

interface SellerRegistrationFormProps {
  onSuccess?: () => void;
}

const SellerRegistrationForm: React.FC<SellerRegistrationFormProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SellerRegistrationData>({
    resolver: zodResolver(sellerRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      companyName: '',
      companyDescription: '',
      businessType: '',
      registrationNumber: '',
      website: '',
      gstNumber: '',
      companyPanNumber: '',
      taxId: '',
      tradeLicenseNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      annualTurnover: '',
      yearsInBusiness: 0,
      primaryProductCategories: [],
      certifications: [],
    },
  });

  const steps = [
    { title: 'Basic Information', fields: ['name', 'email', 'password', 'phoneNumber'] },
    { title: 'Company Details', fields: ['companyName', 'companyDescription', 'businessType', 'registrationNumber', 'website'] },
    { title: 'Tax Information', fields: ['gstNumber', 'companyPanNumber', 'taxId', 'tradeLicenseNumber'] },
    { title: 'Address Information', fields: ['address', 'city', 'state', 'postalCode', 'country'] },
    { title: 'Banking Details', fields: ['bankName', 'bankAccountNumber', 'bankIfscCode'] },
    { title: 'Business Profile', fields: ['annualTurnover', 'yearsInBusiness', 'primaryProductCategories', 'certifications'] },
    { title: 'Documents Upload', fields: [] },
  ];

  const validateStep = async (stepNumber: number) => {
    const stepFields = steps[stepNumber - 1].fields;
    const isValid = await form.trigger(stepFields as any);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (fileType: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const removeFile = (fileType: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  const onSubmit = async (data: SellerRegistrationData) => {
    setIsLoading(true);
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'seller',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // Insert seller onboarding data
        const { error: onboardingError } = await supabase
          .from('seller_onboarding')
          .insert({
            user_id: userId,
            company_name: data.companyName,
            company_description: data.companyDescription,
            business_type: data.businessType,
            registration_number: data.registrationNumber,
            website: data.website,
            gst_number: data.gstNumber,
            company_pan_number: data.companyPanNumber,
            tax_id: data.taxId,
            trade_license_number: data.tradeLicenseNumber,
            contact_email: data.email,
            contact_phone: data.phoneNumber,
            address: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.postalCode,
            country: data.country,
            bank_name: data.bankName,
            bank_account_number: data.bankAccountNumber,
            bank_ifsc_code: data.bankIfscCode,
            annual_turnover: data.annualTurnover,
            years_in_business: data.yearsInBusiness,
            primary_product_categories: data.primaryProductCategories,
            certifications: data.certifications,
            step: 7,
            status: 'pending'
          });

        if (onboardingError) throw onboardingError;

        // Sync selected categories to seller_categories table for RFQ routing
        const categoryRows = data.primaryProductCategories
          .map(label => categoryMap[label])
          .filter(Boolean)
          .map(slug => ({
            seller_id: userId,
            category_slug: slug,
            product_count: 0,
          }));

        if (categoryRows.length > 0) {
          const { error: catError } = await supabase
            .from('seller_categories')
            .upsert(categoryRows, { onConflict: 'seller_id,category_slug' });

          if (catError) {
            console.warn('Failed to sync seller categories:', catError);
          }
        }

        console.log(`🏪 SELLER_REGISTERED [${new Date().toISOString()}]`, {
          userId,
          email: data.email,
          categories: data.primaryProductCategories,
          categorySlugs: categoryRows.map(r => r.category_slug),
        });
      }

      toast({
        title: 'Registration Successful',
        description: 'Your seller registration has been submitted for review.',
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Something went wrong during registration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
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
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@company.com" {...field} />
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
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company Ltd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of your company..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="CIN/Registration Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.yourcompany.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="22AAAAA0000A1Z5" maxLength={15} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyPanNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company PAN Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="AAAAA0000A" maxLength={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional Tax ID if any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tradeLicenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Trade License Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Complete business address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="400001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="HDFC Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Account Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankIfscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="HDFC0000001" maxLength={11} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="annualTurnover"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Turnover *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select annual turnover" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {annualTurnoverRanges.map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearsInBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years in Business *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryProductCategories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Product Categories *</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {productCategories.map(category => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(category) || false}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), category]
                              : (field.value || []).filter(c => c !== category);
                            field.onChange(newValue);
                          }}
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {certificationOptions.map(cert => (
                      <label key={cert} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(cert) || false}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), cert]
                              : (field.value || []).filter(c => c !== cert);
                            field.onChange(newValue);
                          }}
                        />
                        <span className="text-sm">{cert}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Please upload the following documents (Optional but recommended for faster approval):
            </p>
            
            {[
              { key: 'gst_certificate', label: 'GST Certificate' },
              { key: 'pan_card', label: 'Company PAN Card' },
              { key: 'authorization_certificate', label: 'Authorization Certificates from Manufacturers' },
              { key: 'incorporation_certificate', label: 'Incorporation Certificate' },
              { key: 'trade_license', label: 'Trade License' },
              { key: 'bank_statement', label: 'Bank Statement' },
            ].map(doc => (
              <div key={doc.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">{doc.label}</label>
                  {uploadedFiles[doc.key] && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                
                {uploadedFiles[doc.key] ? (
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{uploadedFiles[doc.key].name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(doc.key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop or click to upload
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.key, file);
                      }}
                      className="hidden"
                      id={`upload-${doc.key}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Seller Registration - {steps[currentStep - 1].title}</span>
              <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
            </CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep === steps.length ? (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          ) : (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default SellerRegistrationForm;
