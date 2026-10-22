import { cartPage } from './nm/cart-page.js';

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cartPage, { once: true });
else cartPage();
