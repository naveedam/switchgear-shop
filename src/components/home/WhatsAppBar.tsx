import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppBar: React.FC = () => (
  <section className="container-wide py-8 sm:py-10">
    <div className="rounded-lg border border-border bg-secondary px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-[#25D366] rounded-md flex items-center justify-center shrink-0" aria-hidden="true">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl">Can't find a part?</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send your BOM, an obsolete model number or a bulk requirement on WhatsApp. We reply within 2 working hours.
          </p>
        </div>
      </div>
      <a
        href="https://wa.me/919986058837?text=Hi%2C%20I%20need%20help%20finding%20a%20product%20on%20SwitchgearShop"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#1DA851] text-white rounded-md text-sm font-medium hover:bg-[#178C43] transition-colors w-full sm:w-auto shrink-0"
      >
        <MessageCircle className="h-4 w-4" />
        Message us on WhatsApp
      </a>
    </div>
  </section>
);

export default WhatsAppBar;
