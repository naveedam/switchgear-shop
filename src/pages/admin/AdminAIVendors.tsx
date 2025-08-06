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
      const { data, error } = await supabase.functions.invoke('generate-bangalore-sellers');

      if (error) throw error;

      setVendorResults({
        success: data.success,
        vendorsCreated: data.sellersCreated,
        error: data.error
      });
      
      toast({
        title: data.success ? "Bangalore sellers created successfully" : "Seller creation failed",
        description: data.success 
          ? `Successfully created ${data.sellersCreated} Bangalore-based sellers with brand authorizations`
          : `Failed to create sellers: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error creating sellers:', error);
      toast({
        title: "Creation failed",
        description: "Failed to create Bangalore sellers. Please try again.",
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
          Bangalore Sellers
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate authentic Bangalore-based electrical equipment sellers with brand authorizations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Bangalore Sellers
          </CardTitle>
          <CardDescription>
            Generate authentic Bangalore-based electrical equipment sellers with brand authorizations 
            for SIEMENS, Legrand, Schneider, Fonolex, and BCH.
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
                Create Bangalore Sellers
              </>
            )}
          </Button>

          {vendorResults && (
            <div className="space-y-3">
              <h3 className="font-semibold">Creation Results:</h3>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Bangalore Sellers</span>
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
              Bangalore Seller Features:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 8 authentic Bangalore-based electrical equipment sellers</li>
              <li>• Complete company profiles with names, descriptions, and specializations</li>
              <li>• Realistic Bangalore addresses and contact information</li>
              <li>• GST numbers, PAN details, and bank account information</li>
              <li>• Brand authorizations for SIEMENS, Legrand, Schneider, Fonolex, BCH</li>
              <li>• Diverse company sizes from small distributors to premium partners</li>
              <li>• Years in business ranging from 4 to 25 years</li>
              <li>• Pre-approved status for immediate marketplace participation</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">Sample Bangalore Sellers</span>
            </div>
            <div className="text-sm text-blue-700 space-y-2">
              <div>
                <p><strong>ElectroTech Solutions</strong> - Schneider & SIEMENS authorized dealer in Electronic City</p>
              </div>
              <div>
                <p><strong>Karnataka Electrical Distributors</strong> - Multi-brand distributor in Peenya Industrial Area</p>
              </div>
              <div>
                <p><strong>Bangalore Power Systems</strong> - SIEMENS & Legrand partner in Whitefield</p>
              </div>
              <div>
                <p><strong>Silicon Valley Electricals</strong> - Fonolex cables specialist in Koramangala</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Why Bangalore Sellers?</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• <strong>Tech Hub:</strong> Bangalore is India's tech capital with high electrical equipment demand</p>
              <p>• <strong>Brand Presence:</strong> Major electrical brands have strong presence in Bangalore</p>
              <p>• <strong>Industrial Base:</strong> Strong manufacturing and IT infrastructure needs</p>
              <p>• <strong>Realistic Market:</strong> Creates authentic local marketplace experience</p>
              <p>• <strong>Quality Sellers:</strong> Established businesses with proper authorizations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIVendors;