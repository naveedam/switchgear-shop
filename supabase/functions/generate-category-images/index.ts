
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

  try {
    const { action, categorySlug } = await req.json();

    if (action === 'generate-single' && categorySlug) {
      return await generateSingleCategoryImage(categorySlug);
    }

    if (action === 'generate-all') {
      return await generateAllCategoryImages();
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-category-images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSingleCategoryImage(categorySlug: string) {
  const prompt = categoryPrompts[categorySlug];
  if (!prompt) {
    throw new Error(`No prompt found for category: ${categorySlug}`);
  }

  console.log(`Generating image for category: ${categorySlug}`);
  
  // Generate image with OpenAI
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      size: '1024x1024',
      quality: 'high',
      output_format: 'webp',
      n: 1
    }),
  });

  if (!imageResponse.ok) {
    const error = await imageResponse.text();
    throw new Error(`OpenAI image generation failed: ${error}`);
  }

  const imageData = await imageResponse.json();
  const base64Image = imageData.data[0].b64_json;
  
  // Convert base64 to blob
  const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
  
  // Upload to Supabase Storage
  const fileName = `category-${categorySlug}.webp`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  const imageUrl = publicUrlData.publicUrl;

  // Update category in database
  const { error: updateError } = await supabase
    .from('product_categories')
    .update({ image_url: imageUrl })
    .eq('slug', categorySlug);

  if (updateError) {
    throw new Error(`Database update failed: ${updateError.message}`);
  }

  console.log(`Successfully generated and uploaded image for: ${categorySlug}`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      categorySlug,
      imageUrl,
      message: 'Image generated and updated successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateAllCategoryImages() {
  const results = [];
  const errors = [];

  console.log('Starting batch generation for all categories...');

  for (const [categorySlug, prompt] of Object.entries(categoryPrompts)) {
    try {
      console.log(`Processing category: ${categorySlug}`);
      
      // Generate image
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          size: '1024x1024',
          quality: 'high',
          output_format: 'webp',
          n: 1
        }),
      });

      if (!imageResponse.ok) {
        const error = await imageResponse.text();
        throw new Error(`OpenAI failed: ${error}`);
      }

      const imageData = await imageResponse.json();
      const base64Image = imageData.data[0].b64_json;
      
      // Convert and upload
      const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      const fileName = `category-${categorySlug}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL and update database
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('product_categories')
        .update({ image_url: imageUrl })
        .eq('slug', categorySlug);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      results.push({
        categorySlug,
        imageUrl,
        success: true
      });

      console.log(`✅ Successfully processed: ${categorySlug}`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to process ${categorySlug}:`, error);
      errors.push({
        categorySlug,
        error: error.message
      });
    }
  }

  console.log(`Batch generation complete. Success: ${results.length}, Errors: ${errors.length}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Generated ${results.length} images successfully`,
      results,
      errors,
      total: Object.keys(categoryPrompts).length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
