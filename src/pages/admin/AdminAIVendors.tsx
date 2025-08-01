import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building, Users, CheckCircle, Info } from 'lucide-react';

interface VendorResult {
  vendorsCreated: number;
  success: boolean;
  error?: string;
}

const AdminAIVendors: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreatingVendors, setIsCreatingVendors] = useState(false);
  const [vendorResults, setVendorResults] = useState<VendorResult | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const createVendors = async () => {
    setIsCreatingVendors(true);
    setVendorResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-products', {
        body: { action: 'create-vendors' }
      });

      if (error) throw error;

      setVendorResults(data);
      
      toast({
        title: data.success ? "Vendors created successfully" : "Vendor creation failed",
        description: data.success 
          ? `Successfully created ${data.vendorsCreated} vendor companies`
          : `Failed to create vendors: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error creating vendors:', error);
      toast({
        title: "Creation failed",
        description: "Failed to create vendor companies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVendors(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building className="h-8 w-8" />
          AI Vendor Companies
        </h1>
        <p className="text-muted-foreground mt-2">
          Create authentic Indian electrical equipment vendor companies to populate your marketplace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Vendor Companies
          </CardTitle>
          <CardDescription>
            Generate a comprehensive database of realistic Indian electrical equipment vendors 
            with complete company profiles and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createVendors}
            disabled={isCreatingVendors}
            size="lg"
            className="w-full"
          >
            {isCreatingVendors ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Vendors...
              </>
            ) : (
              <>
                <Building className="mr-2 h-4 w-4" />
                Create Vendor Companies
              </>
            )}
          </Button>

          {vendorResults && (
            <div className="space-y-3">
              <h3 className="font-semibold">Creation Results:</h3>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Vendor Companies</span>
                  <Badge variant={vendorResults.success ? "default" : "destructive"}>
                    {vendorResults.success ? `${vendorResults.vendorsCreated} created` : "Failed"}
                  </Badge>
                </div>
                {vendorResults.error && (
                  <span className="text-sm text-muted-foreground max-w-xs truncate">
                    {vendorResults.error}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Vendor Database Features:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 20+ authentic Indian electrical equipment companies</li>
              <li>• Complete company profiles with names, descriptions, and specializations</li>
              <li>• Realistic contact information including emails and phone numbers</li>
              <li>• Geographic distribution across major Indian industrial cities</li>
              <li>• Diverse company sizes from small manufacturers to large distributors</li>
              <li>• Industry-specific focus areas (LED lighting, panels, motors, etc.)</li>
              <li>• Established since dates ranging from 1985 to 2020</li>
              <li>• Professional vendor status and active account setup</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">Sample Vendor Companies</span>
            </div>
            <div className="text-sm text-blue-700 space-y-2">
              <div>
                <p><strong>ElectroMax Industries</strong> - LED lighting and energy-efficient solutions specialist based in Mumbai</p>
              </div>
              <div>
                <p><strong>Bharat Power Systems</strong> - Industrial electrical panels and switchgear manufacturer from Chennai</p>
              </div>
              <div>
                <p><strong>SafetyFirst Electricals</strong> - Circuit breakers and electrical safety equipment supplier in Delhi</p>
              </div>
              <div>
                <p><strong>GreenTech Solutions</strong> - Renewable energy and solar equipment distributor from Bangalore</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Why Create Vendors First?</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• <strong>Product Assignment:</strong> Each generated product needs a vendor relationship</p>
              <p>• <strong>Realistic Marketplace:</strong> Creates authentic B2B marketplace experience</p>
              <p>• <strong>Price Diversity:</strong> Different vendors offer varied pricing strategies</p>
              <p>• <strong>Trust Building:</strong> Established vendor profiles increase buyer confidence</p>
              <p>• <strong>Search & Filtering:</strong> Enables vendor-based product discovery</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIVendors;