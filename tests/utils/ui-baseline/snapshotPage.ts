// Extracts a structured snapshot of visible UI elements from a page.
import { Page } from '@playwright/test';

export interface UIElement {
  tag: string;
  role?: string;
  text?: string;
  name?: string;
  placeholder?: string;
  type?: string;
}

export interface PageSnapshot {
  url: string;
  elements: UIElement[];
}

/** Snapshot visible headings, buttons, tabs, links, and form inputs on the current page. */
export async function snapshotPage(page: Page, scope?: string): Promise<PageSnapshot> {
  const url = new URL(page.url()).pathname;

  const elements = await page.evaluate((scopeSelector) => {
    const root = scopeSelector ? document.querySelector(scopeSelector) : document.body;
    if (!root) return [];

    const results: any[] = [];
    const seen = new Set<string>();

    function isVisible(el: Element): boolean {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    // Skip elements that render inconsistently between page loads
    function isDynamic(el: Element): boolean {
      return !!el.closest('.ant-pagination, .ant-table-pagination, .ant-table-filter-dropdown, .ant-layout-sider, .ant-menu');
    }

    function addElement(el: Element, tag: string, info: Record<string, string | undefined>) {
      const text = info.text?.trim().substring(0, 100);
      const key = `${tag}|${info.role || ''}|${text || ''}|${info.name || ''}|${info.placeholder || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({ tag, ...info, text });
    }

    // Headings
    root.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      addElement(el, el.tagName.toLowerCase(), {
        role: 'heading',
        text: el.textContent || undefined,
      });
    });

    // Buttons
    root.querySelectorAll('button, [role="button"]').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      addElement(el, 'button', {
        role: 'button',
        text: el.textContent || undefined,
        name: el.getAttribute('aria-label') || undefined,
      });
    });

    // Tabs
    root.querySelectorAll('[role="tab"]').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      addElement(el, 'tab', {
        role: 'tab',
        text: el.textContent || undefined,
      });
    });

    // Links
    root.querySelectorAll('a[href]').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      const href = el.getAttribute('href') || '';
      // Skip fragment-only links
      if (href === '#' || href.startsWith('javascript:')) return;
      addElement(el, 'a', {
        text: el.textContent || undefined,
        name: el.getAttribute('aria-label') || undefined,
      });
    });

    // Form inputs
    root.querySelectorAll('input, textarea, select').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      const input = el as HTMLInputElement;
      // Skip hidden inputs
      if (input.type === 'hidden') return;
      addElement(el, input.tagName.toLowerCase(), {
        type: input.type || undefined,
        placeholder: input.placeholder || undefined,
        name: el.getAttribute('aria-label') || undefined,
      });
    });

    // Ant Design selects (rendered as divs, not native selects)
    root.querySelectorAll('.ant-select:not(.ant-select-hidden)').forEach(el => {
      if (!isVisible(el) || isDynamic(el)) return;
      // Find the label from the parent form-item
      const formItem = el.closest('.ant-form-item');
      const label = formItem?.querySelector('.ant-form-item-label')?.textContent?.trim();
      addElement(el, 'ant-select', {
        role: 'combobox',
        text: label || undefined,
      });
    });

    return results;
  }, scope || null);

  return { url, elements: elements as UIElement[] };
}
