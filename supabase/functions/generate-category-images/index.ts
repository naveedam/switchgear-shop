import { errorResponse, requireUser } from "../_shared/guard.ts";

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Category-specific prompts for high-quality, professional images
const categoryPrompts: Record<string, string> = {
  'low-voltage-switchgears': 'Professional industrial low voltage switchgear panel with multiple circuit breakers, clean modern design, industrial setting, high-tech electrical equipment',
  'controlling-gear-signalling-devices': 'Modern industrial control panel with signal lights, push buttons, and control switches, professional lighting, clean technical environment',
  'capacitors-reactors': 'Industrial electrical capacitor bank and reactor units, clean technical arrangement, modern electrical facility, professional equipment',
  'wires-cables': 'Professional display of various electrical cables and wires, organized arrangement, industrial quality, modern electrical components',
  'industrial-automation': 'Modern industrial automation equipment with PLCs, control panels, and robotic systems, high-tech manufacturing environment',
  'industrial-fans': 'Large industrial ventilation fans in modern facility, professional lighting, clean industrial environment, powerful cooling systems',
  'meters': 'Professional electrical measuring instruments and digital meters, technical display arrangement, modern testing equipment',
  'relays': 'Collection of industrial electrical relays and contactors, organized technical display, professional electrical components',
  'switches-sockets': 'Professional arrangement of electrical switches and socket outlets, modern design, clean technical presentation',
  'industrial-plugs-sockets': 'Heavy-duty industrial plugs and sockets, professional technical arrangement, robust electrical connections',
  'led-lights': 'Modern LED lighting fixtures and panels, bright professional display, energy-efficient lighting solutions',
  'fans': 'Various cooling and ventilation fans, clean professional arrangement, modern air circulation equipment',
  'test-measuring-instruments': 'Professional electrical testing equipment and measuring instruments, high-tech diagnostic tools, modern laboratory setup',
  'hand-tools': 'Professional electrical hand tools and equipment, organized display, precision instruments for electrical work',
  'conduits-accessories': 'Cable management conduits and accessories, professional technical arrangement, organized electrical infrastructure'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // --- access guard ---
  try {
    await requireUser(req, ["admin"]);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    console.log('Request received:', req.method);
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { action, categorySlug } = await req.json();
    console.log('Action:', action, 'Category:', categorySlug);

    if (action === 'generate-single' && categorySlug) {
      return await generateSingleCategoryImage(categorySlug);
    }

    if (action === 'generate-all') {
      return await generateAllCategoryImages();
    }

    if (action === 'generate-missing') {
      return await generateMissingCategoryImages();
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in generate-category-images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSingleCategoryImageWithRetry(categorySlug: string, retries = 3): Promise<{ success: boolean; categorySlug: string; imageUrl?: string; error?: string }> {
  const prompt = categoryPrompts[categorySlug];
  if (!prompt) {
    return { success: false, categorySlug, error: `No prompt found for category: ${categorySlug}` };
  }

  console.log(`Generating image for category: ${categorySlug} (retries left: ${retries})`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${categorySlug}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff
      }

      // Generate image with OpenAI using dall-e-3 for better reliability
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI image generation failed: ${errorText}`);
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.data[0].url;
      
      console.log('Image generated successfully:', imageUrl);

      // Download the image
      const downloadResponse = await fetch(imageUrl);
      if (!downloadResponse.ok) {
        throw new Error('Failed to download generated image');
      }
      
      const imageBuffer = await downloadResponse.arrayBuffer();
      
      // Upload to Supabase Storage
      const fileName = `category-${categorySlug}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const finalImageUrl = publicUrlData.publicUrl;

      // Update category in database
      const { error: updateError } = await supabase
        .from('product_categories')
        .update({ image_url: finalImageUrl })
        .eq('slug', categorySlug);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log(`✅ Successfully generated and uploaded image for: ${categorySlug}`);
      
      return { success: true, categorySlug, imageUrl: finalImageUrl };

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt + 1} failed for ${categorySlug}:`, error.message);
      
      if (attempt === retries) {
        return { success: false, categorySlug, error: error.message };
      }
    }
  }

  return { success: false, categorySlug, error: 'All retry attempts failed' };
}

async function generateSingleCategoryImage(categorySlug: string) {
  const result = await generateSingleCategoryImageWithRetry(categorySlug);
  
  return new Response(
    JSON.stringify(result),
    { 
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function generateMissingCategoryImages() {
  console.log('Finding categories with missing AI-generated images...');
  
  // Get all categories from database
  const { data: categories, error: fetchError } = await supabase
    .from('product_categories')
    .select('slug, image_url')
    .order('sort_order');

  if (fetchError) {
    throw new Error(`Failed to fetch categories: ${fetchError.message}`);
  }

  // Find categories that don't have AI-generated images (still using placeholder images)
  const missingCategories = categories?.filter(cat => 
    categoryPrompts[cat.slug] && 
    (!cat.image_url || cat.image_url.includes('unsplash.com'))
  ) || [];

  console.log(`Found ${missingCategories.length} categories needing AI images:`, missingCategories.map(c => c.slug));

  if (missingCategories.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'All categories already have AI-generated images',
        results: [],
        total: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results = [];
  
  for (const category of missingCategories) {
    console.log(`Processing missing category: ${category.slug}`);
    
    const result = await generateSingleCategoryImageWithRetry(category.slug);
    results.push(result);
    
    // Delay between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Missing image generation complete. Success: ${successCount}, Failed: ${results.length - successCount}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Generated ${successCount} missing images successfully`,
      results,
      total: missingCategories.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateAllCategoryImages() {
  console.log('Starting batch generation for all categories...');
  
  const results = [];
  
  for (const categorySlug of Object.keys(categoryPrompts)) {
    console.log(`Processing category: ${categorySlug}`);
    
    const result = await generateSingleCategoryImageWithRetry(categorySlug);
    results.push(result);
    
    // Delay between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Batch generation complete. Success: ${successCount}, Failed: ${results.length - successCount}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Generated ${successCount} images successfully`,
      results,
      total: Object.keys(categoryPrompts).length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
