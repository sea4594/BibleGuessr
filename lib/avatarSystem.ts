// Full-body vector avatar system. Saved values stay string-based for backward compatibility.

export type AvatarGender = 'male' | 'female';
export interface AvatarSpec {
  background?: string;
  gender: AvatarGender;
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

export const SKIN_OPTIONS = ['#F9DCC4','#F2C7A5','#E8B184','#D99868','#C47A4B','#A96035','#874526','#65331F','#47241A','#2F1914'] as const;
export const HAIR_COLORS = ['#171514','#2C211D','#4A2E22','#6A4028','#8A5433','#A95D35','#C98A4A','#E4BD72','#F0D79A','#A83E32','#6A4A7C','#304F78'] as const;
export const MALE_HAIR_STYLES = ['bald','buzz-cut','short-textured','side-part','quiff','waves','curls','afro','bro-flow','man-bun'] as const;
export const FEMALE_HAIR_STYLES = ['pixie','bob','layered-bob','long-straight','long-wavy','ponytail','bun','braids','curly-bob','afro'] as const;
export const EYE_TYPES = ['classic','almond','round','relaxed','happy','wink'] as const;
export const EYE_COLORS = ['#2A211D','#5A371E','#81562A','#456C45','#47769C','#6B5B90'] as const;
export const EYEBROW_STYLES = ['natural','straight','soft-arch','bold'] as const;
export const MOUTH_TYPES = ['soft-smile','smile','grin','neutral','open-smile','smirk'] as const;
export const FACIAL_HAIR = ['none','stubble','mustache','goatee','short-beard','full-beard'] as const;
export const SHIRT_STYLES = ['crew-tee','v-neck','polo','button-up','hoodie','sweatshirt','sweater','jersey','tank'] as const;
export const SHIRT_COLORS = ['#3159C7','#4377E8','#1D8A68','#46A56B','#0F8496','#7A4FC2','#A94EAA','#D2554D','#E77835','#E5A92F','#D8C9A5','#F1EEE8','#67707C','#252A31'] as const;
export const MALE_BOTTOM_STYLES = ['jeans','chinos','joggers','shorts','wide-leg'] as const;
export const FEMALE_BOTTOM_STYLES = ['jeans','chinos','joggers','shorts','wide-leg','skirt'] as const;
export const PANTS_COLORS = ['#335F8A','#5E86AD','#90AEC7','#263C59','#4F5968','#7A7167','#B89B71','#D3BD98','#6E7951','#A76347','#8A556A','#597F82'] as const;
export const SHOE_STYLES = ['sneakers','high-tops','boots','loafers'] as const;
export const SHOE_COLORS = ['#F4F2EC','#20242A','#4E5662','#72513A','#A85A3C','#C94C4C','#3D67B7','#4B8463'] as const;
export const ACCESSORIES = ['none','glasses','round-glasses','sunglasses','cap','beanie','headband','earrings'] as const;

export type AvatarFocus = 'full' | 'head' | 'torso' | 'bottom';
export type AvatarGroup = 'face' | 'hair' | 'outfit' | 'extras';
export type AvatarAttribute = { key: keyof AvatarSpec; label: string; type: 'color' | 'style'; group: AvatarGroup; options: readonly string[]; focus: AvatarFocus; };

const COMMON_ATTRIBUTES: readonly AvatarAttribute[] = [
  { key: 'skinColor', label: 'Skin tone', type: 'color', group: 'face', options: SKIN_OPTIONS, focus: 'head' },
  { key: 'eyeType', label: 'Eyes', type: 'style', group: 'face', options: EYE_TYPES, focus: 'head' },
  { key: 'eyeColor', label: 'Eye color', type: 'color', group: 'face', options: EYE_COLORS, focus: 'head' },
  { key: 'eyebrowStyle', label: 'Eyebrows', type: 'style', group: 'face', options: EYEBROW_STYLES, focus: 'head' },
  { key: 'mouthType', label: 'Expression', type: 'style', group: 'face', options: MOUTH_TYPES, focus: 'head' },
  { key: 'hairColor', label: 'Hair color', type: 'color', group: 'hair', options: HAIR_COLORS, focus: 'head' },
  { key: 'shirtStyle', label: 'Top', type: 'style', group: 'outfit', options: SHIRT_STYLES, focus: 'torso' },
  { key: 'shirtColor', label: 'Top color', type: 'color', group: 'outfit', options: SHIRT_COLORS, focus: 'torso' },
  { key: 'pantsColor', label: 'Bottom color', type: 'color', group: 'outfit', options: PANTS_COLORS, focus: 'bottom' },
  { key: 'shoeStyle', label: 'Shoes', type: 'style', group: 'outfit', options: SHOE_STYLES, focus: 'bottom' },
  { key: 'shoeColor', label: 'Shoe color', type: 'color', group: 'outfit', options: SHOE_COLORS, focus: 'bottom' },
  { key: 'accessory', label: 'Accessory', type: 'style', group: 'extras', options: ACCESSORIES, focus: 'head' },
] as const;

export function getHairStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_HAIR_STYLES] : [...MALE_HAIR_STYLES]; }
export function getBottomStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_BOTTOM_STYLES] : [...MALE_BOTTOM_STYLES]; }
export function getFacialHairOptions(gender: AvatarGender) { return gender === 'female' ? ['none'] : [...FACIAL_HAIR]; }
export function getAvatarAttributes(gender: AvatarGender): AvatarAttribute[] {
  return [
    COMMON_ATTRIBUTES[0],COMMON_ATTRIBUTES[1],COMMON_ATTRIBUTES[2],COMMON_ATTRIBUTES[3],COMMON_ATTRIBUTES[4],
    ...(gender === 'male' ? [{ key: 'facialHair', label: 'Facial hair', type: 'style', group: 'face', options: FACIAL_HAIR, focus: 'head' } as const] : []),
    { key: 'hairStyle', label: 'Hair style', type: 'style', group: 'hair', options: getHairStyleOptions(gender), focus: 'head' },
    COMMON_ATTRIBUTES[5],
    COMMON_ATTRIBUTES[6],COMMON_ATTRIBUTES[7],
    { key: 'bottomStyle', label: 'Bottoms', type: 'style', group: 'outfit', options: getBottomStyleOptions(gender), focus: 'bottom' },
    COMMON_ATTRIBUTES[8],COMMON_ATTRIBUTES[9],COMMON_ATTRIBUTES[10],COMMON_ATTRIBUTES[11],
  ];
}
export const AVATAR_ATTRIBUTES = getAvatarAttributes('male');

