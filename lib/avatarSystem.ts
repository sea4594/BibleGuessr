// Full-body vector avatar system. Saved values stay string-based for backward compatibility.

export interface AvatarSpec {
  background?: string;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeType: string;
  eyeColor: string;
  eyebrowStyle: string;
  mouthType: string;
  facialHair: string;
  shirtStyle: string;
  shirtColor: string;
  bottomStyle: string;
  pantsColor: string;
  shoeStyle: string;
  shoeColor: string;
  accessory: string;
}

export const SKIN_OPTIONS = [
  '#F9DCC4','#F2C7A5','#E8B184','#D99868','#C47A4B',
  '#A96035','#874526','#65331F','#47241A','#2F1914',
];
export const HAIR_COLORS = [
  '#171514','#2C211D','#4A2E22','#6A4028','#8A5433','#A95D35',
  '#C98A4A','#E4BD72','#F0D79A','#A83E32','#6A4A7C','#304F78',
];
export const HAIR_STYLES = [
  'bald','buzz-cut','short-textured','side-part','quiff','waves','curls','afro',
  'bob','long-straight','long-wavy','ponytail','bun',
] as const;
export const EYE_TYPES = ['classic','almond','round','relaxed','happy','wink'] as const;
export const EYE_COLORS = ['#2A211D','#5A371E','#81562A','#456C45','#47769C','#6B5B90'] as const;
export const EYEBROW_STYLES = ['natural','straight','soft-arch','bold'] as const;
export const MOUTH_TYPES = ['soft-smile','smile','grin','neutral','open-smile','smirk'] as const;
export const FACIAL_HAIR = ['none','stubble','mustache','goatee','short-beard','full-beard'] as const;
export const SHIRT_STYLES = [
  'crew-tee','v-neck','polo','button-up','hoodie','sweatshirt','sweater','jersey','tank',
] as const;
export const SHIRT_COLORS = [
  '#3159C7','#4377E8','#1D8A68','#46A56B','#0F8496','#7A4FC2','#A94EAA',
  '#D2554D','#E77835','#E5A92F','#D8C9A5','#F1EEE8','#67707C','#252A31',
] as const;
export const BOTTOM_STYLES = ['jeans','chinos','joggers','shorts','wide-leg','skirt'] as const;
export const PANTS_COLORS = [
  '#335F8A','#5E86AD','#90AEC7','#263C59','#4F5968','#7A7167',
  '#B89B71','#D3BD98','#6E7951','#A76347','#8A556A','#597F82',
] as const;
export const SHOE_STYLES = ['sneakers','high-tops','boots','loafers'] as const;
export const SHOE_COLORS = ['#F4F2EC','#20242A','#4E5662','#72513A','#A85A3C','#C94C4C','#3D67B7','#4B8463'] as const;
export const ACCESSORIES = ['none','glasses','round-glasses','sunglasses','cap','beanie','headband','earrings'] as const;

export type AvatarFocus = 'full' | 'head' | 'torso' | 'bottom';
export type AvatarGroup = 'face' | 'hair' | 'outfit' | 'extras';

