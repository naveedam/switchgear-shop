import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, Wand2, RotateCcw } from 'lucide-react';

interface GenerationResult {
  categorySlug: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
}

const AdminAIImages: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);

  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const generateMissingImages = async () => {
    setIsGenerating(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-missing' }
      });

      if (error) throw error;

      setResults(data.results || []);
      
      const successCount = data.results?.filter((r: GenerationResult) => r.success).length || 0;
      const totalCount = data.results?.length || 0;

      toast({
        title: "Image generation completed",
        description: `Successfully generated ${successCount}/${totalCount} category images`,
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate category images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFailedImage = async (categorySlug: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-single', categorySlug }
      });

      if (error) throw error;

      // Update the specific result
      setResults(prev => prev.map(result => 
        result.categorySlug === categorySlug 
          ? { ...result, success: data.success, error: data.error, imageUrl: data.imageUrl }
          : result
      ));

      toast({
        title: data.success ? "Image generated successfully" : "Generation failed",
        description: data.success 
          ? `Generated image for ${categorySlug}` 
          : `Failed to generate image: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error retrying image generation:', error);
      toast({
        title: "Retry failed",
        description: "Failed to retry image generation. Please try again.",
        variant: "destructive",
      });
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
          <Image className="h-8 w-8" />
          AI Category Images
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate professional category images using AI to enhance your marketplace appearance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generate Missing Category Images
          </CardTitle>
          <CardDescription>
            Automatically generate AI-powered images for categories that don't have custom images yet.
            This will only generate images for categories currently using placeholder images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateMissingImages}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Images...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Missing Images
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Generation Results:</h3>
              <div className="grid gap-2">
                {results.map((result) => (
                  <div key={result.categorySlug} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {categoryNames[result.categorySlug] || result.categorySlug}
                      </span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.error && (
                        <span className="text-sm text-muted-foreground max-w-xs truncate">
                          {result.error}
                        </span>
                      )}
                      {!result.success && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryFailedImage(result.categorySlug)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Scans all product categories for missing AI-generated images</li>
              <li>• Generates unique, professional images using AI based on category context</li>
              <li>• Automatically uploads images to your storage bucket</li>
              <li>• Updates category records with new image URLs</li>
              <li>• Provides detailed results with retry options for failed generations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIImages;