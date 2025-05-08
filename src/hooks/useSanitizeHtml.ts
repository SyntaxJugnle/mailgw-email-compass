
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

export const useSanitizeHtml = (html: string | undefined) => {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    if (html) {
      // Configure DOMPurify
      const purifyOptions = {
        ALLOWED_TAGS: [
          'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'i', 'li', 'ol', 'p', 'small', 'span', 'strong', 'table', 'tbody',
          'td', 'th', 'thead', 'tr', 'u', 'ul', 'img', 'blockquote', 'hr',
          'pre', 'code'
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'style', 'src', 'alt', 'width', 'height',
          'class', 'title'
        ],
        ALLOW_DATA_ATTR: false,
        USE_PROFILES: { html: true }
      };

      // Sanitize HTML
      const clean = DOMPurify.sanitize(html, purifyOptions);
      
      // Wrap images in links if they aren't already
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, 'text/html');
      
      const images = doc.querySelectorAll('img');
      images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !img.parentElement?.closest('a')) {
          const link = document.createElement('a');
          link.href = src;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          img.parentNode?.insertBefore(link, img);
          link.appendChild(img);
        }
      });
      
      // Add target="_blank" and rel="noopener noreferrer" to all links
      const links = doc.querySelectorAll('a');
      links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });
      
      // Get the sanitized HTML with our modifications
      const modifiedHtml = doc.body.innerHTML;
      setSanitizedHtml(modifiedHtml);
    } else {
      setSanitizedHtml("");
    }
  }, [html]);

  return sanitizedHtml;
};
