import { useEffect } from 'react';

interface PageMeta { title?: string; description?: string; canonical?: string; noindex?: boolean; }

const setMeta = (selector: string, create: () => HTMLElement, attr: string, value: string | null) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value == null) { el?.remove(); return; }
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
};

/** Sets document title, description and canonical for client-side navigation; restores the previous values on unmount. */
export function usePageMeta({ title, description, canonical, noindex }: PageMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? null;
    const prevCanon = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

    if (title) document.title = title;
    if (description) setMeta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), 'content', description);
    if (canonical) setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', canonical);
    if (noindex) setMeta('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), 'content', 'noindex');

    return () => {
      document.title = prevTitle;
      if (description && prevDesc != null) setMeta('meta[name="description"]', () => document.createElement('meta'), 'content', prevDesc);
      if (canonical) setMeta('link[rel="canonical"]', () => document.createElement('link'), 'href', prevCanon);
      if (noindex) setMeta('meta[name="robots"]', () => document.createElement('meta'), 'content', null);
    };
  }, [title, description, canonical, noindex]);
}