export const AVATAR_ATTRIBUTES = [
  { key: 'skinColor' as const, label: 'Skin tone', type: 'color', group: 'face', options: SKIN_OPTIONS, focus: 'head' },
  { key: 'eyeType' as const, label: 'Eyes', type: 'style', group: 'face', options: EYE_TYPES, focus: 'head' },
  { key: 'eyeColor' as const, label: 'Eye color', type: 'color', group: 'face', options: EYE_COLORS, focus: 'head' },
  { key: 'eyebrowStyle' as const, label: 'Eyebrows', type: 'style', group: 'face', options: EYEBROW_STYLES, focus: 'head' },
  { key: 'mouthType' as const, label: 'Expression', type: 'style', group: 'face', options: MOUTH_TYPES, focus: 'head' },
  { key: 'facialHair' as const, label: 'Facial hair', type: 'style', group: 'face', options: FACIAL_HAIR, focus: 'head' },
  { key: 'hairStyle' as const, label: 'Hair style', type: 'style', group: 'hair', options: HAIR_STYLES, focus: 'head' },
  { key: 'hairColor' as const, label: 'Hair color', type: 'color', group: 'hair', options: HAIR_COLORS, focus: 'head' },
  { key: 'shirtStyle' as const, label: 'Top', type: 'style', group: 'outfit', options: SHIRT_STYLES, focus: 'torso' },
  { key: 'shirtColor' as const, label: 'Top color', type: 'color', group: 'outfit', options: SHIRT_COLORS, focus: 'torso' },
  { key: 'bottomStyle' as const, label: 'Bottoms', type: 'style', group: 'outfit', options: BOTTOM_STYLES, focus: 'bottom' },
  { key: 'pantsColor' as const, label: 'Bottom color', type: 'color', group: 'outfit', options: PANTS_COLORS, focus: 'bottom' },
  { key: 'shoeStyle' as const, label: 'Shoes', type: 'style', group: 'outfit', options: SHOE_STYLES, focus: 'bottom' },
  { key: 'shoeColor' as const, label: 'Shoe color', type: 'color', group: 'outfit', options: SHOE_COLORS, focus: 'bottom' },
  { key: 'accessory' as const, label: 'Accessory', type: 'style', group: 'extras', options: ACCESSORIES, focus: 'head' },
] as const;

