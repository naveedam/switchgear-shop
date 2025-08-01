import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Database, Settings, Info } from 'lucide-react';

interface ProductGenerationResult {
  category: string;
  productsGenerated: number;
  success: boolean;
  error?: string;
}

const AdminAIProducts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [productResults, setProductResults] = useState<ProductGenerationResult[]>([]);
  const [hasVendors, setHasVendors] = useState(true);

  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
    checkVendorStatus();
  }, [isAuthenticated, user, navigate]);

  const checkVendorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('is_vendor', true)
        .eq('status', 'active')
        .limit(1);

      if (error) throw error;
      setHasVendors(data && data.length > 0);
    } catch (error) {
      console.error('Error checking vendor status:', error);
      setHasVendors(false);
    }
  };

  const generateAllProducts = async () => {
    if (!hasVendors) {
      toast({
        title: "No vendors available",
        description: "Please create vendor companies first before generating products.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProducts(true);
    setProductResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-products', {
        body: { action: 'generate-all-products' }
      });

      if (error) throw error;

      setProductResults(data.results || []);
      
      const successCount = data.results?.filter((r: ProductGenerationResult) => r.success).length || 0;
      const totalCount = data.results?.length || 0;
      const totalProducts = data.results?.reduce((sum: number, r: ProductGenerationResult) => sum + (r.productsGenerated || 0), 0) || 0;

      toast({
        title: "Product generation completed",
        description: `Successfully generated ${totalProducts} products across ${successCount}/${totalCount} categories`,
      });
    } catch (error) {
      console.error('Error generating products:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProducts(false);
    }
  };

  const categoryNames: Record<string, string> = {
    'led-lighting': 'LED Lighting',
    'switches-sockets': 'Switches & Sockets',
    'electrical-tools': 'Electrical Tools',
    'cables-wires': 'Cables & Wires',
    'electrical-panels': 'Electrical Panels',
    'circuit-breakers': 'Circuit Breakers',
    'transformers': 'Transformers',
    'electrical-meters': 'Electrical Meters',
    'conduits-fittings': 'Conduits & Fittings',
    'electrical-safety': 'Electrical Safety',
    'motor-controls': 'Motor Controls',
    'power-distribution': 'Power Distribution',
    'electrical-accessories': 'Electrical Accessories',
    'industrial-equipment': 'Industrial Equipment',
    'renewable-energy': 'Renewable Energy'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          AI Product Database
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive product catalogs with detailed specifications and competitive pricing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Generate Product Database
          </CardTitle>
          <CardDescription>
            Create a comprehensive product database with AI-generated products, specifications, and pricing 
            across all electrical equipment categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateAllProducts}
            disabled={isGeneratingProducts || !hasVendors}
            size="lg"
            className="w-full"
          >
            {isGeneratingProducts ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Products...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Generate All Products
              </>
            )}
          </Button>

          {!hasVendors && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">No vendors available</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                You need to create vendor companies first before generating products. 
                Visit the AI Vendors page to set up vendor companies.
              </p>
            </div>
          )}

          {productResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Generation Results:</h3>
              <div className="grid gap-2">
                {productResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {categoryNames[result.category] || result.category}
                      </span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? `${result.productsGenerated} products` : "Failed"}
                      </Badge>
                    </div>
                    {result.error && (
                      <span className="text-sm text-muted-foreground max-w-xs truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Product Generation Features:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Generates 15 unique products per category (225+ total products)</li>
              <li>• AI-powered product names, descriptions, and technical specifications</li>
              <li>• Realistic pricing based on market analysis and category context</li>
              <li>• Detailed technical specifications including voltage, current, power ratings</li>
              <li>• Professional model numbers and SKU generation</li>
              <li>• Random vendor assignment from your active vendor database</li>
              <li>• Industry-standard certifications and compliance information</li>
              <li>• Competitive lead times and minimum order quantities</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">How Product Generation Works</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. <strong>Category Analysis:</strong> AI analyzes each electrical equipment category</p>
              <p>2. <strong>Product Creation:</strong> Generates realistic product names and descriptions</p>
              <p>3. <strong>Specification Generation:</strong> Creates detailed technical specifications</p>
              <p>4. <strong>Pricing Strategy:</strong> Applies market-competitive pricing models</p>
              <p>5. <strong>Vendor Assignment:</strong> Randomly assigns products to active vendors</p>
              <p>6. <strong>Database Integration:</strong> Saves all data with proper relationships</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIProducts;