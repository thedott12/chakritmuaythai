'use strict';

const thai = document.documentElement.lang === 'th';
const menu = document.querySelector('[data-site-menu]');
const menuButton = document.querySelector('[data-menu-toggle]');
const language = document.querySelector('[data-language]');
const desktop = window.matchMedia('(min-width: 85rem)');
const nativePopover = typeof menu.showPopover === 'function';

function typeHeroTitle() {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  if (!motion.matches || !window.CSS?.highlights || !window.Intl?.Segmenter ||
      matchMedia('(forced-colors: active)').matches) return;

  const title = document.querySelector('.hero__title');
  const badge = title.querySelector('.hero__highlight');
  const segmenter = new Intl.Segmenter(document.documentElement.lang, { granularity: 'grapheme' });
  const letters = [];
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.data.trim()) continue;
    for (const { index, segment } of segmenter.segment(node.data)) {
      letters.push({ node, end: index + segment.length });
    }
  }
  if (!letters.length) return;

  // Mask only the untyped text. The original heading keeps its shaping, layout and accessible name.
  const pending = document.createRange();
  pending.selectNodeContents(title);
  CSS.highlights.set('hero-untyped', new Highlight(pending));
  badge.classList.add('awaiting-type');
  const badgeStart = letters.findIndex(letter => badge.contains(letter.node));
  const letterInterval = 56;
  const start = performance.now();

  function reveal() {
    const index = Math.floor((performance.now() - start) / letterInterval);
    if (!motion.matches || index >= letters.length - 1) {
      CSS.highlights.delete('hero-untyped');
      badge.classList.remove('awaiting-type');
      return;
    }
    const { node, end } = letters[index];
    pending.setStart(node, end);
    if (index >= badgeStart) badge.classList.remove('awaiting-type');
    setTimeout(reveal, letterInterval);
  }
  reveal();
}

typeHeroTitle();

function closeMenu() {
  if (nativePopover && menu.hasAttribute('popover')) {
    menu.hidePopover();
  } else {
    menu.removeAttribute('data-menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  language.open = false;
}

function syncMenuLayout() {
  closeMenu();
  if (desktop.matches) {
    menu.removeAttribute('popover');
  } else {
    menu.setAttribute('popover', 'auto');
  }
}

syncMenuLayout();
desktop.addEventListener('change', syncMenuLayout);
if (nativePopover) {
  menu.addEventListener('toggle', event => {
    menuButton.setAttribute('aria-expanded', String(event.newState === 'open'));
    if (event.newState === 'closed') language.open = false;
  });
} else {
  menuButton.addEventListener('click', () => {
    const open = menu.toggleAttribute('data-menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  menu.querySelector('[data-menu-close]').addEventListener('click', () => {
    closeMenu();
    menuButton.focus();
  });
}

document.addEventListener('click', event => {
  if (!language.contains(event.target)) language.open = false;
  if (!nativePopover && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (language.open) {
    event.preventDefault();
    language.open = false;
    language.querySelector('summary').focus();
  } else if (!nativePopover && menu.hasAttribute('data-menu-open')) {
    closeMenu();
    menuButton.focus();
  }
});
menu.addEventListener('click', event => {
  if (event.target.closest('a') && !desktop.matches) closeMenu();
});

// The live Wix form belongs to the school's hosted site. Static hosting also
// supports an addressed email draft, without claiming a message was delivered.
const enquiry = document.querySelector('[data-contact-form]');
enquiry.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(enquiry);
  const fields = ['name', 'email', 'message'].map(name => {
    const value = String(data.get(name) || '').trim();
    const field = enquiry.elements.namedItem(name);
    return value && field.placeholder + ': ' + value;
  }).filter(Boolean);
  const subject = String(data.get('subject') || '').replace(/[\r\n]+/g, ' ').trim();
  const draft = enquiry.getAttribute('action') + '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(fields.join('\r\n\r\n'));
  const status = enquiry.querySelector('[data-form-status]');
  const webForm = document.createElement('a');
  webForm.href = 'https://www.chakritmuaythai.com/' + (thai ? 'th/' : '') + 'contact#comp-jy6w10yy';
  webForm.textContent = thai ? 'ใช้แบบฟอร์มออนไลน์ของโรงเรียน' : 'Use the school’s online form';
  status.replaceChildren(thai ? 'ส่งอีเมลจากแอปอีเมลของคุณ หรือ ' : 'Send the draft in your email app, or ', webForm, '.');
  window.location.href = draft;
});

const mapLink = document.querySelector('[data-location]');
if (mapLink && typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function') {
  mapLink.addEventListener('click', event => {
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    const dialog = document.createElement('dialog');
    dialog.className = 'location-dialog';
    dialog.setAttribute('aria-label', mapLink.getAttribute('aria-label'));
    const bar = document.createElement('div');
    bar.className = 'location-dialog__bar';
    const directions = document.createElement('a');
    directions.href = 'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent('15 Soi Sukhumvit 39, Khwaeng Khlong Tan Nuea, Watthana, Krung Thep Maha Nakhon 10110, Thailand');
    directions.textContent = thai ? 'เส้นทาง' : 'Directions';
    const close = document.createElement('button');
    close.type = 'button';
    close.autofocus = true;
    close.setAttribute('aria-label', thai ? 'ปิดแผนที่' : 'Close map');
    close.textContent = '×';
    const frame = document.createElement('iframe');
    frame.title = mapLink.getAttribute('aria-label');
    frame.src = 'https://maps.google.com/maps?q=Chakrit%20Muay%20Thai%20School%2C%20Sukhumvit%2039%2C%20Bangkok&z=16&hl=' +
      (thai ? 'th' : 'en') + '&output=embed';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    bar.append(directions, close);
    dialog.append(bar, frame);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  });
}
