{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // sw.js - Service Worker\
\
const CACHE_NAME = 'workout-tracker-cache-v1.3'; // Increment version to force update\
const urlsToCache = [\
  '/', // Alias for index.html\
  'index.html',\
  // Add other critical assets here if you have them (e.g., specific CSS, JS files not inlined)\
  // For this app, Tailwind is via CDN, so it's subject to browser caching.\
  // Icons will be cached on first load if accessed.\
  'https://cdn.tailwindcss.com', // Cache Tailwind (optional, browser might do it better)\
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' // Cache font (optional)\
];\
\
// Install event: Cache core assets\
self.addEventListener('install', event => \{\
  console.log('Service Worker: Installing...');\
  event.waitUntil(\
    caches.open(CACHE_NAME)\
      .then(cache => \{\
        console.log('Service Worker: Caching app shell');\
        return cache.addAll(urlsToCache);\
      \})\
      .then(() => \{\
        console.log('Service Worker: App shell cached successfully');\
        return self.skipWaiting(); // Activate the new service worker immediately\
      \})\
      .catch(error => \{\
        console.error('Service Worker: Caching failed', error);\
      \})\
  );\
\});\
\
// Activate event: Clean up old caches\
self.addEventListener('activate', event => \{\
  console.log('Service Worker: Activating...');\
  event.waitUntil(\
    caches.keys().then(cacheNames => \{\
      return Promise.all(\
        cacheNames.map(cacheName => \{\
          if (cacheName !== CACHE_NAME) \{\
            console.log('Service Worker: Deleting old cache', cacheName);\
            return caches.delete(cacheName);\
          \}\
        \})\
      );\
    \}).then(() => \{\
        console.log('Service Worker: Old caches deleted.');\
        return self.clients.claim(); // Take control of all open clients\
    \})\
  );\
\});\
\
// Fetch event: Serve cached assets or fetch from network\
self.addEventListener('fetch', event => \{\
  // We only want to cache GET requests.\
  if (event.request.method !== 'GET') \{\
    return;\
  \}\
\
  event.respondWith(\
    caches.match(event.request)\
      .then(response => \{\
        if (response) \{\
          // Serve from cache\
          // console.log('Service Worker: Serving from cache', event.request.url);\
          return response;\
        \}\
        // Not in cache, fetch from network\
        // console.log('Service Worker: Fetching from network', event.request.url);\
        return fetch(event.request).then(\
          networkResponse => \{\
            // If we got a valid response, clone it and cache it.\
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') \{\
              return networkResponse;\
            \}\
            // IMPORTANT: Clone the response. A response is a stream\
            // and because we want the browser to consume the response\
            // as well as the cache consuming the response, we need\
            // to clone it so we have two streams.\
            var responseToCache = networkResponse.clone();\
            caches.open(CACHE_NAME)\
              .then(cache => \{\
                // console.log('Service Worker: Caching new resource', event.request.url);\
                cache.put(event.request, responseToCache);\
              \});\
            return networkResponse;\
          \}\
        ).catch(error => \{\
          console.error('Service Worker: Fetching failed', event.request.url, error);\
          // You could return a custom offline page here if you had one.\
          // For now, just let the browser handle the error (e.g., "No internet" page).\
        \});\
      \})\
  );\
\});\
}