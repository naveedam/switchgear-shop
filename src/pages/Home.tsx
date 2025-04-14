
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Product } from '@/types/product';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight, ShieldCheck, Truck, Clock, Award } from 'lucide-react';
import { Category } from '@/types/category';
import { fetchCategories } from '@/services/categoryService';

// Carousel slides
const slides = [
  {
    id: 1,
    title: 'Premium Switchgear Solutions',
    description: 'Find top-quality low voltage switchgear products from trusted manufacturers.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },
  {
    id: 2,
    title: 'Connect with Trusted Sellers',
    description: 'Discover verified sellers offering industrial-grade switchgear components.',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Find Sellers',
    ctaLink: '/sellers',
  },
  {
    id: 3,
    title: 'Become a Seller',
    description: 'Expand your business by selling your switchgear products on our marketplace.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Register Now',
    ctaLink: '/register',
  },
];

// Mock featured products
const mockVariant = {
  id: '1',
  name: 'Standard',
  sku: 'CB-100',
  price: 599.99,
  stock: 25,
};

const mockFeaturedProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Premium ${i % 2 === 0 ? 'Circuit Breaker' : 'Power Distribution Panel'} ${100 + i}`,
  slug: `product-${i + 1}`,
  description: 'High-quality switchgear product with advanced safety features and reliable performance.',
  shortDescription: 'High-quality switchgear with advanced safety features.',
  featuredImage: `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300`,
  images: [`https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300`],
  categories: [{
    id: '1',
    name: 'Circuit Breakers',
    slug: 'circuit-breakers',
  }],
  specifications: [
    { name: 'Voltage', value: '240V' },
    { name: 'Current Rating', value: '100A' },
  ],
  variants: [{ ...mockVariant, price: 499.99 + i * 100 }],
  sellerId: (i % 3 + 1).toString(),
  sellerName: `ElectroTech Solutions ${i % 3 + 1}`,
  rating: 4 + (i % 10) / 10,
  reviewCount: 10 + i,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'published',
}));

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // In a real app, fetch products from API
    setFeaturedProducts(mockFeaturedProducts);
    
    // Fetch categories from database
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);
  
  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-50" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-start p-8 md:p-16">
                    <div className="max-w-lg text-white">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        {slide.title}
                      </h1>
                      <p className="text-lg md:text-xl mb-6 text-gray-200">
                        {slide.description}
                      </p>
                      <Button asChild size="lg">
                        <Link to={slide.ctaLink}>{slide.ctaText}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>
      
      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Choose SwitchgearNexus?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Verified Suppliers</h3>
                <p className="text-gray-600">
                  All sellers on our platform are thoroughly vetted for quality and reliability.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Fast Shipping</h3>
                <p className="text-gray-600">
                  Efficient logistics network ensures your orders arrive on time, every time.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">24/7 Support</h3>
                <p className="text-gray-600">
                  Our customer service team is available round-the-clock to assist you.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  Every product on our platform meets rigorous industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              Browse Categories
            </h2>
            <Link to="/categories" className="text-brand-600 hover:text-brand-700 flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              // Show loading placeholders
              Array(6).fill(0).map((_, index) => (
                <Card key={`loading-${index}`} className="overflow-hidden h-full animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                </Card>
              ))
            ) : categories.length > 0 ? (
              // Show actual categories
              categories.map(category => (
                <Link 
                  key={category.id} 
                  to={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full card-hover">
                    <div className="aspect-square relative">
                      <img 
                        src={category.imageUrl || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=300&h=200'} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-medium text-center">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              // If no categories found
              <div className="col-span-6 py-12 text-center text-gray-500">
                <p>No categories found.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              Featured Products
            </h2>
            <Link to="/products" className="text-brand-600 hover:text-brand-700 flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-brand-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow Your Switchgear Business?
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8 text-brand-100">
            Join thousands of buyers and sellers on the premier B2B marketplace for low voltage switchgear products.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-brand-700">
              <Link to="/register?role=buyer">Join as Buyer</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-100">
              <Link to="/register?role=seller">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What Our Clients Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg
                        key={j}
                        className={`w-5 h-5 ${j < 4 + (i % 2) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "SwitchgearNexus has transformed how we source industrial components. 
                    Their platform is user-friendly, and the quality of products has consistently exceeded our expectations."
                  </p>
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                        {['JD', 'AR', 'MK'][i]}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {['John Doe', 'Alex Rodriguez', 'Maria Kim'][i]}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {['Procurement Manager', 'Chief Engineer', 'Operations Director'][i]}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
