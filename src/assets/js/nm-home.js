import { hero, shop, flavors, bundle } from './nm/sections.js';

const boot = () => { hero(); shop(); flavors(); bundle(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
