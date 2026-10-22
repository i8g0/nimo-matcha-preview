import { gallery, quantity, value, buybar } from './nm/product-page.js';

const boot = () => { gallery(); quantity(); value(); buybar(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
