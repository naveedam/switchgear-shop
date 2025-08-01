
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Image, 
  Package, 
  Building2,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerationResult {
  categorySlug?: string;
  category?: string;
  vendor?: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
  generated?: number;
  total?: number;
}

const AdminAIGeneration: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [isCreatingVendors, setIsCreatingVendors] = useState(false);
  const [imageResults, setImageResults] = useState<GenerationResult[]>([]);
  const [productResults, setProductResults] = useState<GenerationResult[]>([]);
  const [vendorResults, setVendorResults] = useState<GenerationResult[]>([]);

  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const generateMissingImages = async () => {
    setIsGeneratingImages(true);
    setImageResults([]);
    
    try {
      console.log('Starting AI image generation for missing categories...');
      
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-missing' }
      });

      if (error) throw error;

      console.log('Missing image generation completed:', data);
      setImageResults(data.results || []);
      
      toast({
        title: "Image Generation Complete",
        description: data.total === 0 
          ? "All categories already have AI-generated images" 
          : `Successfully generated ${data.results?.filter((r: any) => r.success).length || 0} missing category images`,
      });

    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate images",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const retryFailedImage = async (categorySlug: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-single', categorySlug }
      });

      if (error) throw error;

      // Update the results
      setImageResults(prev => prev.map(result => 
        result.categorySlug === categorySlug ? data : result
      ));

      toast({
        title: data.success ? "Image Generated" : "Generation Failed",
        description: data.success 
          ? `Successfully generated image for ${categoryNames[categorySlug]}` 
          : data.error,
        variant: data.success ? "default" : "destructive",
      });

    } catch (error: any) {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry image generation",
        variant: "destructive",
      });
    }
  };

  const createVendors = async () => {
    setIsCreatingVendors(true);
    setVendorResults([]);
    
    try {
      console.log('Creating vendor companies...');
      
      const { data, error } = await supabase.functions.invoke('generate-products', {
        body: { action: 'create-vendors' }
      });

      if (error) throw error;

      console.log('Vendor creation completed:', data);
      setVendorResults(data.results || []);
      
      toast({
        title: "Vendor Creation Complete",
        description: `Successfully created ${data.results?.filter((r: any) => r.success).length || 0} vendor companies`,
      });

    } catch (error: any) {
      console.error('Vendor creation failed:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create vendors",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVendors(false);
    }
  };

  const generateAllProducts = async () => {
    setIsGeneratingProducts(true);
    setProductResults([]);
    
    try {
      console.log('Starting AI product generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-products', {
        body: { action: 'generate-all-products' }
      });

      if (error) throw error;

      console.log('Product generation completed:', data);
      setProductResults(data.results || []);
      
      toast({
        title: "Product Generation Complete",
        description: `Successfully generated ${data.totalGenerated || 0} products`,
      });

    } catch (error: any) {
      console.error('Product generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate products",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProducts(false);
    }
  };

  const categoryNames: Record<string, string> = {
    'low-voltage-switchgears': 'Low Voltage Switchgears',
    'controlling-gear-signalling-devices': 'Controlling Gear & Signalling Devices',
    'capacitors-reactors': 'Capacitors & Reactors',
    'wires-cables': 'Wires & Cables',
    'industrial-automation': 'Industrial Automation',
    'industrial-fans': 'Industrial Fans',
    'meters': 'Meters',
    'relays': 'Relays',
    'switches-sockets': 'Switches & Sockets',
    'industrial-plugs-sockets': 'Industrial Plugs & Sockets',
    'led-lights': 'LED Lights',
    'fans': 'Fans',
    'test-measuring-instruments': 'Test & Measuring Instruments',
    'hand-tools': 'Hand Tools',
    'conduits-accessories': 'Conduits & Accessories'
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Generation Center</h1>
        <p className="text-gray-600 mt-2">
          Generate category images and populate product database using AI
        </p>
      </div>
      
      <Tabs defaultValue="images" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">Category Images</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Companies</TabsTrigger>
          <TabsTrigger value="products">Product Database</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                AI Category Image Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Generate professional AI images for categories that don't have them yet using OpenAI's DALL-E 3.
                  </p>
                  <p className="text-xs text-gray-500">
                    This will only generate images for categories missing AI-generated images.
                  </p>
                </div>
                <Button 
                  onClick={generateMissingImages}
                  disabled={isGeneratingImages}
                  className="flex items-center gap-2"
                >
                  {isGeneratingImages ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGeneratingImages ? 'Generating...' : 'Generate Missing Images'}
                </Button>
              </div>

              {isGeneratingImages && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Generating missing category images... This may take a few minutes.
                  </p>
                </div>
              )}

              {imageResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Generation Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {imageResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {categoryNames[result.categorySlug || ''] || result.categorySlug}
                            </p>
                            {result.error && (
                              <p className="text-xs text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!result.success && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryFailedImage(result.categorySlug || '')}
                              className="text-xs"
                            >
                              Retry
                            </Button>
                          )}
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Company Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Create realistic Indian electrical equipment vendor companies.
                  </p>
                  <p className="text-xs text-gray-500">
                    This will create 5 vendor companies (Schneider, L&T, Havells, ABB, Siemens).
                  </p>
                </div>
                <Button 
                  onClick={createVendors}
                  disabled={isCreatingVendors}
                  className="flex items-center gap-2"
                >
                  {isCreatingVendors ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {isCreatingVendors ? 'Creating...' : 'Create Vendors'}
                </Button>
              </div>

              {vendorResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Creation Results</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {vendorResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{result.vendor}</p>
                            {result.error && (
                              <p className="text-xs text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'Created' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                AI Product Database Population
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Generate realistic products with technical specifications using AI.
                  </p>
                  <p className="text-xs text-gray-500">
                    This will create ~45 products (15 per category) with realistic specifications and pricing.
                  </p>
                </div>
                <Button 
                  onClick={generateAllProducts}
                  disabled={isGeneratingProducts || !vendorResults.some(r => r.success)}
                  className="flex items-center gap-2"
                >
                  {isGeneratingProducts ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {isGeneratingProducts ? 'Generating...' : 'Generate Products'}
                </Button>
              </div>

              {!vendorResults.some(r => r.success) && (
                <p className="text-sm text-amber-600">
                  ⚠️ Please create vendors first before generating products.
                </p>
              )}

              {isGeneratingProducts && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Generating products with AI... This may take several minutes.
                  </p>
                </div>
              )}

              {productResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Generation Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {productResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {categoryNames[result.category || ''] || result.category}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.generated || 0} products generated
                            </p>
                            {result.error && (
                              <p className="text-xs text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? `${result.generated} Created` : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                <p>• Products generated with realistic technical specifications</p>
                <p>• Pricing in INR with proper HSN codes for electrical equipment</p>
                <p>• Distributed across vendor companies for authentic marketplace feel</p>
                <p>• All products include warranty, stock quantities, and MOQ details</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAIGeneration;
