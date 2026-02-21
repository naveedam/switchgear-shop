
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

// Indian electrical equipment vendors
const vendors = [
  {
    name: 'Schneider Electric India',
    email: 'sales@schneider-electric.in',
    phone: '+91-80-67184000',
    address: 'Bangalore, Karnataka, India',
    description: 'Leading provider of energy management and automation solutions'
  },
  {
    name: 'L&T Electrical & Automation',
    email: 'info@lntecc.com',
    phone: '+91-22-67525656',
    address: 'Mumbai, Maharashtra, India',
    description: 'Comprehensive electrical and automation solutions provider'
  },
  {
    name: 'Havells India Limited',
    email: 'customercare@havells.com',
    phone: '+91-11-23467000',
    address: 'New Delhi, India',
    description: 'Leading electrical equipment and consumer durables manufacturer'
  },
  {
    name: 'ABB India Limited',
    email: 'contact.center@in.abb.com',
    phone: '+91-80-22949000',
    address: 'Bangalore, Karnataka, India',
    description: 'Power and automation technology solutions provider'
  },
  {
    name: 'Siemens Limited India',
    email: 'info@siemens.co.in',
    phone: '+91-22-39677000',
    address: 'Mumbai, Maharashtra, India',
    description: 'Engineering company focused on industry, energy, and healthcare'
  }
];

