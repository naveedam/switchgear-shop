
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-industrial-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">SwitchgearShop</h3>
            <p className="text-gray-400 mb-4">
              Your trusted B2B marketplace for low voltage switchgear products.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white">Products</Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-white">Categories</Link>
              </li>
              <li>
                <Link to="/sellers" className="text-gray-400 hover:text-white">Sellers</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">For Business</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/register?role=seller" className="text-gray-400 hover:text-white">Become a Seller</Link>
              </li>
              <li>
                <Link to="/register?role=buyer" className="text-gray-400 hover:text-white">Join as Buyer</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white">FAQ</Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-400 hover:text-white">Support</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal & Contact</h4>
            <ul className="space-y-2 mb-4">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-gray-400" />
                <span className="text-gray-400">info@switchgearshop.com</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-gray-400" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
            </ul>
            <div className="mt-4">
              <h5 className="text-sm font-semibold mb-2">Subscribe to Newsletter</h5>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-industrial-900 text-white px-3 py-2 rounded-l focus:outline-none flex-grow"
                />
                <button className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-r">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} SwitchgearShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
