import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppBar: React.FC = () => (
  <section className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl mx-6 my-6 max-w-6xl lg:mx-auto px-5 py-4 flex items-center gap-4">
    <div className="w-9 h-9 bg-[#25D366] rounded-lg flex items-center justify-center shrink-0">
      <MessageCircle className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">Can't find what you need? Send your requirement on WhatsApp.</p>
      <p className="text-xs text-muted-foreground mt-0.5">BOMs, obsolete parts, bulk quantities — we respond within 2 hours.</p>
    </div>
    <a
      href="https://wa.me/919999999999?text=Hi%2C%20I%20need%20help%20finding%20a%20product%20on%20SwitchgearShop"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-md text-xs font-medium hover:bg-[#20b858] transition-colors"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Send requirement
    </a>
  </section>
);

export default WhatsAppBar;
