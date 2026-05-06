// Full-body avatar system with selectable attributes

export interface AvatarSpec {
  background: string;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeType: string;
  eyeColor: string;
  mouthType: string;
  shirtStyle: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  accessory: string;
}

export const BACKGROUND_OPTIONS = [
  '#1a3a5c','#2c5f2e','#6b2737','#4a1f6e','#1d4a3a',
  '#5c3a1a','#1a4a5c','#3a1a5c','#5c1a3a','#2a2a3a',
];
export const SKIN_OPTIONS = [
  '#FDDBB4','#F5C592','#E8A96A','#D4884A',
  '#B5712A','#8B4D20','#6B3416','#4A2110',
];
export const HAIR_COLORS = [
  '#1a1a1a','#3d2514','#7a4a1e','#a07040',
  '#d4a032','#f0d060','#602060','#c08070',
];
export const HAIR_STYLES = [
  'bald','short','medium','long','curly','bun','afro','braids',
] as const;
export const EYE_TYPES = [
  'dot','round','sleepy','almond','wide','wink',
] as const;
export const EYE_COLORS = [
  '#1a1a1a','#3b2007','#3b6fa0','#2d6b3b','#8b6914','#994040',
];
export const MOUTH_TYPES = [
  'smile','grin','flat','pout','tongue',
] as const;
export const SHIRT_STYLES = [
  'tshirt','hoodie','tank','suit','polo','dress',
] as const;
export const SHIRT_COLORS = [
  '#2563eb','#dc2626','#16a34a','#9333ea',
  '#ea580c','#0891b2','#374151','#f59e0b',
];
export const PANTS_COLORS = [
  '#1e3a5f','#374151','#1c3a1c','#3a1a1a',
  '#2a1a4a','#4a3a20','#1a3a4a','#4a4a4a',
];
export const SHOE_COLORS = [
  '#1a1a1a','#ffffff','#8B4513','#dc2626','#2563eb','#16a34a',
];
export const ACCESSORIES = [
  'none','glasses','sunglasses','hat','earring','headband',
] as const;

// Attribute metadata for the editor UI
export const AVATAR_ATTRIBUTES = [
  { key: 'background' as const, label: 'Background', type: 'color', options: BACKGROUND_OPTIONS },
  { key: 'skinColor' as const, label: 'Skin', type: 'color', options: SKIN_OPTIONS },
  { key: 'hairStyle' as const, label: 'Hair Style', type: 'label', options: HAIR_STYLES as unknown as string[] },
  { key: 'hairColor' as const, label: 'Hair Color', type: 'color', options: HAIR_COLORS },
  { key: 'eyeType' as const, label: 'Eyes', type: 'label', options: EYE_TYPES as unknown as string[] },
  { key: 'eyeColor' as const, label: 'Eye Color', type: 'color', options: EYE_COLORS },
  { key: 'mouthType' as const, label: 'Mouth', type: 'label', options: MOUTH_TYPES as unknown as string[] },
  { key: 'shirtStyle' as const, label: 'Shirt Style', type: 'label', options: SHIRT_STYLES as unknown as string[] },
  { key: 'shirtColor' as const, label: 'Shirt Color', type: 'color', options: SHIRT_COLORS },
  { key: 'pantsColor' as const, label: 'Pants Color', type: 'color', options: PANTS_COLORS },
  { key: 'shoeColor' as const, label: 'Shoe Color', type: 'color', options: SHOE_COLORS },
  { key: 'accessory' as const, label: 'Accessory', type: 'label', options: ACCESSORIES as unknown as string[] },
] as const;

export function defaultAvatarSpec(seed = 0): AvatarSpec {
  return {
    background: BACKGROUND_OPTIONS[seed % BACKGROUND_OPTIONS.length],
    skinColor: SKIN_OPTIONS[Math.floor(seed / 2) % SKIN_OPTIONS.length],
    hairStyle: HAIR_STYLES[Math.floor(seed / 3) % HAIR_STYLES.length],
    hairColor: HAIR_COLORS[Math.floor(seed / 5) % HAIR_COLORS.length],
    eyeType: EYE_TYPES[Math.floor(seed / 7) % EYE_TYPES.length],
    eyeColor: EYE_COLORS[Math.floor(seed / 9) % EYE_COLORS.length],
    mouthType: MOUTH_TYPES[Math.floor(seed / 11) % MOUTH_TYPES.length],
    shirtStyle: SHIRT_STYLES[Math.floor(seed / 13) % SHIRT_STYLES.length],
    shirtColor: SHIRT_COLORS[Math.floor(seed / 17) % SHIRT_COLORS.length],
    pantsColor: PANTS_COLORS[Math.floor(seed / 19) % PANTS_COLORS.length],
    shoeColor: SHOE_COLORS[Math.floor(seed / 23) % SHOE_COLORS.length],
    accessory: ACCESSORIES[Math.floor(seed / 29) % ACCESSORIES.length],
  };
}

// SVG generation — 200x320 viewBox, standing full-body cartoon
// Head center: (100, 82), r=44. Bottom: y=126. Top: y=38.

function hairBack(style: string, color: string): string {
  switch (style) {
    case 'bald': return '';
    case 'short':
      return `<ellipse cx="100" cy="71" rx="48" ry="36" fill="${color}"/>`;
    case 'medium':
      return `<ellipse cx="100" cy="66" rx="50" ry="40" fill="${color}"/>`;
    case 'long':
      return `<ellipse cx="100" cy="66" rx="50" ry="40" fill="${color}"/>`;
    case 'curly':
      return `<circle cx="70" cy="64" r="20" fill="${color}"/>
        <circle cx="100" cy="54" r="22" fill="${color}"/>
        <circle cx="130" cy="64" r="20" fill="${color}"/>
        <circle cx="58" cy="82" r="18" fill="${color}"/>
        <circle cx="142" cy="82" r="18" fill="${color}"/>`;
    case 'bun':
      return `<ellipse cx="100" cy="71" rx="48" ry="30" fill="${color}"/>
        <circle cx="100" cy="42" r="16" fill="${color}"/>`;
    case 'afro':
      return `<circle cx="100" cy="76" r="66" fill="${color}"/>`;
    case 'braids':
      return `<ellipse cx="100" cy="71" rx="48" ry="36" fill="${color}"/>`;
    default:
      return `<ellipse cx="100" cy="71" rx="48" ry="36" fill="${color}"/>`;
  }
}

