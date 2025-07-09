
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, RefreshCw, CheckCircle, XCircle, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerationResult {
  categorySlug: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
}

const ImageGenerationPanel: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const { toast } = useToast();

  const generateAllImages = async () => {
    setIsGenerating(true);
    setResults([]);
    
    try {
      console.log('Starting AI image generation for all categories...');
      
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-all' }
      });

      if (error) throw error;

      console.log('Generation completed:', data);
      setResults(data.results || []);
      
      toast({
        title: "Image Generation Complete",
        description: `Successfully generated ${data.results?.length || 0} category images`,
      });

    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate images",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSingleImage = async (categorySlug: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-category-images', {
        body: { action: 'generate-single', categorySlug }
      });

      if (error) throw error;

      toast({
        title: "Image Generated",
        description: `Successfully generated image for ${categorySlug}`,
      });

      // Update results if this category was in the previous batch
      setResults(prev => prev.map(result => 
        result.categorySlug === categorySlug 
          ? { ...result, success: true, imageUrl: data.imageUrl }
          : result
      ));

    } catch (error: any) {
      console.error('Single image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
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
              Generate professional AI images for all product categories using OpenAI's advanced image model.
            </p>
            <p className="text-xs text-gray-500">
              This will create high-quality, royalty-free images optimized for your marketplace.
            </p>
          </div>
          <Button 
            onClick={generateAllImages}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate All Images'}
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Generating images for 15 categories... This may take a few minutes.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Generation Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result.categorySlug} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {categoryNames[result.categorySlug] || result.categorySlug}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                    {!result.success && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateSingleImage(result.categorySlug)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Images are generated at 1024x1024px in WebP format for optimal performance</p>
          <p>• All images are automatically uploaded to Supabase Storage and database is updated</p>
          <p>• Estimated cost: ~$2.25 for all 15 categories (using OpenAI's advanced image model)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageGenerationPanel;
