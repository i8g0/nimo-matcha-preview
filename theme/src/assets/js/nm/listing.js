/** Listing page: sort pills drive Salla's <salla-products-list>. */
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function listing() {
  const list = document.querySelector('[data-nm-products-list]');
  const pills = $$('[data-nm-sort]');
  if (!list || !pills.length) return;
  if (!pills.some((p) => p.classList.contains('is-active'))) pills[0].classList.add('is-active');
  pills.forEach((p) => p.addEventListener('click', () => {
    pills.forEach((x) => { const on = x === p; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); });
    list.setAttribute('sort-by', p.dataset.nmSort);
    list.reload?.();
  }));
}
