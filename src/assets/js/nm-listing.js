import { listing } from './nm/listing.js';

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', listing, { once: true });
else listing();
