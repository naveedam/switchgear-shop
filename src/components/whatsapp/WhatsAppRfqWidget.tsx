import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const WA_URL =
  'https://wa.me/919986058837?text=Hi%20SwitchgearShop,%20I%20would%20like%20to%20request%20a%20quotation.%0A%0ACompany:%0AContact%20Person:%0ALocation:%0A%0ARequirement:';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.95 2.722.95.91 0 2.7-.665 2.95-1.747.108-.435.108-.825-.014-1.247-.13-.473-1.787-1.084-1.787-1.084zM16 0C7.163 0 0 7.163 0 16c0 2.81.728 5.555 2.107 7.967L.067 31.756a.6.6 0 0 0 .744.744l7.96-2.02A15.9 15.9 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.5a13.4 13.4 0 0 1-6.94-1.918l-.498-.297-4.728 1.2 1.226-4.612-.323-.515A13.4 13.4 0 0 1 2.5 16C2.5 8.557 8.557 2.5 16 2.5S29.5 8.557 29.5 16 23.443 29.5 16 29.5z" />
  </svg>
);

const WhatsAppRfqWidget: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {!dismissed && (
        <div className="w-[320px] max-w-[calc(100vw-48px)] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2 p-4 pb-2">
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">
              Need ABB, Siemens, Schneider or other industrial products?
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="px-4 text-xs text-gray-600 leading-relaxed">
            Send your requirement on WhatsApp. We support RFQs, BOMs, obsolete parts, PLCs, relays, drives, switchgear and control panel components.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="m-4 mt-3 flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm py-2.5 transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Send RFQ
          </a>
        </div>
      )}

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold',
          'shadow-lg shadow-green-600/30 px-5 py-3 transition-all hover:scale-105'
        )}
        aria-label="Get a Quote on WhatsApp"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span>Get a Quote</span>
      </a>
    </div>
  );
};

export default WhatsAppRfqWidget;
