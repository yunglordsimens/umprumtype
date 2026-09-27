import { useState, useEffect } from 'react';

// The nav search box filters the list of the section it's on (typefaces,
// projects, journal, store, library) instead of searching the whole site.
// SearchIsland broadcasts the query; section islands subscribe with
// useSiteSearch().

const EVENT = 'site-search';

export function scopeForPath(pathname) {
  if (!pathname) return null;
  if (pathname.startsWith('/typefaces')) return 'typefaces';
  if (pathname.startsWith('/library'))   return 'library';
  if (pathname.startsWith('/projects'))  return 'projects';
  if (pathname.startsWith('/journal'))   return 'journal';
  if (pathname.startsWith('/store'))     return 'store';
  return null;
}

export function broadcastSiteSearch(query) {
  window.__siteSearchQuery = query;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: query }));
}

export function useSiteSearch() {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (window.__siteSearchQuery) setQuery(window.__siteSearchQuery);
    const onSearch = e => setQuery(e.detail || '');
    window.addEventListener(EVENT, onSearch);
    return () => window.removeEventListener(EVENT, onSearch);
  }, []);
  return query;
}

// True when every word of the query appears in one of the fields.
export function matchesQuery(query, fields) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = fields.filter(Boolean).map(f => String(f).toLowerCase()).join(' ');
  return q.split(/\s+/).every(word => hay.includes(word));
}
