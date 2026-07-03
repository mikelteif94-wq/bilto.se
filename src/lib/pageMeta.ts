export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export function setPageMeta({ title, description, canonical, ogImage }: PageMeta) {
  document.title = title;

  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  if (canonical) {
    setMeta('property', 'og:url', canonical);
    setLink('canonical', canonical);
  }
  if (ogImage) {
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:image', ogImage);
  }
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
}

function setMeta(attrName: string, attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function injectJsonLd(data: object) {
  const existing = document.querySelector('script[data-page-jsonld]');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page-jsonld', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