function hairFront(style: string, color: string): string {
  switch (style) {
    case 'long':
      return `<rect x="45" y="116" width="16" height="100" rx="8" fill="${color}"/>
        <rect x="139" y="116" width="16" height="100" rx="8" fill="${color}"/>`;
    case 'braids':
      return `<path d="M 67 126 Q 54 160 62 184 Q 70 208 58 228" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M 133 126 Q 146 160 138 184 Q 130 208 142 228" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

function eyesSvg(type: string, color: string): string {
  const lx = 82, rx = 118, ey = 84;
  switch (type) {
    case 'sleepy':
      return `<path d="M${lx-8} ${ey} q8 6 16 0" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M${rx-8} ${ey} q8 6 16 0" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'dot':
      return `<circle cx="${lx}" cy="${ey}" r="3.5" fill="${color}"/>
        <circle cx="${rx}" cy="${ey}" r="3.5" fill="${color}"/>`;
    case 'wide':
      return `<ellipse cx="${lx}" cy="${ey}" rx="9" ry="10" fill="white"/>
        <circle cx="${lx}" cy="${ey}" r="5" fill="${color}"/>
        <circle cx="${lx+2}" cy="${ey-2}" r="1.5" fill="white"/>
        <ellipse cx="${rx}" cy="${ey}" rx="9" ry="10" fill="white"/>
        <circle cx="${rx}" cy="${ey}" r="5" fill="${color}"/>
        <circle cx="${rx+2}" cy="${ey-2}" r="1.5" fill="white"/>`;
    case 'almond':
      return `<path d="M${lx-9} ${ey} q9 -8 18 0 q-9 8 -18 0z" fill="white"/>
        <circle cx="${lx}" cy="${ey}" r="4" fill="${color}"/>
        <path d="M${rx-9} ${ey} q9 -8 18 0 q-9 8 -18 0z" fill="white"/>
        <circle cx="${rx}" cy="${ey}" r="4" fill="${color}"/>`;
    case 'wink':
      return `<circle cx="${lx}" cy="${ey}" r="7" fill="white"/>
        <circle cx="${lx}" cy="${ey}" r="4" fill="${color}"/>
        <circle cx="${lx+2}" cy="${ey-2}" r="1.5" fill="white"/>
        <path d="M${rx-7} ${ey} q7 5 14 0" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    default: // round
      return `<circle cx="${lx}" cy="${ey}" r="7" fill="white"/>
        <circle cx="${lx}" cy="${ey}" r="4" fill="${color}"/>
        <circle cx="${lx+2}" cy="${ey-2}" r="1.5" fill="white"/>
        <circle cx="${rx}" cy="${ey}" r="7" fill="white"/>
        <circle cx="${rx}" cy="${ey}" r="4" fill="${color}"/>
        <circle cx="${rx+2}" cy="${ey-2}" r="1.5" fill="white"/>`;
  }
}

function noseSvg(): string {
  const darker = '#00000022';
  return `<ellipse cx="94" cy="100" rx="4" ry="3" fill="${darker}"/>
    <ellipse cx="106" cy="100" rx="4" ry="3" fill="${darker}"/>
    <path d="M 96 95 Q 100 108 104 95" stroke="${darker}" stroke-width="2" fill="none"/>`;
}

function mouthSvg(type: string): string {
  switch (type) {
    case 'grin':
      return `<path d="M 84 113 q 16 14 32 0" stroke="#6b2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 84 113 q 16 8 32 0" stroke="#fff" stroke-width="5" fill="none"/>`;
    case 'flat':
      return `<line x1="87" y1="114" x2="113" y2="114" stroke="#6b2a2a" stroke-width="3" stroke-linecap="round"/>`;
    case 'pout':
      return `<path d="M 88 110 q 6 8 24 0" stroke="#6b2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'tongue':
      return `<path d="M 85 112 q 15 12 30 0" stroke="#6b2a2a" stroke-width="3" fill="white" stroke-linecap="round"/>
        <ellipse cx="100" cy="120" rx="8" ry="7" fill="#e86474"/>`;
    default: // smile
      return `<path d="M 86 112 q 14 12 28 0" stroke="#6b2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

function shirtBodySvg(style: string, shirtColor: string, skinColor: string): string {
  const baseBody = `<rect x="60" y="148" width="80" height="82" rx="10" fill="${shirtColor}"/>`;
  switch (style) {
    case 'hoodie':
      return `${baseBody}
        <rect x="60" y="148" width="80" height="20" rx="10" fill="color-mix(in oklab, ${shirtColor} 70%, #000)"/>
        <path d="M 80 148 Q 100 168 120 148" fill="${shirtColor}"/>`;
    case 'tank':
      return `<rect x="66" y="148" width="68" height="82" rx="8" fill="${shirtColor}"/>`;
    case 'suit':
      return `${baseBody}
        <path d="M 84 148 L 76 200 L 100 190 L 124 200 L 116 148" fill="color-mix(in oklab, ${shirtColor} 60%, #000)"/>
        <path d="M 100 155 L 100 195" stroke="white" stroke-width="2"/>`;
    case 'polo':
      return `${baseBody}
        <path d="M 86 148 Q 100 166 114 148" fill="${skinColor}"/>
        <path d="M 100 148 L 100 170" stroke="${shirtColor}" stroke-width="6"/>`;
    case 'dress':
      return `<rect x="60" y="148" width="80" height="82" rx="10" fill="${shirtColor}"/>
        <path d="M 60 220 Q 40 260 40 290 L 160 290 Q 160 260 140 220 Z" fill="${shirtColor}"/>`;
    default: // tshirt
      return baseBody;
  }
}

function armsSvg(style: string, shirtColor: string, skinColor: string): string {
  if (style === 'dress') {
    return `<rect x="26" y="152" width="36" height="62" rx="14" fill="${shirtColor}"/>
      <circle cx="44" cy="220" r="13" fill="${skinColor}"/>
      <rect x="138" y="152" width="36" height="62" rx="14" fill="${shirtColor}"/>
      <circle cx="156" cy="220" r="13" fill="${skinColor}"/>`;
  }
  if (style === 'tank') {
    return `<rect x="32" y="152" width="30" height="62" rx="12" fill="${skinColor}"/>
      <circle cx="47" cy="220" r="13" fill="${skinColor}"/>
      <rect x="138" y="152" width="30" height="62" rx="12" fill="${skinColor}"/>
      <circle cx="153" cy="220" r="13" fill="${skinColor}"/>`;
  }
  return `<rect x="26" y="152" width="36" height="64" rx="14" fill="${shirtColor}"/>
    <circle cx="44" cy="222" r="13" fill="${skinColor}"/>
    <rect x="138" y="152" width="36" height="64" rx="14" fill="${shirtColor}"/>
    <circle cx="156" cy="222" r="13" fill="${skinColor}"/>`;
}

function legsSvg(style: string, pantsColor: string, shoeColor: string): string {
  if (style === 'dress') {
    return `<rect x="58" y="293" width="36" height="14" rx="7" fill="${shoeColor}"/>
      <rect x="106" y="293" width="36" height="14" rx="7" fill="${shoeColor}"/>`;
  }
  return `<rect x="62" y="228" width="34" height="68" rx="8" fill="${pantsColor}"/>
    <rect x="104" y="228" width="34" height="68" rx="8" fill="${pantsColor}"/>
    <rect x="56" y="291" width="44" height="16" rx="8" fill="${shoeColor}"/>
    <rect x="100" y="291" width="44" height="16" rx="8" fill="${shoeColor}"/>`;
}

function accessorySvg(acc: string): string {
  switch (acc) {
    case 'glasses':
      return `<rect x="72" y="76" width="24" height="18" rx="6" fill="none" stroke="#222" stroke-width="3"/>
        <rect x="104" y="76" width="24" height="18" rx="6" fill="none" stroke="#222" stroke-width="3"/>
        <line x1="96" y1="85" x2="104" y2="85" stroke="#222" stroke-width="2.5"/>
        <line x1="56" y1="83" x2="72" y2="84" stroke="#222" stroke-width="2"/>
        <line x1="128" y1="84" x2="144" y2="83" stroke="#222" stroke-width="2"/>`;
    case 'sunglasses':
      return `<rect x="70" y="77" width="26" height="17" rx="5" fill="#1a1a1a" opacity="0.9"/>
        <rect x="104" y="77" width="26" height="17" rx="5" fill="#1a1a1a" opacity="0.9"/>
        <line x1="96" y1="85" x2="104" y2="85" stroke="#333" stroke-width="2.5"/>
        <line x1="56" y1="83" x2="70" y2="84" stroke="#333" stroke-width="2"/>
        <line x1="130" y1="84" x2="144" y2="83" stroke="#333" stroke-width="2"/>`;
    case 'hat':
      return `<ellipse cx="100" cy="44" rx="54" ry="10" fill="#333"/>
        <rect x="56" y="16" width="88" height="30" rx="8" fill="#444"/>`;
    case 'earring':
      return `<circle cx="57" cy="96" r="5" fill="#f2d53c"/>
        <circle cx="57" cy="96" r="3" fill="none" stroke="#f2d53c" stroke-width="1.5"/>
        <circle cx="143" cy="96" r="5" fill="#f2d53c"/>
        <circle cx="143" cy="96" r="3" fill="none" stroke="#f2d53c" stroke-width="1.5"/>`;
    case 'headband':
      return `<path d="M 58 70 Q 100 58 142 70" stroke="#e86474" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

export function avatarToSvg(spec: AvatarSpec): string {
  const { background, skinColor, hairStyle, hairColor, eyeType, eyeColor,
    mouthType, shirtStyle, shirtColor, pantsColor, shoeColor, accessory } = spec;
  const isDress = shirtStyle === 'dress';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${isDress ? 320 : 320}" width="200" height="320">
  <rect width="200" height="320" rx="20" fill="${background}"/>
  ${isDress ? '' : legsSvg(shirtStyle, pantsColor, shoeColor)}
  ${isDress ? legsSvg(shirtStyle, pantsColor, shoeColor) : ''}
  ${shirtBodySvg(shirtStyle, shirtColor, skinColor)}
  ${armsSvg(shirtStyle, shirtColor, skinColor)}
  ${hairBack(hairStyle, hairColor)}
  <rect x="88" y="122" width="24" height="30" rx="6" fill="${skinColor}"/>
  <circle cx="100" cy="82" r="44" fill="${skinColor}"/>
  ${noseSvg()}
  ${eyesSvg(eyeType, eyeColor)}
  ${mouthSvg(mouthType)}
  ${hairFront(hairStyle, hairColor)}
  ${accessorySvg(accessory)}
</svg>`.trim();
}

export function avatarToDataUri(spec: AvatarSpec): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatarToSvg(spec))}`;
}

// Legacy compat: still export getAvatarOptions as an array of specs
export function getAvatarOptions(count = 48): AvatarSpec[] {
  return Array.from({ length: count }, (_, i) => defaultAvatarSpec(i));
}

// Alias for old code that used AvatarSpec from avatarOptions
export type { AvatarSpec as default };
