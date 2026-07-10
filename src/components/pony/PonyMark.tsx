/**
 * A small, original, generic pony-head silhouette used as the app's
 * brand glyph. Deliberately simple/abstract (no specific character
 * likeness, cutie mark, or third-party design) — just a friendly
 * storybook-pony shape with a flowing mane, in the theme's palette.
 */
export function PonyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 30c-3.5-2-5-6-4-10 1-4.4 4.6-7.7 9-8.4 1-3 4-5.1 7.2-4.6 2.7.4 4.8 2.4 5.5 5 3.6.3 6.6 3 7.2 6.6.6 3.7-1.2 7.2-4.4 8.9v6.2c0 1.8-1.5 3.3-3.3 3.3H18.3c-1.8 0-3.3-1.5-3.3-3.3V30Z"
        fill="currentColor"
      />
      <path
        d="M31 12c2.6 1 4.6 3 5.6 5.6-2.8-.6-5.6-.2-8-1.4.4-1.6 1.3-3 2.4-4.2Z"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="26" cy="21" r="1.6" fill="white" />
    </svg>
  );
}