// Category-specific product templates
const productTemplates = {
  'low-voltage-switchgears': {
    baseProducts: ['MCB', 'MCCB', 'RCCB', 'Isolator', 'Contactor'],
    specifications: {
      rated_voltage: ['230V', '400V', '440V', '500V'],
      rated_current: ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '50A', '63A', '80A', '100A'],
      breaking_capacity: ['6kA', '10kA', '15kA', '25kA', '36kA'],
      number_of_poles: [1, 2, 3, 4],
      tripping_characteristic: ['B', 'C', 'D'],
      mounting_type: ['DIN Rail', 'Fixed', 'Withdrawable'],
      ip_rating: ['IP20', 'IP40', 'IP54', 'IP65']
    },
    priceRange: [500, 15000]
  },
  'wires-cables': {
    baseProducts: ['PVC Cable', 'XLPE Cable', 'Flexible Cable', 'Armoured Cable', 'Control Cable'],
    specifications: {
      conductor_material: ['Copper', 'Aluminium'],
      nominal_cross_section: ['1.5 sq mm', '2.5 sq mm', '4 sq mm', '6 sq mm', '10 sq mm', '16 sq mm'],
      voltage_rating: ['1.1kV', '3.3kV', '11kV', '33kV'],
      number_of_cores: [1, 2, 3, 4, 7, 12, 19],
      insulation_material: ['PVC', 'XLPE', 'EPR'],
      sheath_material: ['PVC', 'LSZH', 'PE'],
      armoured: [true, false]
    },
    priceRange: [50, 5000]
  },
  'led-lights': {
    baseProducts: ['LED Panel', 'LED Bulb', 'LED Tube', 'LED Flood Light', 'LED Street Light'],
    specifications: {
      power_rating: ['9W', '12W', '18W', '36W', '50W', '100W', '150W'],
      luminous_flux: ['900 lm', '1200 lm', '1800 lm', '3600 lm', '5000 lm'],
      color_temperature: ['3000K', '4000K', '6500K'],
      beam_angle: ['60°', '90°', '120°', '160°'],
      ip_rating: ['IP20', 'IP44', 'IP65', 'IP66'],
      dimming_capability: [true, false],
      operating_life_hours: ['25000 hrs', '50000 hrs']
    },
    priceRange: [100, 8000]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, category, count = 10 } = await req.json();
    
    if (action === 'create-vendors') {
      return await createVendors();
    }
    
    if (action === 'generate-products') {
      return await generateProducts(category, count);
    }
    
    if (action === 'generate-all-products') {
      return await generateAllProducts();
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in generate-products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createVendors() {
  console.log('Creating vendor companies...');
  const results = [];
  
  for (const vendor of vendors) {
    try {
      const vendorId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('companies')
        .insert({
          id: vendorId,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          description: vendor.description,
          is_vendor: true,
          status: 'active'
        });
      
      if (error) {
        console.error(`Error creating vendor ${vendor.name}:`, error);
        results.push({ vendor: vendor.name, success: false, error: error.message });
      } else {
        console.log(`✅ Created vendor: ${vendor.name}`);
        results.push({ vendor: vendor.name, success: true, id: vendorId });
      }
    } catch (error: unknown) {
      console.error(`Error creating vendor ${vendor.name}:`, error);
      results.push({ vendor: vendor.name, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateProducts(category: string, count: number) {
  console.log(`Generating ${count} products for category: ${category}`);
  
  // Get vendor IDs
  const { data: vendorData, error: vendorError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_vendor', true)
    .eq('status', 'active');
  
  if (vendorError || !vendorData?.length) {
    throw new Error('No vendors found. Please create vendors first.');
  }
  
  const template = (productTemplates as Record<string, any>)[category];
  if (!template) {
    throw new Error(`No template found for category: ${category}`);
  }
  
  const results = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const vendor = vendorData[Math.floor(Math.random() * vendorData.length)];
      const baseProduct = template.baseProducts[Math.floor(Math.random() * template.baseProducts.length)];
      
      // Generate product using AI
      const aiPrompt = `Generate a realistic ${baseProduct} product for category ${category}. 
      Include: product name, description, model number, and technical specifications.
      Make it sound professional and technical. Keep description under 200 words.`;
      
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert in electrical equipment. Generate realistic product details.' },
            { role: 'user', content: aiPrompt }
          ],
          max_tokens: 500
        }),
      });
      
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      // Parse AI response and create product
      const productName = `${vendor.name.split(' ')[0]} ${baseProduct} ${String(i + 1).padStart(3, '0')}`;
      const price = Math.floor(Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]);
      
      // Generate random specifications based on template
      const specs: any = {};
      for (const [key, values] of Object.entries(template.specifications)) {
        if (Array.isArray(values)) {
          specs[key] = values[Math.floor(Math.random() * values.length)];
        }
      }
      
      const product = {
        name: productName,
        description: aiContent.substring(0, 300),
        vendor_id: vendor.id,
        category: category,
        price: price,
        currency: 'INR',
        stock_quantity: Math.floor(Math.random() * 100) + 10,
        min_order_quantity: Math.floor(Math.random() * 5) + 1,
        status: 'active',
        hsn_code: '8536',
        model_number: `${baseProduct.replace(/\s+/g, '').toUpperCase()}-${Math.floor(Math.random() * 9999)}`,
        warranty_period: '1 year',
        ...specs
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select();
      
      if (error) {
        console.error(`Error creating product ${i + 1}:`, error);
        results.push({ index: i + 1, success: false, error: error.message });
      } else {
        console.log(`✅ Created product ${i + 1}: ${productName}`);
        results.push({ index: i + 1, success: true, product: data[0] });
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: unknown) {
      console.error(`Error generating product ${i + 1}:`, error);
      results.push({ index: i + 1, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      category,
      generated: results.filter(r => r.success).length,
      total: count,
      results 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateAllProducts() {
  console.log('Generating products for all categories...');
  
  const allResults = [];
  
  for (const category of Object.keys(productTemplates)) {
    try {
      console.log(`Generating products for category: ${category}`);
      
      // Generate 15 products per category
      const response = await generateProducts(category, 15);
      const result = await response.json();
      
      allResults.push({
        category,
        success: true,
        generated: result.generated,
        details: result
      });
      
      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: unknown) {
      console.error(`Error generating products for ${category}:`, error);
      allResults.push({
        category,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const totalGenerated = allResults.reduce((sum, result) => 
    sum + (result.success ? result.generated : 0), 0
  );
  
  return new Response(
    JSON.stringify({
      success: true,
      message: `Generated ${totalGenerated} products across ${allResults.length} categories`,
      totalGenerated,
      results: allResults
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
