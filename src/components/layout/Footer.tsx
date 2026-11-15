import Logo from '@/components/brand/Logo';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container-wide py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo inverted />
            </Link>
            <p className="text-primary-foreground/70 leading-relaxed max-w-xs">
              India's trusted B2B marketplace for industrial electrical equipment and low voltage switchgear products.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'Products' },
                { to: '/categories', label: 'Categories' },
                { to: '/sellers', label: 'Sellers' },
                { to: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* For Business */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For Business</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/register?role=seller', label: 'Become a Seller' },
                { to: '/register?role=buyer', label: 'Join as Buyer' },
                { to: '/faq', label: 'FAQ' },
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact & Newsletter */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-display text-lg font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 text-primary-foreground/50" />
                <span className="text-primary-foreground/70 break-all">info@switchgearshop.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-0.5 text-primary-foreground/50" />
                <span className="text-primary-foreground/70">+91 80 4567 8900</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-primary-foreground/50 shrink-0" />
                <span className="text-primary-foreground/70">Peenya Industrial Area, Bangalore 560058</span>
              </li>
            </ul>
            
            <div>
              <h5 className="font-medium mb-3">Subscribe to Newsletter</h5>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:bg-primary-foreground/20"
                />
                <Button 
                  size="icon"
                  variant="secondary"
                  className="shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-wide py-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} SwitchgearShop. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/terms" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/cookies" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
