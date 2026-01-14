// Scans the document for <button> elements and sets a helpful `title` attribute
// if one is not present. Also observes DOM mutations to handle dynamically
// added buttons (e.g., modals). This provides a quick, global hover tooltip
// experience without changing every button in the codebase.
export function initButtonTooltips() {
  if (typeof document === 'undefined') return;

  const applyToButton = (btn: HTMLButtonElement) => {
    if (!btn) return;
    if (btn.getAttribute('title')) return;
    // Prefer explicit developer hint
    const hint = btn.dataset.tooltip;
    if (hint && hint.trim()) {
      btn.setAttribute('title', hint.trim());
      return;
    }
    // Derive a short action from visible text
    const text = (btn.textContent || '').trim();
    if (text) {
      // Keep it short: prefix with verb if missing
      const short = text.length > 30 ? text.slice(0, 27) + '...' : text;
      // If button text already looks like a verb (one word), use it directly
      const firstWord = short.split(/\s+/)[0];
      const verbish = /^(add|create|buy|sell|equip|unequip|learn|close|edit|remove|delete|use|talk|manage|recruit|shop|blacksmith|save|cancel|reset|toggle|show|hide)/i;
      const title = verbish.test(firstWord) ? `Click to ${short}` : `Click: ${short}`;
      btn.setAttribute('title', title);
      return;
    }
    // Last resort: generic hint
    btn.setAttribute('title', 'Click');
  };

  // Initial pass
  Array.from(document.querySelectorAll('button')).forEach(el => applyToButton(el as HTMLButtonElement));

  // Observe for future buttons (modals, dynamic content)
  try {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (!m.addedNodes) continue;
        m.addedNodes.forEach(n => {
          if (!(n instanceof Element)) return;
          if (n.tagName.toLowerCase() === 'button') applyToButton(n as HTMLButtonElement);
          n.querySelectorAll && n.querySelectorAll('button').forEach(b => applyToButton(b as HTMLButtonElement));
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    // Ignore; MutationObserver may not be available in some test environments
  }
}

export default initButtonTooltips;