const OPTION_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female',
  bald: 'Bald', 'buzz-cut': 'Buzz cut', 'short-textured': 'Short texture', 'side-part': 'Side part', quiff: 'Quiff', waves: 'Waves', curls: 'Curls', afro: 'Afro', 'bro-flow': 'Bro flow', 'man-bun': 'Man bun',
  pixie: 'Pixie', bob: 'Bob', 'layered-bob': 'Layered bob', 'long-straight': 'Long straight', 'long-wavy': 'Long waves', ponytail: 'Ponytail', bun: 'Bun', braids: 'Braids', 'curly-bob': 'Curly bob',
  classic: 'Classic', almond: 'Almond', round: 'Round', relaxed: 'Relaxed', happy: 'Happy', wink: 'Wink',
  natural: 'Natural', straight: 'Straight', 'soft-arch': 'Soft arch', bold: 'Bold',
  'soft-smile': 'Soft smile', smile: 'Smile', grin: 'Grin', neutral: 'Neutral', 'open-smile': 'Open smile', smirk: 'Smirk',
  none: 'None', stubble: 'Stubble', mustache: 'Mustache', goatee: 'Goatee', 'short-beard': 'Short beard', 'full-beard': 'Full beard',
  'crew-tee': 'Crew tee', 'v-neck': 'V-neck', polo: 'Polo', 'button-up': 'Button-up', hoodie: 'Hoodie', sweatshirt: 'Sweatshirt', sweater: 'Sweater', jersey: 'Jersey', tank: 'Tank',
  jeans: 'Jeans', chinos: 'Chinos', joggers: 'Joggers', shorts: 'Shorts', 'wide-leg': 'Wide leg', skirt: 'Skirt',
  sneakers: 'Sneakers', 'high-tops': 'High-tops', boots: 'Boots', loafers: 'Loafers',
  glasses: 'Glasses', 'round-glasses': 'Round glasses', sunglasses: 'Sunglasses', cap: 'Cap', beanie: 'Beanie', headband: 'Headband', earrings: 'Earrings',
};
export function avatarOptionLabel(value: string) { return OPTION_LABELS[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function pick<T>(items: readonly T[], seed: number, divisor: number): T { return items[Math.floor(seed / divisor) % items.length]; }
function choose<T>(items: readonly T[]) { return items[Math.floor(Math.random() * items.length)]; }

function inferGender(source: Partial<AvatarSpec>, seed = 0): AvatarGender {
  if (source.gender === 'male' || source.gender === 'female') return source.gender;
  if (source.bottomStyle === 'skirt') return 'female';
  if (typeof source.facialHair === 'string' && source.facialHair !== 'none') return 'male';
  if (['bob','layered-bob','long-straight','long-wavy','ponytail','bun','braids','curly-bob'].includes(String(source.hairStyle ?? ''))) return 'female';
  return seed % 2 === 0 ? 'male' : 'female';
}

export function constrainAvatarSpec(spec: Partial<AvatarSpec>, seed = 0): AvatarSpec {
  const gender = inferGender(spec, seed);
  const safeSeed = Math.abs(Math.floor(seed));
  const base: AvatarSpec = {
    gender,
    skinColor: pick(SKIN_OPTIONS, safeSeed, 2),
    hairStyle: pick(getHairStyleOptions(gender), safeSeed, 3),
    hairColor: pick(HAIR_COLORS, safeSeed, 5),
    eyeType: pick(EYE_TYPES, safeSeed, 7),
    eyeColor: pick(EYE_COLORS, safeSeed, 11),
    eyebrowStyle: pick(EYEBROW_STYLES, safeSeed, 13),
    mouthType: pick(MOUTH_TYPES, safeSeed, 17),
    facialHair: gender === 'male' ? pick(FACIAL_HAIR, safeSeed, 19) : 'none',
    shirtStyle: pick(SHIRT_STYLES, safeSeed, 23),
    shirtColor: pick(SHIRT_COLORS, safeSeed, 29),
    bottomStyle: pick(getBottomStyleOptions(gender), safeSeed, 31),
    pantsColor: pick(PANTS_COLORS, safeSeed, 37),
    shoeStyle: pick(SHOE_STYLES, safeSeed, 41),
    shoeColor: pick(SHOE_COLORS, safeSeed, 43),
    accessory: pick(ACCESSORIES, safeSeed, 47),
  };
  const next = { ...base, ...Object.fromEntries(Object.entries(spec).filter(([,v]) => typeof v === 'string')) } as AvatarSpec;
  next.gender = gender;
  if (!getHairStyleOptions(gender).includes(next.hairStyle as never)) next.hairStyle = base.hairStyle;
  if (!getBottomStyleOptions(gender).includes(next.bottomStyle as never)) next.bottomStyle = base.bottomStyle;
  if (!getFacialHairOptions(gender).includes(next.facialHair as never)) next.facialHair = base.facialHair;
  if (!SKIN_OPTIONS.includes(next.skinColor as never)) next.skinColor = base.skinColor;
  if (!HAIR_COLORS.includes(next.hairColor as never)) next.hairColor = base.hairColor;
  if (!EYE_TYPES.includes(next.eyeType as never)) next.eyeType = base.eyeType;
  if (!EYE_COLORS.includes(next.eyeColor as never)) next.eyeColor = base.eyeColor;
  if (!EYEBROW_STYLES.includes(next.eyebrowStyle as never)) next.eyebrowStyle = base.eyebrowStyle;
  if (!MOUTH_TYPES.includes(next.mouthType as never)) next.mouthType = base.mouthType;
  if (!SHIRT_STYLES.includes(next.shirtStyle as never)) next.shirtStyle = base.shirtStyle;
  if (!SHIRT_COLORS.includes(next.shirtColor as never)) next.shirtColor = base.shirtColor;
  if (!PANTS_COLORS.includes(next.pantsColor as never)) next.pantsColor = base.pantsColor;
  if (!SHOE_STYLES.includes(next.shoeStyle as never)) next.shoeStyle = base.shoeStyle;
  if (!SHOE_COLORS.includes(next.shoeColor as never)) next.shoeColor = base.shoeColor;
  if (!ACCESSORIES.includes(next.accessory as never)) next.accessory = base.accessory;
  if (typeof spec.background !== 'undefined' && typeof spec.background === 'string') next.background = spec.background;
  return next;
}

export function defaultAvatarSpec(seed = 0, preferredGender?: AvatarGender): AvatarSpec {
  return constrainAvatarSpec(preferredGender ? { gender: preferredGender } : {}, seed);
}
export function randomAvatarSpec(gender?: AvatarGender): AvatarSpec {
  const resolvedGender = gender ?? choose(['male','female'] as const);
  return constrainAvatarSpec({
    gender: resolvedGender,
    skinColor: choose(SKIN_OPTIONS), hairStyle: choose(getHairStyleOptions(resolvedGender)), hairColor: choose(HAIR_COLORS),
    eyeType: choose(EYE_TYPES), eyeColor: choose(EYE_COLORS), eyebrowStyle: choose(EYEBROW_STYLES), mouthType: choose(MOUTH_TYPES),
    facialHair: resolvedGender === 'male' ? choose(FACIAL_HAIR) : 'none',
    shirtStyle: choose(SHIRT_STYLES), shirtColor: choose(SHIRT_COLORS), bottomStyle: choose(getBottomStyleOptions(resolvedGender)), pantsColor: choose(PANTS_COLORS),
    shoeStyle: choose(SHOE_STYLES), shoeColor: choose(SHOE_COLORS), accessory: choose(ACCESSORIES),
  });
}

function shiftChannel(value: number, delta: number) { return Math.max(0, Math.min(255, value + delta)); }
function shiftHex(hex: string, delta: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = shiftChannel((n >> 16) & 0xff, delta), g = shiftChannel((n >> 8) & 0xff, delta), b = shiftChannel(n & 0xff, delta);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function faceShape(gender: AvatarGender, skinColor: string) {
  return gender === 'female'
    ? `<path d="M120 37C150 37 170 58 170 89C170 122 151 147 120 149C89 147 70 122 70 89C70 58 90 37 120 37Z" fill="${skinColor}"/>`
    : `<path d="M120 35C152 35 171 58 171 91C171 123 150 147 120 149C90 147 69 123 69 91C69 58 88 35 120 35Z" fill="${skinColor}"/>`;
}
function earSvg(skinColor: string) { return `<ellipse cx="72" cy="96" rx="8.5" ry="13" fill="${skinColor}"/><ellipse cx="168" cy="96" rx="8.5" ry="13" fill="${skinColor}"/>`; }
function neckSvg(skinColor: string) { return `<rect x="105" y="127" width="30" height="34" rx="11" fill="${skinColor}"/>`; }

function eyeSvg(type: string, color: string) {
  const stroke = shiftHex(color, -35);
  switch (type) {
    case 'almond': return `<path d="M87 90Q97 81 107 90Q97 98 87 90Z" fill="#fff"/><circle cx="97" cy="90" r="4.7" fill="${color}"/><path d="M133 90Q143 81 153 90Q143 98 133 90Z" fill="#fff"/><circle cx="143" cy="90" r="4.7" fill="${color}"/>`;
    case 'round': return `<circle cx="97" cy="90" r="8" fill="#fff"/><circle cx="143" cy="90" r="8" fill="#fff"/><circle cx="97" cy="90" r="4.7" fill="${color}"/><circle cx="143" cy="90" r="4.7" fill="${color}"/>`;
    case 'relaxed': return `<path d="M88 92Q97 86 106 92" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M134 92Q143 86 152 92" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'happy': return `<path d="M88 91Q97 100 106 91" stroke="${stroke}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M134 91Q143 100 152 91" stroke="${stroke}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 'wink': return `<path d="M89 91Q97 86 105 91" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="143" cy="90" r="8" fill="#fff"/><circle cx="143" cy="90" r="4.8" fill="${color}"/>`;
    default: return `<ellipse cx="97" cy="90" rx="7.5" ry="6.5" fill="#fff"/><ellipse cx="143" cy="90" rx="7.5" ry="6.5" fill="#fff"/><circle cx="97" cy="90" r="4.4" fill="${color}"/><circle cx="143" cy="90" r="4.4" fill="${color}"/>`;
  }
}
function eyebrowSvg(style: string, hairColor: string) {
  const c = shiftHex(hairColor, -10);
  switch (style) {
    case 'straight': return `<path d="M86 75H109M131 75H154" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    case 'soft-arch': return `<path d="M86 78Q97 69 109 77" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M131 77Q143 69 154 78" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'bold': return `<path d="M85 77Q97 69 110 76" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M130 76Q143 69 155 77" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M87 77Q97 73 108 78" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M132 78Q143 73 153 77" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
}
function noseSvg(skinColor: string) { return `<path d="M120 95Q116 109 121 116Q125 118 129 115" stroke="${shiftHex(skinColor, -18)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`; }
function mouthSvg(type: string) {
  const c = '#7A3E42';
  switch (type) {
    case 'soft-smile': return `<path d="M102 123Q120 132 138 123" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'grin': return `<path d="M101 122Q120 136 139 122Q136 132 120 135Q104 132 101 122Z" fill="#fff" stroke="${c}" stroke-width="2"/>`;
    case 'neutral': return `<path d="M106 126H134" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    case 'open-smile': return `<path d="M101 122Q120 138 139 122Q136 137 120 140Q104 137 101 122Z" fill="#9E4A4F" stroke="${c}" stroke-width="2"/>`;
    case 'smirk': return `<path d="M104 126Q121 133 137 121" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M101 122Q120 134 139 122" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
}
function facialHairSvg(style: string, hairColor: string) {
  const c = shiftHex(hairColor, -6), dark = shiftHex(hairColor, -20);
  switch (style) {
    case 'stubble': return `<path d="M92 117Q120 132 148 117" stroke="${alpha(c,0.65)}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M98 113Q120 123 142 113" stroke="${alpha(dark,0.45)}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    case 'mustache': return `<path d="M100 113Q111 105 120 111Q129 105 140 113Q131 120 120 118Q109 120 100 113Z" fill="${c}"/>`;
    case 'goatee': return `<path d="M101 113Q111 105 120 111Q129 105 140 113Q132 120 120 118Q108 120 101 113Z" fill="${c}"/><path d="M110 122Q120 132 130 122Q129 142 120 145Q111 142 110 122Z" fill="${c}"/>`;
    case 'short-beard': return `<path d="M90 108Q90 134 103 143Q120 153 137 143Q150 134 150 108Q144 119 134 127Q120 133 106 127Q96 119 90 108Z" fill="${c}"/><path d="M99 111Q120 123 141 111" stroke="${alpha(dark,0.35)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'full-beard': return `<path d="M87 104Q88 142 104 155Q120 170 136 155Q152 142 153 104Q147 120 137 132Q120 143 103 132Q93 120 87 104Z" fill="${c}"/><path d="M98 112Q120 124 142 112" stroke="${alpha(dark,0.35)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M100 111Q111 103 120 109Q129 103 140 111Q131 117 120 116Q109 117 100 111Z" fill="${dark}"/>`;
    default: return '';
  }
}
function alpha(hex: string, opacity: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex;
  return `${hex}${Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, '0')}`;
}

function hairBack(style: string, color: string) {
  const dark = shiftHex(color, -18);
  switch (style) {
    case 'bro-flow': return `<path d="M70 66Q72 30 120 28Q168 30 170 66L166 162Q152 176 145 155L139 102H101L95 155Q88 176 74 162Z" fill="${color}"/>`;
    case 'man-bun': return `<circle cx="120" cy="28" r="17" fill="${dark}"/><path d="M71 68Q72 31 120 30Q168 31 169 68L160 110H80Z" fill="${color}"/>`;
    case 'bob': return `<path d="M66 68Q68 30 120 28Q172 30 174 70L167 152Q157 167 145 150L141 104H99L95 150Q83 167 73 152Z" fill="${color}"/>`;
    case 'layered-bob': return `<path d="M65 67Q69 28 120 28Q171 28 175 67Q176 103 165 123Q174 142 162 159L146 146L141 102H99L94 146L78 159Q66 142 75 123Q64 103 65 67Z" fill="${color}"/>`;
    case 'long-straight': return `<path d="M66 67Q69 27 120 26Q171 27 174 68L170 225Q154 229 145 209L141 103H99L95 209Q86 229 70 225Z" fill="${color}"/>`;
    case 'long-wavy': return `<path d="M66 67Q69 26 120 26Q171 26 174 68Q179 101 166 126Q180 154 166 182Q176 205 160 225L145 211Q152 185 141 161Q151 134 141 103H99Q89 133 99 160Q88 184 95 211L80 225Q64 205 74 182Q60 154 74 126Q61 101 66 67Z" fill="${color}"/>`;
    case 'ponytail': return `<path d="M69 68Q72 29 120 28Q166 28 171 68L160 108H80Z" fill="${color}"/><path d="M167 77Q199 94 184 150Q178 171 162 180Q171 140 160 112Z" fill="${dark}"/>`;
    case 'bun': return `<circle cx="120" cy="26" r="20" fill="${dark}"/><path d="M70 69Q72 30 120 29Q168 30 170 69L158 108H82Z" fill="${color}"/>`;
    case 'braids': return `<path d="M69 67Q72 29 120 28Q168 29 171 67L160 111H80Z" fill="${color}"/><path d="M82 104Q80 145 88 171Q95 197 88 224L76 224Q72 193 73 164Q74 135 76 106Z" fill="${dark}"/><path d="M158 104Q160 145 152 171Q145 197 152 224L164 224Q168 193 167 164Q166 135 164 106Z" fill="${dark}"/>`;
    case 'curly-bob': return `<path d="M66 66Q68 29 120 29Q172 29 174 67L165 148Q153 162 144 148L139 105H101L96 148Q87 162 75 148Z" fill="${color}"/><g fill="${dark}"><circle cx="84" cy="76" r="12"/><circle cx="101" cy="60" r="11"/><circle cx="120" cy="56" r="12"/><circle cx="139" cy="60" r="11"/><circle cx="156" cy="76" r="12"/></g>`;
    default: return '';
  }
}
function hairFront(style: string, color: string) {
  const dark = shiftHex(color, -20), hi = shiftHex(color, 20);
  switch (style) {
    case 'bald': return '';
    case 'buzz-cut': return `<path d="M77 68Q82 42 120 38Q158 42 163 68Q149 53 120 53Q91 53 77 68Z" fill="${color}"/>`;
    case 'short-textured': return `<path d="M74 70Q75 42 120 37Q165 42 166 70Q153 58 140 56Q128 48 120 56Q110 50 99 57Q88 58 74 70Z" fill="${color}"/><path d="M88 53Q96 46 104 52M111 49Q120 43 129 50M136 52Q144 46 152 52" stroke="${hi}" stroke-width="2.3" stroke-linecap="round" fill="none" opacity=".45"/>`;
    case 'side-part': return `<path d="M73 70Q74 41 120 37Q166 42 167 71Q153 53 135 49Q118 46 100 55Q86 59 73 70Z" fill="${color}"/><path d="M120 42Q114 49 112 59Q122 56 133 57" fill="${hi}" opacity=".28"/>`;
    case 'quiff': return `<path d="M72 72Q72 43 121 36Q167 42 169 73Q154 58 141 59Q151 47 150 34Q141 43 131 48Q122 35 108 31Q108 46 96 57Q85 58 72 72Z" fill="${color}"/>`;
    case 'waves': return `<path d="M73 71Q76 39 120 37Q164 40 167 71Q149 53 127 52Q131 48 130 42Q121 47 111 51Q103 47 96 48Q96 53 94 57Q83 58 73 71Z" fill="${color}"/><path d="M88 53Q96 48 104 54Q114 47 123 53Q133 47 143 53Q149 51 155 56" stroke="${hi}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".42"/>`;
    case 'curls': return `<g fill="${color}"><circle cx="86" cy="70" r="14"/><circle cx="102" cy="54" r="15"/><circle cx="120" cy="50" r="16"/><circle cx="138" cy="54" r="15"/><circle cx="154" cy="70" r="14"/></g>`;
    case 'afro': return `<g fill="${color}"><circle cx="120" cy="62" r="40"/><circle cx="87" cy="71" r="26"/><circle cx="153" cy="71" r="26"/><circle cx="99" cy="42" r="23"/><circle cx="141" cy="42" r="23"/><path d="M80 93Q120 76 160 93Q156 70 120 70Q84 70 80 93Z"/></g>`;
    case 'bro-flow': return `<path d="M74 69Q77 38 120 36Q163 38 166 69Q155 57 138 53Q123 52 109 57Q94 57 74 69Z" fill="${color}"/><path d="M80 69Q84 89 77 110" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/><path d="M160 69Q156 89 163 110" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>`;
    case 'man-bun': return `<path d="M74 71Q76 39 120 37Q164 39 166 71Q153 54 120 52Q87 54 74 71Z" fill="${color}"/>`;
    case 'pixie': return `<path d="M74 72Q77 42 120 37Q163 41 166 71Q152 58 138 53Q142 49 142 42Q132 47 122 50Q109 45 96 53Q85 58 74 72Z" fill="${color}"/>`;
    case 'bob': return `<path d="M74 72Q77 41 120 37Q163 41 166 72Q153 58 140 56Q126 48 120 49Q114 48 100 56Q87 58 74 72Z" fill="${color}"/>`;
    case 'layered-bob': return `<path d="M73 73Q76 42 120 38Q164 42 167 73Q154 58 139 54Q142 49 140 43Q128 48 120 50Q112 48 100 54Q86 58 73 73Z" fill="${color}"/>`;
    case 'long-straight': return `<path d="M73 73Q76 41 120 37Q164 41 167 73Q154 58 139 56Q128 48 120 49Q112 48 101 56Q86 58 73 73Z" fill="${color}"/>`;
    case 'long-wavy': return `<path d="M73 73Q76 41 120 37Q164 41 167 73Q154 57 141 55Q145 47 142 43Q131 48 120 50Q109 48 98 55Q85 57 73 73Z" fill="${color}"/>`;
    case 'ponytail': return `<path d="M74 72Q77 41 120 37Q163 41 166 72Q151 58 136 56Q122 47 120 48Q118 47 104 56Q89 58 74 72Z" fill="${color}"/>`;
    case 'bun': return `<path d="M74 72Q77 41 120 37Q163 41 166 72Q151 58 136 56Q122 47 120 48Q118 47 104 56Q89 58 74 72Z" fill="${color}"/>`;
    case 'braids': return `<path d="M73 72Q76 41 120 37Q164 41 167 72Q152 58 137 55Q129 47 120 49Q111 47 103 55Q88 58 73 72Z" fill="${color}"/>`;
    case 'curly-bob': return `<g fill="${color}"><circle cx="88" cy="72" r="12"/><circle cx="104" cy="57" r="12"/><circle cx="120" cy="53" r="13"/><circle cx="136" cy="57" r="12"/><circle cx="152" cy="72" r="12"/></g>`;
    default: return '';
  }
}

function armsSvg(style: string, shirtColor: string, skinColor: string) {
  const shortSleeve = ['crew-tee','v-neck','polo','jersey','tank'].includes(style);
  if (style === 'tank') return `<path d="M74 157Q58 154 50 169L51 218Q52 226 60 226H72L81 168Z" fill="${shirtColor}"/><circle cx="58" cy="226" r="13" fill="${skinColor}"/><path d="M166 157Q182 154 190 169L189 218Q188 226 180 226H168L159 168Z" fill="${shirtColor}"/><circle cx="182" cy="226" r="13" fill="${skinColor}"/>`;
  if (!shortSleeve) return `<path d="M74 157Q55 154 47 170L53 188L76 181Z" fill="${shirtColor}"/><rect x="50" y="181" width="25" height="44" rx="12" fill="${shirtColor}"/><circle cx="62" cy="226" r="12.5" fill="${skinColor}"/><path d="M166 157Q185 154 193 170L187 188L164 181Z" fill="${shirtColor}"/><rect x="165" y="181" width="25" height="44" rx="12" fill="${shirtColor}"/><circle cx="178" cy="226" r="12.5" fill="${skinColor}"/>`;
  return `<path d="M74 157Q55 154 47 170L53 188L76 181Z" fill="${shirtColor}"/><rect x="50" y="181" width="25" height="34" rx="12" fill="${skinColor}"/><circle cx="62" cy="216" r="12.5" fill="${skinColor}"/><path d="M166 157Q185 154 193 170L187 188L164 181Z" fill="${shirtColor}"/><rect x="165" y="181" width="25" height="34" rx="12" fill="${skinColor}"/><circle cx="178" cy="216" r="12.5" fill="${skinColor}"/>`;
}
function shirtSvg(style: string, shirtColor: string, skinColor: string) {
  const shade = shiftHex(shirtColor, -20), light = shiftHex(shirtColor, 18);
  const body = `<path d="M76 151Q91 145 103 145H137Q149 145 164 151L160 237H80Z" fill="${shirtColor}"/>`;
  switch (style) {
    case 'v-neck': return `${body}<path d="M103 146L120 171L137 146Z" fill="${skinColor}"/>`;
    case 'polo': return `${body}<path d="M101 146L120 162L139 146L132 169L120 161L108 169Z" fill="${light}"/><path d="M120 161V188" stroke="${shade}" stroke-width="3"/><circle cx="124" cy="175" r="2" fill="${shade}"/>`;
    case 'button-up': return `${body}<path d="M103 146L120 162L109 175L96 151ZM137 146L120 162L131 175L144 151Z" fill="${light}"/><path d="M120 160V236" stroke="${shade}" stroke-width="2"/><g fill="${shade}"><circle cx="125" cy="180" r="2"/><circle cx="125" cy="199" r="2"/><circle cx="125" cy="218" r="2"/></g>`;
    case 'hoodie': return `${body}<path d="M95 148Q120 132 145 148L137 171Q120 159 103 171Z" fill="${shade}"/><path d="M108 163L113 184M132 163L127 184" stroke="${light}" stroke-width="2.4"/><path d="M101 209Q120 201 139 209L136 228H104Z" fill="${shade}"/>`;
    case 'sweatshirt': return `${body}<rect x="82" y="226" width="76" height="11" rx="5" fill="${shade}"/><path d="M102 147Q120 159 138 147" stroke="${shade}" stroke-width="7" fill="none"/>`;
    case 'sweater': return `${body}<path d="M102 148Q120 162 138 148" stroke="${light}" stroke-width="5" fill="none"/><path d="M88 172H152M88 194H152M88 216H152" stroke="${light}" stroke-width="2" opacity=".32"/>`;
    case 'jersey': return `<path d="M88 148H101Q120 160 139 148H152L164 161L157 237H83L76 161Z" fill="${shirtColor}"/><path d="M92 149Q120 174 148 149" stroke="${light}" stroke-width="5" fill="none"/><path d="M88 154L84 228M152 154L156 228" stroke="${light}" stroke-width="4" opacity=".65"/>`;
    case 'tank': return `<path d="M93 147H105Q120 159 135 147H147L159 237H81Z" fill="${shirtColor}"/><path d="M103 148Q120 169 137 148" fill="${skinColor}"/>`;
    default: return `${body}<path d="M101 147Q120 159 139 147" stroke="${shade}" stroke-width="5" fill="none" opacity=".55"/>`;
  }
}
function lowerBodySvg(style: string, pantsColor: string, skinColor: string) {
  const shade = shiftHex(pantsColor, -22), light = shiftHex(pantsColor, 20);
  switch (style) {
    case 'chinos': return `<path d="M82 235H118L114 318H80Z" fill="${pantsColor}"/><path d="M122 235H158L160 318H126Z" fill="${pantsColor}"/><path d="M86 247L108 248M132 248L154 247" stroke="${shade}" stroke-width="2"/>`;
    case 'joggers': return `<path d="M82 235H118L111 310H83Z" fill="${pantsColor}"/><path d="M122 235H158L157 310H129Z" fill="${pantsColor}"/><rect x="82" y="304" width="30" height="12" rx="5" fill="${shade}"/><rect x="128" y="304" width="30" height="12" rx="5" fill="${shade}"/><path d="M105 239Q120 248 135 239" stroke="${light}" stroke-width="2" fill="none"/>`;
    case 'shorts': return `<path d="M81 235H119L115 278H78Z" fill="${pantsColor}"/><path d="M121 235H159L162 278H125Z" fill="${pantsColor}"/><rect x="83" y="274" width="31" height="43" rx="12" fill="${skinColor}"/><rect x="126" y="274" width="31" height="43" rx="12" fill="${skinColor}"/>`;
    case 'wide-leg': return `<path d="M79 235H119L116 318H71Z" fill="${pantsColor}"/><path d="M121 235H161L169 318H124Z" fill="${pantsColor}"/><path d="M120 239V311" stroke="${shade}" stroke-width="2" opacity=".55"/>`;
    case 'skirt': return `<path d="M84 235H156L170 291H70Z" fill="${pantsColor}"/><path d="M88 247Q120 255 152 247" stroke="${light}" stroke-width="3" fill="none" opacity=".55"/><rect x="88" y="286" width="26" height="33" rx="11" fill="${skinColor}"/><rect x="126" y="286" width="26" height="33" rx="11" fill="${skinColor}"/>`;
    default: return `<path d="M81 235H119L115 318H79Z" fill="${pantsColor}"/><path d="M121 235H159L161 318H125Z" fill="${pantsColor}"/><path d="M120 239V314" stroke="${shade}" stroke-width="2"/><path d="M84 252H111M129 252H156" stroke="${light}" stroke-width="2" opacity=".5"/>`;
  }
}
function shoesSvg(style: string, color: string) {
  const shade = shiftHex(color, -28), light = shiftHex(color, 28);
  switch (style) {
    case 'high-tops': return `<path d="M72 302H114V337H68Q61 333 66 326L77 319Z" fill="${color}"/><path d="M126 302H168L174 326Q179 333 172 337H126Z" fill="${color}"/><path d="M72 329H113M127 329H171" stroke="${light}" stroke-width="4"/><path d="M82 309L104 319M158 309L136 319" stroke="${shade}" stroke-width="2"/>`;
    case 'boots': return `<path d="M75 294H113V337H66Q61 330 69 324L77 317Z" fill="${color}"/><path d="M127 294H165L163 317L171 324Q179 330 174 337H127Z" fill="${color}"/><path d="M72 326H112M128 326H168" stroke="${shade}" stroke-width="4"/>`;
    case 'loafers': return `<path d="M78 315H113L116 336H66Q61 328 72 322Z" fill="${color}"/><path d="M127 315H162L168 322Q179 328 174 336H124Z" fill="${color}"/><path d="M79 322H105M135 322H161" stroke="${light}" stroke-width="3"/>`;
    default: return `<path d="M77 315H113L117 337H65Q60 329 72 322Z" fill="${color}"/><path d="M127 315H163L168 322Q180 329 175 337H123Z" fill="${color}"/><path d="M66 331H116M124 331H174" stroke="${light}" stroke-width="4"/><path d="M80 320L104 328M160 320L136 328" stroke="${shade}" stroke-width="2"/>`;
  }
}
function accessorySvg(accessory: string, shirtColor: string) {
  const dark = '#23262B', accent = shirtColor, light = shiftHex(shirtColor, 30);
  switch (accessory) {
    case 'glasses': return `<rect x="83" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><rect x="129" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M71 86L83 88M157 88L169 86" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'round-glasses': return `<circle cx="97" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><circle cx="143" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M72 85L83 87M157 87L168 85" stroke="${dark}" stroke-width="3"/>`;
    case 'sunglasses': return `<path d="M81 80H111L108 99Q97 106 86 99Z" fill="${dark}"/><path d="M129 80H159L154 99Q143 106 132 99Z" fill="${dark}"/><path d="M111 87H129M69 83L81 85M159 85L171 83" stroke="${dark}" stroke-width="3"/>`;
    case 'cap': return `<path d="M58 54Q66 20 120 20Q174 20 182 54L182 62H58Z" fill="${accent}"/><path d="M58 60Q120 49 182 60" stroke="${shiftHex(accent,-18)}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M108 61Q148 54 186 66Q155 77 116 70Z" fill="${shiftHex(accent,-18)}"/><path d="M88 33Q120 24 152 33" stroke="${light}" stroke-width="3" fill="none" opacity=".55"/>`;
    case 'beanie': return `<path d="M61 58Q65 16 120 16Q175 16 179 58Z" fill="${accent}"/><rect x="58" y="52" width="124" height="22" rx="10" fill="${shiftHex(accent,-18)}"/><path d="M89 33H151" stroke="${light}" stroke-width="3" opacity=".45"/>`;
    case 'headband': return `<path d="M62 63Q120 45 178 63" stroke="${accent}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    case 'earrings': return `<circle cx="71" cy="109" r="4.5" fill="#D7B44B"/><circle cx="169" cy="109" r="4.5" fill="#D7B44B"/><circle cx="71" cy="116" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/><circle cx="169" cy="116" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/>`;
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
  const resolved = constrainAvatarSpec(spec, 0);
  const frame = svgFrame(focus);
  const { gender, skinColor, hairStyle, hairColor, eyeType, eyeColor, eyebrowStyle, mouthType, facialHair, shirtStyle, shirtColor, bottomStyle, pantsColor, shoeStyle, shoeColor, accessory } = resolved;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame.viewBox}" width="${frame.width}" height="${frame.height}" preserveAspectRatio="xMidYMid meet">
  ${lowerBodySvg(bottomStyle, pantsColor, skinColor)}
  ${shoesSvg(shoeStyle, shoeColor)}
  ${hairBack(hairStyle, hairColor)}
  ${armsSvg(shirtStyle, shirtColor, skinColor)}
  ${shirtSvg(shirtStyle, shirtColor, skinColor)}
  ${neckSvg(skinColor)}
  ${earSvg(skinColor)}
  ${faceShape(gender, skinColor)}
  ${eyebrowSvg(eyebrowStyle, hairColor)}
  ${eyeSvg(eyeType, eyeColor)}
  ${noseSvg(skinColor)}
  ${mouthSvg(mouthType)}
  ${gender === 'male' ? facialHairSvg(facialHair, hairColor) : ''}
  ${hairFront(hairStyle, hairColor)}
  ${accessorySvg(accessory, shirtColor)}
</svg>`.trim();
}
export function avatarToDataUri(spec: AvatarSpec, focus: AvatarFocus = 'full'): string { return `data:image/svg+xml;utf8,${encodeURIComponent(avatarToSvg(spec, focus))}`; }
export function getAvatarOptions(count = 48): AvatarSpec[] { return Array.from({ length: count }, (_, i) => defaultAvatarSpec(i * 17 + 3)); }
export type { AvatarSpec as default };