const OPTION_LABELS: Record<string, string> = {
  'buzz-cut': 'Buzz cut', 'short-textured': 'Short texture', 'side-part': 'Side part',
  'long-straight': 'Long straight', 'long-wavy': 'Long waves',
  classic: 'Classic', almond: 'Almond', round: 'Round', relaxed: 'Relaxed', happy: 'Happy', wink: 'Wink',
  natural: 'Natural', straight: 'Straight', 'soft-arch': 'Soft arch', bold: 'Bold',
  'soft-smile': 'Soft smile', smile: 'Smile', grin: 'Grin', neutral: 'Neutral', 'open-smile': 'Open smile', smirk: 'Smirk',
  none: 'None', stubble: 'Stubble', mustache: 'Mustache', goatee: 'Goatee', 'short-beard': 'Short beard', 'full-beard': 'Full beard',
  'crew-tee': 'Crew tee', 'v-neck': 'V-neck', polo: 'Polo', 'button-up': 'Button-up', hoodie: 'Hoodie',
  sweatshirt: 'Sweatshirt', sweater: 'Sweater', jersey: 'Jersey', tank: 'Tank',
  jeans: 'Jeans', chinos: 'Chinos', joggers: 'Joggers', shorts: 'Shorts', 'wide-leg': 'Wide leg', skirt: 'Skirt',
  sneakers: 'Sneakers', 'high-tops': 'High-tops', boots: 'Boots', loafers: 'Loafers',
  glasses: 'Glasses', 'round-glasses': 'Round glasses', sunglasses: 'Sunglasses', cap: 'Cap', beanie: 'Beanie', headband: 'Headband', earrings: 'Earrings',
  bald: 'Bald', quiff: 'Quiff', waves: 'Waves', curls: 'Curls', afro: 'Afro', bob: 'Bob', ponytail: 'Ponytail', bun: 'Bun',
};
export function avatarOptionLabel(value: string) {
  return OPTION_LABELS[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function pick<T>(items: readonly T[], seed: number, divisor: number): T {
  return items[Math.floor(seed / divisor) % items.length];
}

export function defaultAvatarSpec(seed = 0): AvatarSpec {
  const safeSeed = Math.abs(Math.floor(seed));
  return {
    skinColor: pick(SKIN_OPTIONS, safeSeed, 2),
    hairStyle: pick(HAIR_STYLES, safeSeed, 3),
    hairColor: pick(HAIR_COLORS, safeSeed, 5),
    eyeType: pick(EYE_TYPES, safeSeed, 7),
    eyeColor: pick(EYE_COLORS, safeSeed, 11),
    eyebrowStyle: pick(EYEBROW_STYLES, safeSeed, 13),
    mouthType: pick(MOUTH_TYPES, safeSeed, 17),
    facialHair: pick(FACIAL_HAIR, safeSeed, 19),
    shirtStyle: pick(SHIRT_STYLES, safeSeed, 23),
    shirtColor: pick(SHIRT_COLORS, safeSeed, 29),
    bottomStyle: pick(BOTTOM_STYLES, safeSeed, 31),
    pantsColor: pick(PANTS_COLORS, safeSeed, 37),
    shoeStyle: pick(SHOE_STYLES, safeSeed, 41),
    shoeColor: pick(SHOE_COLORS, safeSeed, 43),
    accessory: pick(ACCESSORIES, safeSeed, 47),
  };
}

export function randomAvatarSpec(): AvatarSpec {
  const choose = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
  return {
    skinColor: choose(SKIN_OPTIONS), hairStyle: choose(HAIR_STYLES), hairColor: choose(HAIR_COLORS),
    eyeType: choose(EYE_TYPES), eyeColor: choose(EYE_COLORS), eyebrowStyle: choose(EYEBROW_STYLES),
    mouthType: choose(MOUTH_TYPES), facialHair: choose(FACIAL_HAIR), shirtStyle: choose(SHIRT_STYLES),
    shirtColor: choose(SHIRT_COLORS), bottomStyle: choose(BOTTOM_STYLES), pantsColor: choose(PANTS_COLORS),
    shoeStyle: choose(SHOE_STYLES), shoeColor: choose(SHOE_COLORS), accessory: choose(ACCESSORIES),
  };
}

function shiftChannel(value: number, delta: number) { return Math.max(0, Math.min(255, value + delta)); }
function shiftHex(hex: string, delta: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = shiftChannel((n >> 16) & 0xff, delta), g = shiftChannel((n >> 8) & 0xff, delta), b = shiftChannel(n & 0xff, delta);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function alpha(hex: string, opacity: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex;
  return `${hex}${Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, '0')}`;
}

function hairBack(style: string, color: string): string {
  const dark = shiftHex(color, -18);
  switch (style) {
    case 'bald': case 'buzz-cut': case 'short-textured': case 'side-part': case 'quiff': case 'waves': return '';
    case 'curly':
    case 'curls': return `<path d="M69 69Q70 34 120 30Q170 34 171 69L159 111H81Z" fill="${color}"/>`;
    case 'afro': return `<g fill="${color}"><circle cx="120" cy="58" r="43"/><circle cx="84" cy="66" r="31"/><circle cx="156" cy="66" r="31"/><circle cx="99" cy="38" r="28"/><circle cx="141" cy="38" r="28"/></g>`;
    case 'bob': return `<path d="M67 70Q68 27 120 27Q172 28 173 72L166 151Q153 166 145 147L140 103H100L95 149Q85 166 74 151Z" fill="${color}"/>`;
    case 'long':
    case 'long-straight': return `<path d="M67 68Q70 25 120 25Q170 26 173 69L169 214Q151 221 145 200L141 100H99L95 200Q89 221 71 214Z" fill="${color}"/>`;
    case 'long-wavy': return `<path d="M67 68Q70 24 120 25Q170 25 173 69Q178 104 166 129Q179 157 165 184Q176 206 160 223L144 207Q151 181 141 158Q151 131 141 103H99Q89 130 99 157Q89 181 96 207L80 223Q64 206 75 184Q61 157 74 129Q62 104 67 68Z" fill="${color}"/>`;
    case 'ponytail': return `<path d="M69 66Q73 27 120 27Q165 28 171 67L158 103H82Z" fill="${color}"/><path d="M165 76Q204 93 185 151Q178 172 161 179Q173 140 160 111Z" fill="${dark}"/>`;
    case 'bun': return `<circle cx="120" cy="24" r="25" fill="${dark}"/><path d="M70 69Q73 29 120 29Q167 29 170 69L157 105H83Z" fill="${color}"/>`;
    default: return '';
  }
}

function hairFront(style: string, color: string): string {
  const hi = shiftHex(color, 24), dark = shiftHex(color, -20);
  switch (style) {
    case 'bald': return '';
    case 'crew':
    case 'buzz':
    case 'buzz-cut': return `<path d="M75 67Q79 39 120 35Q161 39 165 67Q148 49 120 49Q92 49 75 67Z" fill="${color}"/><path d="M87 51Q120 39 153 52" stroke="${hi}" stroke-width="3" fill="none" opacity=".45"/>`;
    case 'short':
    case 'crop':
    case 'short-textured': return `<path d="M73 69Q70 49 84 38L91 45Q95 31 108 37Q117 24 126 37Q140 28 144 43Q160 37 166 54L164 72Q145 56 121 57Q96 55 73 69Z" fill="${color}"/><path d="M91 48L102 41M117 43L126 36M140 48L151 43" stroke="${hi}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
    case 'side-part': return `<path d="M70 71Q72 35 118 31Q154 30 170 55Q149 48 128 54Q112 59 92 72Z" fill="${color}"/><path d="M118 34Q112 52 91 67" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'quiff': return `<path d="M72 72Q72 45 94 39Q97 20 119 31Q136 13 151 35Q169 37 170 65Q147 49 122 53Q99 51 72 72Z" fill="${color}"/><path d="M103 42Q126 27 150 42" stroke="${hi}" stroke-width="4" fill="none" opacity=".5"/>`;
    case 'waves': return `<path d="M70 71Q71 35 120 31Q168 34 170 69Q157 57 145 63Q133 69 121 61Q109 53 96 62Q84 70 70 71Z" fill="${color}"/><path d="M83 52Q96 44 108 51Q120 58 132 50Q144 43 157 51" stroke="${hi}" stroke-width="3" fill="none" opacity=".5"/>`;
    case 'curly':
    case 'curls': return `<g fill="${color}"><circle cx="78" cy="61" r="17"/><circle cx="94" cy="48" r="18"/><circle cx="114" cy="44" r="19"/><circle cx="135" cy="46" r="18"/><circle cx="154" cy="60" r="18"/></g><g fill="${hi}" opacity=".32"><circle cx="94" cy="48" r="5"/><circle cx="133" cy="47" r="5"/></g>`;
    case 'afro': return `<path d="M74 70Q82 47 100 43Q120 52 140 43Q158 48 166 70Q148 56 120 57Q92 56 74 70Z" fill="${color}"/>`;
    case 'bob': return `<path d="M70 68Q75 28 120 29Q165 29 170 68Q151 52 128 52Q103 50 70 68Z" fill="${color}"/><path d="M119 31Q116 53 101 66" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'long':
    case 'long-straight': return `<path d="M69 68Q75 27 120 27Q164 27 171 67Q148 50 121 51Q94 50 69 68Z" fill="${color}"/><path d="M121 29Q114 53 95 68" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'long-wavy': return `<path d="M69 68Q74 26 120 27Q165 27 171 68Q153 50 132 54Q119 58 107 52Q88 49 69 68Z" fill="${color}"/><path d="M83 52Q96 45 107 51Q119 58 131 51Q144 44 157 52" stroke="${hi}" stroke-width="3" fill="none" opacity=".5"/>`;
    case 'ponytail': return `<path d="M70 69Q75 29 120 29Q164 29 170 68Q151 52 126 53Q102 51 70 69Z" fill="${color}"/><path d="M120 31Q111 52 95 66" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'bun': return `<path d="M71 69Q76 30 120 30Q164 30 169 69Q151 52 120 54Q90 52 71 69Z" fill="${color}"/>`;
    default: return '';
  }
}

function eyeSvg(type: string, color: string): string {
  const iris = (x: number, y: number, r = 5) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
  switch (type) {
    case 'almond': return `<path d="M86 89Q96 78 106 89Q96 99 86 89Z" fill="#fff"/><circle cx="96" cy="89" r="5" fill="${color}"/><path d="M134 89Q144 78 154 89Q144 99 134 89Z" fill="#fff"/><circle cx="144" cy="89" r="5" fill="${color}"/>`;
    case 'round': return `${iris(96,89,5.5)}${iris(144,89,5.5)}`;
    case 'relaxed': return `<path d="M87 90Q96 84 105 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M135 90Q144 84 153 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'happy': return `<path d="M87 91Q96 81 105 91" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M135 91Q144 81 153 91" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'wink': return `${iris(96,89)}<path d="M135 90Q144 84 153 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    default: return `${iris(96,89)}${iris(144,89)}`;
  }
}

function eyebrowSvg(style: string, hairColor: string): string {
  const c = shiftHex(hairColor, -10);
  switch (style) {
    case 'straight': return `<path d="M87 75Q96 73 105 75M135 75Q144 73 153 75" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'soft-arch': return `<path d="M86 77Q96 68 106 75M134 75Q144 68 154 77" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 'bold': return `<path d="M86 77Q96 69 107 74M133 74Q144 69 154 77" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M87 76Q96 71 105 75M135 75Q144 71 153 76" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
}

function noseSvg(skinColor: string): string {
  const c = alpha(shiftHex(skinColor, -45), .45);
  return `<path d="M120 91Q116 105 120 108Q124 108 126 105" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="115" cy="108" r="1.7" fill="${c}"/><circle cx="125" cy="108" r="1.7" fill="${c}"/>`;
}

function mouthSvg(type: string): string {
  const lip = '#8D474A', inner = '#5A2B30';
  switch (type) {
    case 'smile': return `<path d="M105 119Q120 132 135 119" stroke="${lip}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 'grin': return `<path d="M103 118Q120 134 137 118Q133 136 120 137Q107 136 103 118Z" fill="#fff" stroke="${inner}" stroke-width="2"/>`;
    case 'neutral': return `<path d="M108 123Q120 121 132 123" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'open-smile': return `<path d="M104 118Q120 136 136 118Q133 140 120 141Q107 140 104 118Z" fill="${inner}"/><path d="M110 132Q120 138 130 132" stroke="#E98188" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'smirk': return `<path d="M108 124Q120 128 134 118" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M108 121Q120 128 132 121" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

function facialHairSvg(style: string, color: string): string {
  const c = alpha(shiftHex(color, -8), .82);
  switch (style) {
    case 'stubble': return `<g fill="${c}" opacity=".55"><circle cx="103" cy="126" r="1.2"/><circle cx="110" cy="132" r="1.2"/><circle cx="120" cy="134" r="1.2"/><circle cx="130" cy="132" r="1.2"/><circle cx="137" cy="126" r="1.2"/><circle cx="111" cy="139" r="1.2"/><circle cx="129" cy="139" r="1.2"/></g>`;
    case 'mustache': return `<path d="M102 116Q111 110 120 117Q129 110 138 116Q134 124 121 121Q106 124 102 116Z" fill="${c}"/>`;
    case 'goatee': return `<path d="M108 117Q120 112 132 117Q128 122 120 120Q112 122 108 117Z" fill="${c}"/><path d="M112 130Q120 137 128 130L126 144Q120 151 114 144Z" fill="${c}"/>`;
    case 'short-beard': return `<path d="M82 109Q87 142 105 151Q120 160 135 151Q153 142 158 109Q151 137 135 143Q120 150 105 143Q89 137 82 109Z" fill="${c}" opacity=".72"/>`;
    case 'full-beard': return `<path d="M80 104Q83 143 101 155Q120 170 139 155Q157 143 160 104Q153 137 140 146Q120 160 100 146Q87 137 80 104Z" fill="${c}"/>`;
    default: return '';
  }
}

function armsSvg(style: string, shirtColor: string, skinColor: string): string {
  const longSleeve = ['hoodie','sweatshirt','sweater','button-up'].includes(style);
  if (style === 'tank' || style === 'jersey') {
    return `<rect x="48" y="158" width="27" height="67" rx="13" fill="${skinColor}"/><circle cx="61.5" cy="226" r="13.5" fill="${skinColor}"/><rect x="165" y="158" width="27" height="67" rx="13" fill="${skinColor}"/><circle cx="178.5" cy="226" r="13.5" fill="${skinColor}"/>`;
  }
  if (longSleeve) {
    return `<path d="M73 157Q58 154 48 170L47 218Q48 226 58 226H70L78 166Z" fill="${shirtColor}"/><circle cx="58" cy="226" r="13" fill="${skinColor}"/><path d="M167 157Q182 154 192 170L193 218Q192 226 182 226H170L162 166Z" fill="${shirtColor}"/><circle cx="182" cy="226" r="13" fill="${skinColor}"/>`;
  }
  return `<path d="M74 156Q56 153 48 169L53 188L76 181Z" fill="${shirtColor}"/><rect x="50" y="181" width="25" height="44" rx="12" fill="${skinColor}"/><circle cx="62" cy="226" r="12.5" fill="${skinColor}"/><path d="M166 156Q184 153 192 169L187 188L164 181Z" fill="${shirtColor}"/><rect x="165" y="181" width="25" height="44" rx="12" fill="${skinColor}"/><circle cx="178" cy="226" r="12.5" fill="${skinColor}"/>`;
}

function shirtSvg(style: string, shirtColor: string, skinColor: string): string {
  const shade = shiftHex(shirtColor, -22), light = shiftHex(shirtColor, 22);
  const body = `<path d="M76 151Q91 145 103 145H137Q149 145 164 151L160 237H80Z" fill="${shirtColor}"/>`;
  switch (style) {
    case 'v-neck': return `${body}<path d="M103 146L120 169L137 146Z" fill="${skinColor}"/>`;
    case 'polo': return `${body}<path d="M101 146L120 161L139 146L132 168L120 160L108 168Z" fill="${light}"/><path d="M120 160V188" stroke="${shade}" stroke-width="3"/><circle cx="124" cy="174" r="2" fill="${shade}"/>`;
    case 'button-up': return `${body}<path d="M103 146L120 161L109 174L96 151ZM137 146L120 161L131 174L144 151Z" fill="${light}"/><path d="M120 160V236" stroke="${shade}" stroke-width="2"/><g fill="${shade}"><circle cx="125" cy="180" r="2"/><circle cx="125" cy="199" r="2"/><circle cx="125" cy="218" r="2"/></g>`;
    case 'hoodie': return `${body}<path d="M95 148Q120 132 145 148L137 171Q120 158 103 171Z" fill="${shade}"/><path d="M108 163L113 184M132 163L127 184" stroke="${light}" stroke-width="2.5"/><path d="M101 209Q120 201 139 209L136 228H104Z" fill="${shade}"/>`;
    case 'sweatshirt': return `${body}<rect x="82" y="226" width="76" height="11" rx="5" fill="${shade}"/><path d="M102 147Q120 159 138 147" stroke="${shade}" stroke-width="7" fill="none"/>`;
    case 'sweater': return `${body}<path d="M101 148Q120 163 139 148" stroke="${light}" stroke-width="5" fill="none"/><path d="M87 171H153M87 193H153M87 215H153" stroke="${light}" stroke-width="2" opacity=".32"/>`;
    case 'jersey': return `<path d="M88 148H101Q120 160 139 148H152L164 161L157 237H83L76 161Z" fill="${shirtColor}"/><path d="M92 149Q120 174 148 149" stroke="${light}" stroke-width="5" fill="none"/><path d="M88 154L84 228M152 154L156 228" stroke="${light}" stroke-width="4" opacity=".65"/>`;
    case 'tank': return `<path d="M93 147H105Q120 159 135 147H147L159 237H81Z" fill="${shirtColor}"/><path d="M103 148Q120 169 137 148" fill="${skinColor}"/>`;
    default: return `${body}<path d="M101 147Q120 159 139 147" stroke="${shade}" stroke-width="5" fill="none" opacity=".55"/>`;
  }
}

function lowerBodySvg(style: string, pantsColor: string, skinColor: string): string {
  const shade = shiftHex(pantsColor, -22), light = shiftHex(pantsColor, 20);
  switch (style) {
    case 'chinos': return `<path d="M82 235H118L114 318H80Z" fill="${pantsColor}"/><path d="M122 235H158L160 318H126Z" fill="${pantsColor}"/><path d="M86 247L108 248M132 248L154 247" stroke="${shade}" stroke-width="2"/>`;
    case 'joggers': return `<path d="M82 235H118L111 310H83Z" fill="${pantsColor}"/><path d="M122 235H158L157 310H129Z" fill="${pantsColor}"/><rect x="82" y="304" width="30" height="12" rx="5" fill="${shade}"/><rect x="128" y="304" width="30" height="12" rx="5" fill="${shade}"/><path d="M105 239Q120 248 135 239" stroke="${light}" stroke-width="2" fill="none"/>`;
    case 'shorts': return `<path d="M81 235H119L115 278H78Z" fill="${pantsColor}"/><path d="M121 235H159L162 278H125Z" fill="${pantsColor}"/><rect x="83" y="274" width="31" height="43" rx="12" fill="${skinColor}"/><rect x="126" y="274" width="31" height="43" rx="12" fill="${skinColor}"/>`;
    case 'wide-leg': return `<path d="M79 235H119L116 318H71Z" fill="${pantsColor}"/><path d="M121 235H161L169 318H124Z" fill="${pantsColor}"/><path d="M120 239V311" stroke="${shade}" stroke-width="2" opacity=".55"/>`;
    case 'skirt': return `<path d="M83 235H157L170 291H70Z" fill="${pantsColor}"/><path d="M88 246Q120 254 152 246" stroke="${light}" stroke-width="3" fill="none" opacity=".55"/><rect x="88" y="286" width="26" height="33" rx="11" fill="${skinColor}"/><rect x="126" y="286" width="26" height="33" rx="11" fill="${skinColor}"/>`;
    default: return `<path d="M81 235H119L115 318H79Z" fill="${pantsColor}"/><path d="M121 235H159L161 318H125Z" fill="${pantsColor}"/><path d="M120 239V314" stroke="${shade}" stroke-width="2"/><path d="M84 252H111M129 252H156" stroke="${light}" stroke-width="2" opacity=".5"/>`;
  }
}

function shoesSvg(style: string, color: string): string {
  const shade = shiftHex(color, -28), light = shiftHex(color, 28);
  switch (style) {
    case 'high-tops': return `<path d="M72 302H114V337H68Q61 333 66 326L77 319Z" fill="${color}"/><path d="M126 302H168L174 326Q179 333 172 337H126Z" fill="${color}"/><path d="M72 329H113M127 329H171" stroke="${light}" stroke-width="4"/><path d="M82 309L104 319M158 309L136 319" stroke="${shade}" stroke-width="2"/>`;
    case 'boots': return `<path d="M75 294H113V337H66Q61 330 69 324L77 317Z" fill="${color}"/><path d="M127 294H165L163 317L171 324Q179 330 174 337H127Z" fill="${color}"/><path d="M72 326H112M128 326H168" stroke="${shade}" stroke-width="4"/>`;
    case 'loafers': return `<path d="M78 315H113L116 336H66Q61 328 72 322Z" fill="${color}"/><path d="M127 315H162L168 322Q179 328 174 336H124Z" fill="${color}"/><path d="M79 322H105M135 322H161" stroke="${light}" stroke-width="3"/>`;
    default: return `<path d="M77 315H113L117 337H65Q60 329 72 322Z" fill="${color}"/><path d="M127 315H163L168 322Q180 329 175 337H123Z" fill="${color}"/><path d="M66 331H116M124 331H174" stroke="${light}" stroke-width="4"/><path d="M80 320L104 328M160 320L136 328" stroke="${shade}" stroke-width="2"/>`;
  }
}

function accessorySvg(accessory: string, shirtColor: string): string {
  const dark = '#23262B', accent = shirtColor, light = shiftHex(shirtColor, 30);
  switch (accessory) {
    case 'glasses': return `<rect x="83" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><rect x="129" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M71 86L83 88M157 88L169 86" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'round-glasses': return `<circle cx="97" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><circle cx="143" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M72 85L83 87M157 87L168 85" stroke="${dark}" stroke-width="3"/>`;
    case 'sunglasses': return `<path d="M81 80H111L108 99Q97 106 86 99Z" fill="${dark}"/><path d="M129 80H159L154 99Q143 106 132 99Z" fill="${dark}"/><path d="M111 87H129M69 83L81 85M159 85L171 83" stroke="${dark}" stroke-width="3"/>`;
    case 'hat':
    case 'cap': return `<path d="M72 50Q82 19 120 19Q158 19 168 50Z" fill="${accent}"/><path d="M112 51Q146 46 178 58Q155 66 119 60Z" fill="${shiftHex(accent,-18)}"/><path d="M91 31Q120 22 149 33" stroke="${light}" stroke-width="3" fill="none" opacity=".55"/>`;
    case 'beanie': return `<path d="M73 56Q78 15 120 15Q162 15 167 56Z" fill="${accent}"/><rect x="72" y="50" width="96" height="19" rx="8" fill="${shiftHex(accent,-18)}"/><path d="M92 31H148" stroke="${light}" stroke-width="3" opacity=".45"/>`;
    case 'headband': return `<path d="M73 61Q120 46 167 61" stroke="${accent}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    case 'earring':
    case 'earrings': return `<circle cx="71" cy="108" r="4.5" fill="#D7B44B"/><circle cx="169" cy="108" r="4.5" fill="#D7B44B"/><circle cx="71" cy="115" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/><circle cx="169" cy="115" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/>`;
    default: return '';
  }
}

function svgFrame(focus: AvatarFocus) {
  switch (focus) {
    case 'head': return { viewBox: '55 6 130 150', width: 130, height: 150 };
    case 'torso': return { viewBox: '42 130 156 122', width: 156, height: 122 };
    case 'bottom': return { viewBox: '54 224 132 122', width: 132, height: 122 };
    default: return { viewBox: '0 0 240 350', width: 240, height: 350 };
  }
}

export function avatarToSvg(spec: AvatarSpec, focus: AvatarFocus = 'full'): string {
  const fallback = defaultAvatarSpec(0);
  const resolved = { ...fallback, ...spec };
  const frame = svgFrame(focus);
  const { skinColor, hairStyle, hairColor, eyeType, eyeColor, eyebrowStyle, mouthType, facialHair,
    shirtStyle, shirtColor, bottomStyle, pantsColor, shoeStyle, shoeColor, accessory } = resolved;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame.viewBox}" width="${frame.width}" height="${frame.height}" preserveAspectRatio="xMidYMid meet">
  ${lowerBodySvg(bottomStyle, pantsColor, skinColor)}
  ${shoesSvg(shoeStyle, shoeColor)}
  ${hairBack(hairStyle, hairColor)}
  ${armsSvg(shirtStyle, shirtColor, skinColor)}
  ${shirtSvg(shirtStyle, shirtColor, skinColor)}
  <rect x="105" y="126" width="30" height="34" rx="11" fill="${skinColor}"/>
  <ellipse cx="72" cy="95" rx="9" ry="14" fill="${skinColor}"/><ellipse cx="168" cy="95" rx="9" ry="14" fill="${skinColor}"/>
  <ellipse cx="120" cy="87" rx="49" ry="54" fill="${skinColor}"/>
  ${eyebrowSvg(eyebrowStyle, hairColor)}
  ${eyeSvg(eyeType, eyeColor)}
  ${noseSvg(skinColor)}
  ${mouthSvg(mouthType)}
  ${facialHairSvg(facialHair, hairColor)}
  ${hairFront(hairStyle, hairColor)}
  ${accessorySvg(accessory, shirtColor)}
</svg>`.trim();
}

export function avatarToDataUri(spec: AvatarSpec, focus: AvatarFocus = 'full'): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatarToSvg(spec, focus))}`;
}

export function getAvatarOptions(count = 48): AvatarSpec[] {
  return Array.from({ length: count }, (_, i) => defaultAvatarSpec(i * 17 + 3));
}

export type { AvatarSpec as default };
