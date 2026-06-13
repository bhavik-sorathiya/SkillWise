const maleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="mGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d241b" />
      <stop offset="100%" stop-color="#f27f0d" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#mGrad)" />
  <!-- Body/Suit -->
  <path d="M28 112c0-16 16-24 36-24s36 8 36 24v16H28v-16z" fill="#1c140d" />
  <!-- Shirt Collar -->
  <path d="M50 88l14 16 14-16" fill="none" stroke="#f8f7f5" stroke-width="3.5" stroke-linecap="round" />
  <!-- Tie -->
  <line x1="64" y1="104" x2="64" y2="128" stroke="#f27f0d" stroke-width="4" stroke-linecap="round" />
  <!-- Jacket Lapels -->
  <path d="M42 88l8 22v18" fill="none" stroke="#9c7349" stroke-width="1.5" />
  <path d="M86 88l-8 22v18" fill="none" stroke="#9c7349" stroke-width="1.5" />
  <!-- Neck Shadow -->
  <path d="M54 70h20v18c0 4-20 4-20 0V70z" fill="#e09f67" />
  <!-- Head/Face -->
  <path d="M44 45c0-14 10-20 20-20s20 6 20 20v15c0 8-6 14-20 14s-20-6-20-14V45z" fill="#f6c496" />
  <!-- Hair -->
  <path d="M42 46c0-15 11-19 22-19s22 4 22 15c0 3-1 5-4 5s-5-3-9-3c-6 0-10 4-15 4c-5 0-8-1-10 2c-2 2-3 2-4 2s-2-6-2-6z" fill="#1c140d" />
  <path d="M42 46v8c0 1 1 2 2 2s2-1 2-2v-8z" fill="#1c140d" />
  <path d="M84 46v8c0 1-1 2-2 2s-2-1-2-2v-8z" fill="#1c140d" />
  <!-- Ears -->
  <circle cx="41" cy="56" r="4.5" fill="#f6c496" />
  <circle cx="87" cy="56" r="4.5" fill="#f6c496" />
  <!-- Glasses -->
  <rect x="46" y="52" width="14" height="10" rx="2" fill="none" stroke="#2d241b" stroke-width="2.2" />
  <rect x="68" y="52" width="14" height="10" rx="2" fill="none" stroke="#2d241b" stroke-width="2.2" />
  <line x1="60" y1="56" x2="68" y2="56" stroke="#2d241b" stroke-width="2.2" />
  <path d="M42 55h4m40 0h-4" stroke="#2d241b" stroke-width="2.2" stroke-linecap="round" />
  <!-- Headset -->
  <rect x="35" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <rect x="87" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <path d="M38 48C38 20 90 20 90 48" fill="none" stroke="#2d241b" stroke-width="3.5" stroke-linecap="round" />
  <path d="M38 58l10 10" fill="none" stroke="#2d241b" stroke-width="2" stroke-linecap="round" />
  <circle cx="48" cy="68" r="2.5" fill="#f27f0d" />
</svg>`;

const femaleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="fGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d241b" />
      <stop offset="100%" stop-color="#f27f0d" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#fGrad)" />
  <!-- Hair Bun (behind) -->
  <circle cx="64" cy="22" r="13" fill="#1c140d" />
  <!-- Body/Blazer -->
  <path d="M28 112c0-16 16-24 36-24s36 8 36 24v16H28v-16z" fill="#4a3b30" />
  <!-- Blouse Opening -->
  <path d="M52 88l12 18 12-18z" fill="#f8f7f5" />
  <!-- Blazer Lapels -->
  <path d="M46 88l18 20 18-20" fill="none" stroke="#f27f0d" stroke-width="3.5" stroke-linejoin="round" />
  <line x1="64" y1="108" x2="64" y2="128" stroke="#f27f0d" stroke-width="2" />
  <!-- Neck Shadow -->
  <path d="M54 70h20v18c0 4-20 4-20 0V70z" fill="#e2a173" />
  <!-- Head/Face -->
  <path d="M44 45c0-14 10-20 20-20s20 6 20 20v15c0 8-6 14-20 14s-20-6-20-14V45z" fill="#f8c8a0" />
  <!-- Hair Front Bangs & Side Strands -->
  <path d="M41 44c0-14 10-18 23-18s23 4 23 18c-4-6-10-8-23-8s-19 2-23 8z" fill="#1c140d" />
  <path d="M43 44c-1 10 2 18 2 24" fill="none" stroke="#1c140d" stroke-width="3.5" stroke-linecap="round" />
  <path d="M85 44c1 10-2 18-2 24" fill="none" stroke="#1c140d" stroke-width="3.5" stroke-linecap="round" />
  <!-- Ears -->
  <circle cx="41" cy="56" r="4" fill="#f8c8a0" />
  <circle cx="87" cy="56" r="4" fill="#f8c8a0" />
  <!-- Glasses -->
  <circle cx="53" cy="57" r="7" fill="none" stroke="#2d241b" stroke-width="2.2" />
  <circle cx="75" cy="57" r="7" fill="none" stroke="#2d241b" stroke-width="2.2" />
  <line x1="60" y1="57" x2="68" y2="57" stroke="#2d241b" stroke-width="2.2" />
  <path d="M42 56c2 0 4-1 4-1m40 0c-2 0-4-1-4-1" stroke="#2d241b" stroke-width="2.2" />
  <!-- Headset -->
  <rect x="35" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <rect x="87" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <path d="M38 48C38 20 90 20 90 48" fill="none" stroke="#2d241b" stroke-width="3.5" stroke-linecap="round" />
  <path d="M38 58l10 10" fill="none" stroke="#2d241b" stroke-width="2" stroke-linecap="round" />
  <circle cx="48" cy="68" r="2.5" fill="#f27f0d" />
</svg>`;

const nonBinarySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="nbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d241b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#nbGrad)" />
  <!-- Body/Hoodie -->
  <path d="M28 112c0-16 16-24 36-24s36 8 36 24v16H28v-16z" fill="#2d241b" />
  <path d="M46 88c8 4 12 16 12 24h12c0-8 4-20 12-24" fill="none" stroke="#9c7349" stroke-width="2" stroke-linecap="round" />
  <line x1="64" y1="102" x2="64" y2="128" stroke="#f27f0d" stroke-width="3.5" stroke-linecap="round" />
  <!-- Neck Shadow -->
  <path d="M54 70h20v18c0 4-20 4-20 0V70z" fill="#de9f6b" />
  <!-- Head/Face -->
  <path d="M44 45c0-14 10-20 20-20s20 6 20 20v15c0 8-6 14-20 14s-20-6-20-14V45z" fill="#f5ba8a" />
  <!-- Hair (Asymmetrical) -->
  <path d="M41 45c0-15 15-22 26-22c12 0 22 5 22 15c0 5-5 5-8 8c-5 4-5 12-8 16c-2 3-5 5-8 5c-10 0-24-7-24-22z" fill="#1c140d" />
  <path d="M81 48c0 5-1 8-2 8s-2-3-2-8z" fill="#1c140d" opacity="0.35" />
  <!-- Ears -->
  <circle cx="41" cy="56" r="4" fill="#f5ba8a" />
  <circle cx="87" cy="56" r="4" fill="#f5ba8a" />
  <!-- Glasses (Hexagonal) -->
  <path d="M46 53h11l3 4-3 4H46l-3-4z" fill="none" stroke="#2d241b" stroke-width="2" />
  <path d="M68 53h11l3 4-3 4H68l-3-4z" fill="none" stroke="#2d241b" stroke-width="2" />
  <line x1="60" y1="57" x2="65" y2="57" stroke="#2d241b" stroke-width="2" />
  <path d="M42 57h1m43 0h-1" stroke="#2d241b" stroke-width="2" />
  <!-- Headset -->
  <rect x="35" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <rect x="87" y="48" width="6" height="16" rx="3" fill="#f27f0d" />
  <path d="M38 48C38 20 90 20 90 48" fill="none" stroke="#2d241b" stroke-width="3.5" stroke-linecap="round" />
  <path d="M38 58l10 10" fill="none" stroke="#2d241b" stroke-width="2" stroke-linecap="round" />
  <circle cx="48" cy="68" r="2.5" fill="#f27f0d" />
</svg>`;

const preferNotToSaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="defGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d241b" />
      <stop offset="100%" stop-color="#9c7349" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#defGrad)" />
  <!-- Dotted Outer Ring -->
  <circle cx="64" cy="64" r="54" fill="none" stroke="#f27f0d" stroke-width="1.8" stroke-dasharray="4,6" opacity="0.75" />
  <!-- Cyber Slash behind -->
  <line x1="68" y1="36" x2="60" y2="92" stroke="#f27f0d" stroke-width="2" opacity="0.25" stroke-linecap="round" />
  <!-- User Silhouette -->
  <circle cx="64" cy="46" r="14" fill="#f8f7f5" opacity="0.95" />
  <path d="M36 102c0-20 12-28 28-28s28 8 28 28z" fill="#f8f7f5" opacity="0.95" />
  <!-- Glowing Code Brackets -->
  <path d="M25 50L12 64l13 14" fill="none" stroke="#f27f0d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M103 50l13 14-13 14" fill="none" stroke="#f27f0d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

/**
 * Helper to get a gender-specific avatar URL.
 * @param {string} gender - The user's gender ('male', 'female', 'non_binary', 'prefer_not_to_say')
 * @returns {string} The avatar image URL (Data URI)
 */
export const getUserAvatar = (gender) => {
  let svg;
  switch (gender?.toLowerCase()) {
    case 'male':
      svg = maleSvg;
      break;
    case 'female':
      svg = femaleSvg;
      break;
    case 'non_binary':
      svg = nonBinarySvg;
      break;
    case 'prefer_not_to_say':
    default:
      svg = preferNotToSaySvg;
      break;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

