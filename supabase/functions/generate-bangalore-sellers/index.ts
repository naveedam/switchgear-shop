import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SellerData {
  company_name: string;
  company_description: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website?: string;
  gst_number: string;
  company_pan_number: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_name: string;
  annual_turnover: string;
  years_in_business: number;
  primary_product_categories: string[];
  certifications: string[];
  authorizedBrands: string[];
}

const bangaloreSellers: SellerData[] = [
  {
    company_name: "ElectroTech Solutions Pvt Ltd",
    company_description: "Leading electrical equipment distributor specializing in industrial automation and power distribution solutions",
    business_type: "Private Limited Company",
    contact_email: "sales@electrotechbangalore.com",
    contact_phone: "+91 80 4567 8901",
    address: "No. 45, Electronic City Phase 1, Hosur Road",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560100",
    country: "India",
    website: "https://www.electrotechbangalore.com",
    gst_number: "29AABCE2207R1Z5",
    company_pan_number: "AABCE2207R",
    bank_account_number: "50200012345678",
    bank_ifsc_code: "HDFC0001234",
    bank_name: "HDFC Bank",
    annual_turnover: "50-100 Crores",
    years_in_business: 12,
    primary_product_categories: ["Circuit Breakers", "Industrial Automation", "Power Distribution"],
    certifications: ["ISO 9001:2015", "Schneider Electric Authorized Dealer"],
    authorizedBrands: ["Schneider Electric", "SIEMENS"]
  },
  {
    company_name: "Karnataka Electrical Distributors",
    company_description: "Multi-brand electrical equipment distributor serving Bangalore and South India region",
    business_type: "Partnership Firm",
    contact_email: "info@karnatakelectrical.in",
    contact_phone: "+91 80 2876 5432",
    address: "Plot No. 123, Peenya Industrial Area, 4th Phase",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560058",
    country: "India",
    website: "https://www.karnatakelectrical.in",
    gst_number: "29AABCK4598L1Z8",
    company_pan_number: "AABCK4598L",
    bank_account_number: "60400087654321",
    bank_ifsc_code: "ICIC0006040",
    bank_name: "ICICI Bank",
    annual_turnover: "25-50 Crores",
    years_in_business: 18,
    primary_product_categories: ["Cables & Wires", "Switchgear", "Lighting"],
    certifications: ["ISO 9001:2015", "Legrand Premium Partner"],
    authorizedBrands: ["Legrand", "Fonolex", "BCH Electric"]
  },
  {
    company_name: "Bangalore Power Systems",
    company_description: "Premium electrical solutions provider with expertise in power systems and building automation",
    business_type: "Private Limited Company",
    contact_email: "contact@bangalorepower.com",
    contact_phone: "+91 80 6789 1234",
    address: "Survey No. 47/2, EPIP Zone, Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560066",
    country: "India",
    website: "https://www.bangalorepower.com",
    gst_number: "29AABCB3456P1Z1",
    company_pan_number: "AABCB3456P",
    bank_account_number: "91234567890123",
    bank_ifsc_code: "SBIN0012345",
    bank_name: "State Bank of India",
    annual_turnover: "10-25 Crores",
    years_in_business: 8,
    primary_product_categories: ["Building Automation", "Power Systems", "Energy Management"],
    certifications: ["ISO 9001:2015", "SIEMENS Authorized Partner"],
    authorizedBrands: ["SIEMENS", "Legrand"]
  },
  {
    company_name: "Silicon Valley Electricals",
    company_description: "Specialized cables and wires distributor with focus on data center and IT infrastructure",
    business_type: "Private Limited Company",
    contact_email: "sales@siliconvalleyelectricals.com",
    contact_phone: "+91 80 4123 5678",
    address: "No. 78, 5th Block, Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560095",
    country: "India",
    website: "https://www.siliconvalleyelectricals.com",
    gst_number: "29AABCS7891T1Z3",
    company_pan_number: "AABCS7891T",
    bank_account_number: "87654321098765",
    bank_ifsc_code: "AXIS0001234",
    bank_name: "Axis Bank",
    annual_turnover: "5-10 Crores",
    years_in_business: 6,
    primary_product_categories: ["Cables & Wires", "Data Center Solutions", "IT Infrastructure"],
    certifications: ["Fonolex Authorized Distributor", "ISO 9001:2015"],
    authorizedBrands: ["Fonolex", "BCH Electric"]
  },
  {
    company_name: "Metro Electrical Trading Co",
    company_description: "Traditional electrical equipment supplier serving contractors and builders across Bangalore",
    business_type: "Proprietorship",
    contact_email: "orders@metroelectrical.in",
    contact_phone: "+91 80 2234 6789",
    address: "Shop No. 456, Chickpet Main Road",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560053",
    country: "India",
    gst_number: "29AABCM9876H1Z7",
    company_pan_number: "AABCM9876H",
    bank_account_number: "12345678901234",
    bank_ifsc_code: "CNRB0001234",
    bank_name: "Canara Bank",
    annual_turnover: "2-5 Crores",
    years_in_business: 25,
    primary_product_categories: ["General Electrical", "Household Items", "Basic Wiring"],
    certifications: ["Local Trade License"],
    authorizedBrands: ["BCH Electric", "Fonolex"]
  },
  {
    company_name: "Apex Industrial Solutions",
    company_description: "Industrial electrical equipment specialist serving manufacturing and process industries",
    business_type: "Private Limited Company", 
    contact_email: "info@apexindustrial.co.in",
    contact_phone: "+91 80 3456 7890",
    address: "No. 234, Bommasandra Industrial Area",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560099",
    country: "India",
    website: "https://www.apexindustrial.co.in",
    gst_number: "29AABCA1234D1Z9",
    company_pan_number: "AABCA1234D",
    bank_account_number: "56789012345678",
    bank_ifsc_code: "HDFC0005678",
    bank_name: "HDFC Bank",
    annual_turnover: "75-100 Crores",
    years_in_business: 15,
    primary_product_categories: ["Industrial Motors", "Control Panels", "Process Automation"],
    certifications: ["ISO 9001:2015", "SIEMENS Premium Partner"],
    authorizedBrands: ["SIEMENS", "Schneider Electric"]
  },
  {
    company_name: "Smart Grid Technologies",
    company_description: "Next-generation electrical solutions provider focusing on smart grid and renewable energy",
    business_type: "Private Limited Company",
    contact_email: "contact@smartgridtech.in",
    contact_phone: "+91 80 7890 1234",
    address: "No. 89, Outer Ring Road, Marathahalli",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560037",
    country: "India",
    website: "https://www.smartgridtech.in",
    gst_number: "29AABCS5678G1Z2",
    company_pan_number: "AABCS5678G",
    bank_account_number: "34567890123456",
    bank_ifsc_code: "ICIC0003456",
    bank_name: "ICICI Bank",
    annual_turnover: "15-25 Crores",
    years_in_business: 4,
    primary_product_categories: ["Smart Meters", "Grid Automation", "Renewable Energy"],
    certifications: ["ISO 9001:2015", "Schneider Electric EcoXpert"],
    authorizedBrands: ["Schneider Electric", "Legrand"]
  },
  {
    company_name: "Precision Controls & Instruments",
    company_description: "Specialized distributor of precision electrical instruments and measurement devices",
    business_type: "Partnership Firm",
    contact_email: "sales@precisioncontrols.com",
    contact_phone: "+91 80 5678 9012",
    address: "No. 167, Rajajinagar 5th Block",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560010",
    country: "India",
    website: "https://www.precisioncontrols.com",
    gst_number: "29AABCP2345K1Z4",
    company_pan_number: "AABCP2345K",
    bank_account_number: "78901234567890",
    bank_ifsc_code: "SBIN0007890",
    bank_name: "State Bank of India",
    annual_turnover: "3-5 Crores",
    years_in_business: 10,
    primary_product_categories: ["Measurement Instruments", "Control Systems", "Precision Tools"],
    certifications: ["ISO 9001:2015", "SIEMENS Certified Partner"],
    authorizedBrands: ["SIEMENS", "BCH Electric"]
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting Bangalore sellers generation...');

    let successCount = 0;
    const results = [];

    // Get brand IDs for authorization mapping
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name');

    const brandMap = new Map(brands?.map(b => [b.name, b.id]) || []);

    for (const sellerData of bangaloreSellers) {
      try {
        console.log(`Creating seller: ${sellerData.company_name}`);

        // Create seller onboarding record
        const { data: seller, error: sellerError } = await supabase
          .from('seller_onboarding')
          .insert({
            company_name: sellerData.company_name,
            company_description: sellerData.company_description,
            business_type: sellerData.business_type,
            contact_email: sellerData.contact_email,
            contact_phone: sellerData.contact_phone,
            address: sellerData.address,
            city: sellerData.city,
            state: sellerData.state,
            postal_code: sellerData.postal_code,
            country: sellerData.country,
            website: sellerData.website,
            gst_number: sellerData.gst_number,
            company_pan_number: sellerData.company_pan_number,
            bank_account_number: sellerData.bank_account_number,
            bank_ifsc_code: sellerData.bank_ifsc_code,
            bank_name: sellerData.bank_name,
            annual_turnover: sellerData.annual_turnover,
            years_in_business: sellerData.years_in_business,
            primary_product_categories: sellerData.primary_product_categories,
            certifications: sellerData.certifications,
            status: 'approved'
          })
          .select()
          .single();

        if (sellerError) {
          console.error(`Error creating seller ${sellerData.company_name}:`, sellerError);
          results.push({ seller: sellerData.company_name, status: 'failed', error: sellerError.message });
          continue;
        }

        console.log(`Created seller: ${seller.company_name} with ID: ${seller.id}`);

        // Create brand authorizations
        const authorizations = [];
        for (const brandName of sellerData.authorizedBrands) {
          const brandId = brandMap.get(brandName);
          if (brandId) {
            authorizations.push({
              seller_id: seller.id,
              brand_id: brandId,
              authorization_level: brandName === 'SIEMENS' ? 'Premium Partner' : 
                                 brandName === 'Schneider Electric' ? 'EcoXpert Partner' : 
                                 'Authorized Dealer',
              certificate_number: `${brandName.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
              issued_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'active'
            });
          }
        }

        if (authorizations.length > 0) {
          const { error: authError } = await supabase
            .from('seller_brand_authorizations')
            .insert(authorizations);

          if (authError) {
            console.error(`Error creating authorizations for ${sellerData.company_name}:`, authError);
          } else {
            console.log(`Created ${authorizations.length} brand authorizations for ${sellerData.company_name}`);
          }
        }

        successCount++;
        results.push({ 
          seller: sellerData.company_name, 
          status: 'success', 
          id: seller.id,
          authorizations: authorizations.length 
        });

    } catch (error: unknown) {
        console.error(`Error processing seller ${sellerData.company_name}:`, error);
        results.push({ seller: sellerData.company_name, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    console.log(`Generation complete. Successfully created ${successCount} sellers.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${successCount} Bangalore sellers`,
        sellersCreated: successCount,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('Error in generate-bangalore-sellers function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});