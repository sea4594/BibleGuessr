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
  lipstickColor: string;
  freckles: string;
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
  '#A96035','#874526','#65331F','#47241A',
];
export const HAIR_COLORS = [
  '#171514','#2C211D','#4A2E22','#6A4028','#8A5433','#A95D35',
  '#C98A4A','#E4BD72','#F0D79A','#A83E32',
];
export const MALE_HAIR_STYLES = ['bald','buzz-cut','short-textured','side-part','quiff','waves','curls','afro'] as const;
export const FEMALE_HAIR_STYLES = ['short-textured','curls','afro','bob','long-straight','long-wavy','ponytail','bun'] as const;
export const HAIR_STYLES = [...MALE_HAIR_STYLES, ...FEMALE_HAIR_STYLES] as const;
export const EYE_TYPES = ['classic','almond','round','relaxed','happy','wink'] as const;
export const EYE_COLORS = ['#2A211D','#5A371E','#81562A','#456C45','#47769C','#6B5B90'] as const;
export const EYEBROW_STYLES = ['natural','straight','soft-arch','bold'] as const;
export const MOUTH_TYPES = ['soft-smile','smile','grin','neutral','open-smile','smirk'] as const;
export const FEMALE_MOUTH_TYPES = [...MOUTH_TYPES,'lipstick-smile','lipstick-pout'] as const;
export const LIPSTICK_COLORS = ['#9B2C3D','#C7445A','#D96B7C','#7D2941','#A64A69','#B35B43'] as const;
export const FACIAL_HAIR = ['none','stubble','mustache','goatee','short-beard','full-beard'] as const;
export const FRECKLE_OPTIONS = ['none','freckles'] as const;
export const MALE_SHIRT_STYLES = ['crew-tee','v-neck','polo','button-up','hoodie','sweatshirt','sweater','jersey','tank'] as const;
export const FEMALE_SHIRT_STYLES = ['fitted-tee','square-neck','wrap-top','peplum','blouse','cardigan','sweater','tank'] as const;
export const SHIRT_STYLES = [...MALE_SHIRT_STYLES, ...FEMALE_SHIRT_STYLES] as const;
export const SHIRT_COLORS = [
  '#3159C7','#4377E8','#1D8A68','#46A56B','#0F8496','#7A4FC2','#A94EAA',
  '#D2554D','#E77835','#E5A92F','#D8C9A5','#F1EEE8','#67707C','#252A31',
] as const;
export const MALE_BOTTOM_STYLES = ['jeans','chinos','joggers','shorts','wide-leg'] as const;
export const FEMALE_BOTTOM_STYLES = ['skinny-jeans','straight-jeans','joggers','tailored-shorts','wide-leg','skirt'] as const;
export const BOTTOM_STYLES = FEMALE_BOTTOM_STYLES;
export const PANTS_COLORS = [
  '#335F8A','#5E86AD','#90AEC7','#263C59','#4F5968','#7A7167',
  '#B89B71','#D3BD98','#6E7951','#A76347','#8A556A','#597F82',
] as const;
export const MALE_SHOE_STYLES = ['sneakers','high-tops','boots','loafers'] as const;
export const FEMALE_SHOE_STYLES = ['sneakers','ankle-boots','flats','mary-janes'] as const;
export const SHOE_STYLES = [...MALE_SHOE_STYLES, ...FEMALE_SHOE_STYLES] as const;
export const SHOE_COLORS = ['#F4F2EC','#20242A','#4E5662','#72513A','#A85A3C','#C94C4C','#3D67B7','#4B8463'] as const;
export const ACCESSORIES = ['none','glasses','round-glasses','sunglasses','cap','beanie','headband','earrings'] as const;

export type AvatarFocus = 'full' | 'head' | 'torso' | 'bottom';
export type AvatarGroup = 'face' | 'hair' | 'outfit' | 'extras';

export type AvatarAttribute = { key: keyof AvatarSpec; label: string; type: 'color' | 'style'; group: AvatarGroup; options: readonly string[]; focus: AvatarFocus; };

export function getHairStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_HAIR_STYLES] : [...MALE_HAIR_STYLES]; }
export function getBottomStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_BOTTOM_STYLES] : [...MALE_BOTTOM_STYLES]; }
export function getShirtStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_SHIRT_STYLES] : [...MALE_SHIRT_STYLES]; }
export function getShoeStyleOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_SHOE_STYLES] : [...MALE_SHOE_STYLES]; }
export function getMouthTypeOptions(gender: AvatarGender) { return gender === 'female' ? [...FEMALE_MOUTH_TYPES] : [...MOUTH_TYPES]; }
export function getFacialHairOptions(gender: AvatarGender) { return gender === 'female' ? ['none'] : [...FACIAL_HAIR]; }
export function getAvatarAttributes(gender: AvatarGender, mouthType = ''): AvatarAttribute[] {
  return [
    { key: 'skinColor', label: 'Skin tone', type: 'color', group: 'face', options: SKIN_OPTIONS, focus: 'head' },
    { key: 'eyeType', label: 'Eyes', type: 'style', group: 'face', options: EYE_TYPES, focus: 'head' },
    { key: 'eyeColor', label: 'Eye color', type: 'color', group: 'face', options: EYE_COLORS, focus: 'head' },
    { key: 'eyebrowStyle', label: 'Eyebrows', type: 'style', group: 'face', options: EYEBROW_STYLES, focus: 'head' },
    { key: 'mouthType', label: 'Expression', type: 'style', group: 'face', options: getMouthTypeOptions(gender), focus: 'head' },
    ...(gender === 'female' && mouthType.startsWith('lipstick-') ? [{ key: 'lipstickColor', label: 'Lipstick color', type: 'color', group: 'face', options: LIPSTICK_COLORS, focus: 'head' } as AvatarAttribute] : []),
    ...(gender === 'male' ? [{ key: 'facialHair', label: 'Facial hair', type: 'style', group: 'face', options: FACIAL_HAIR, focus: 'head' } as AvatarAttribute] : []),
    { key: 'hairStyle', label: 'Hair style', type: 'style', group: 'hair', options: getHairStyleOptions(gender), focus: 'head' },
    { key: 'hairColor', label: 'Hair color', type: 'color', group: 'hair', options: HAIR_COLORS, focus: 'head' },
    { key: 'shirtStyle', label: 'Top', type: 'style', group: 'outfit', options: getShirtStyleOptions(gender), focus: 'torso' },
    { key: 'shirtColor', label: 'Top color', type: 'color', group: 'outfit', options: SHIRT_COLORS, focus: 'torso' },
    { key: 'bottomStyle', label: 'Bottoms', type: 'style', group: 'outfit', options: getBottomStyleOptions(gender), focus: 'bottom' },
    { key: 'pantsColor', label: 'Bottom color', type: 'color', group: 'outfit', options: PANTS_COLORS, focus: 'bottom' },
    { key: 'shoeStyle', label: 'Shoes', type: 'style', group: 'outfit', options: getShoeStyleOptions(gender), focus: 'bottom' },
    { key: 'shoeColor', label: 'Shoe color', type: 'color', group: 'outfit', options: SHOE_COLORS, focus: 'bottom' },
    { key: 'freckles', label: 'Freckles', type: 'style', group: 'extras', options: FRECKLE_OPTIONS, focus: 'head' },
    { key: 'accessory', label: 'Accessory', type: 'style', group: 'extras', options: ACCESSORIES, focus: 'head' },
  ];
}
export const AVATAR_ATTRIBUTES = getAvatarAttributes('male');

const OPTION_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female',
  'buzz-cut': 'Buzz cut', 'short-textured': 'Short texture', 'side-part': 'Side part',
  'long-straight': 'Long straight', 'long-wavy': 'Long waves',
  classic: 'Classic', almond: 'Almond', round: 'Round', relaxed: 'Relaxed', happy: 'Happy', wink: 'Wink',
  natural: 'Natural', straight: 'Straight', 'soft-arch': 'Soft arch', bold: 'Bold',
  'soft-smile': 'Soft smile', smile: 'Smile', grin: 'Grin', neutral: 'Neutral', 'open-smile': 'Open smile', smirk: 'Smirk', 'lipstick-smile': 'Lipstick smile', 'lipstick-pout': 'Lipstick pout',
  none: 'None', freckles: 'Freckles', stubble: 'Stubble', mustache: 'Mustache', goatee: 'Goatee', 'short-beard': 'Short beard', 'full-beard': 'Full beard',
  'crew-tee': 'Crew tee', 'v-neck': 'V-neck', polo: 'Polo', 'button-up': 'Button-up', hoodie: 'Hoodie',
  sweatshirt: 'Sweatshirt', sweater: 'Sweater', jersey: 'Jersey', tank: 'Tank', 'fitted-tee': 'Fitted tee', 'square-neck': 'Square neck', 'wrap-top': 'Wrap top', peplum: 'Peplum top', blouse: 'Blouse', cardigan: 'Cardigan',
  jeans: 'Jeans', chinos: 'Chinos', joggers: 'Joggers', shorts: 'Shorts', 'wide-leg': 'Wide leg', skirt: 'Skirt', 'skinny-jeans': 'Slim jeans', 'straight-jeans': 'Straight jeans', 'tailored-shorts': 'Tailored shorts',
  sneakers: 'Sneakers', 'high-tops': 'High-tops', boots: 'Boots', loafers: 'Loafers', 'ankle-boots': 'Ankle boots', flats: 'Flats', 'mary-janes': 'Mary Janes',
  glasses: 'Glasses', 'round-glasses': 'Round glasses', sunglasses: 'Sunglasses', cap: 'Cap', beanie: 'Beanie', headband: 'Headband', earrings: 'Earrings',
  bald: 'Bald', quiff: 'Quiff', waves: 'Waves', curls: 'Curls', afro: 'Afro', bob: 'Bob', ponytail: 'Ponytail', bun: 'Bun',
};
export function avatarOptionLabel(value: string) {
  return OPTION_LABELS[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function pick<T>(items: readonly T[], seed: number, divisor: number): T {
  return items[Math.floor(seed / divisor) % items.length];
}
function choose<T>(items: readonly T[]): T { return items[Math.floor(Math.random() * items.length)]; }

function inferGender(source: Partial<AvatarSpec>, seed = 0): AvatarGender {
  if (source.gender === 'male' || source.gender === 'female') return source.gender;
  if (source.bottomStyle === 'skirt') return 'female';
  if (typeof source.facialHair === 'string' && source.facialHair !== 'none') return 'male';
  if (['bob','long-straight','long-wavy','ponytail','bun'].includes(String(source.hairStyle ?? ''))) return 'female';
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
    mouthType: pick(getMouthTypeOptions(gender), safeSeed, 17),
    lipstickColor: pick(LIPSTICK_COLORS, safeSeed, 18),
    freckles: 'none',
    facialHair: gender === 'male' ? pick(FACIAL_HAIR, safeSeed, 19) : 'none',
    shirtStyle: pick(getShirtStyleOptions(gender), safeSeed, 23),
    shirtColor: pick(SHIRT_COLORS, safeSeed, 29),
    bottomStyle: pick(getBottomStyleOptions(gender), safeSeed, 31),
    pantsColor: pick(PANTS_COLORS, safeSeed, 37),
    shoeStyle: pick(getShoeStyleOptions(gender), safeSeed, 41),
    shoeColor: pick(SHOE_COLORS, safeSeed, 43),
    accessory: pick(ACCESSORIES, safeSeed, 47),
  };
  const incoming = Object.fromEntries(Object.entries(spec).filter(([, value]) => typeof value === 'string')) as Partial<AvatarSpec>;
  const next = { ...base, ...incoming, gender } as AvatarSpec;

  if (gender === 'female') {
    const shirtMap: Record<string, string> = {
      'crew-tee': 'fitted-tee', 'v-neck': 'square-neck', polo: 'peplum', 'button-up': 'blouse',
      hoodie: 'cardigan', sweatshirt: 'sweater', jersey: 'fitted-tee', 'scoop-neck': 'square-neck', 'cropped-hoodie': 'cardigan',
    };
    const bottomMap: Record<string, string> = { jeans: 'skinny-jeans', chinos: 'straight-jeans', shorts: 'tailored-shorts' };
    const shoeMap: Record<string, string> = { 'high-tops': 'sneakers', boots: 'ankle-boots', loafers: 'flats' };
    next.shirtStyle = shirtMap[next.shirtStyle] ?? next.shirtStyle;
    next.bottomStyle = bottomMap[next.bottomStyle] ?? next.bottomStyle;
    next.shoeStyle = shoeMap[next.shoeStyle] ?? next.shoeStyle;
    next.facialHair = 'none';
  } else {
    const shirtMap: Record<string, string> = {
      'fitted-tee': 'crew-tee', 'scoop-neck': 'v-neck', 'square-neck': 'v-neck', 'wrap-top': 'v-neck', peplum: 'sweater', blouse: 'button-up', cardigan: 'sweater', 'cropped-hoodie': 'hoodie',
    };
    const bottomMap: Record<string, string> = { 'skinny-jeans': 'jeans', 'straight-jeans': 'chinos', 'tailored-shorts': 'shorts', skirt: 'chinos' };
    const shoeMap: Record<string, string> = { 'ankle-boots': 'boots', flats: 'loafers', 'mary-janes': 'loafers' };
    next.shirtStyle = shirtMap[next.shirtStyle] ?? next.shirtStyle;
    next.bottomStyle = bottomMap[next.bottomStyle] ?? next.bottomStyle;
    next.shoeStyle = shoeMap[next.shoeStyle] ?? next.shoeStyle;
    if (next.mouthType.startsWith('lipstick-')) next.mouthType = 'soft-smile';
  }

  if (next.skinColor === '#2F1914') next.skinColor = '#47241A';
  if (!SKIN_OPTIONS.includes(next.skinColor as never)) next.skinColor = base.skinColor;
  if (!getHairStyleOptions(gender).includes(next.hairStyle as never)) next.hairStyle = base.hairStyle;
  if (!getMouthTypeOptions(gender).includes(next.mouthType as never)) next.mouthType = base.mouthType;
  if (!LIPSTICK_COLORS.includes(next.lipstickColor as never)) next.lipstickColor = base.lipstickColor;
  if (!FRECKLE_OPTIONS.includes(next.freckles as never)) next.freckles = base.freckles;
  if (!getShirtStyleOptions(gender).includes(next.shirtStyle as never)) next.shirtStyle = base.shirtStyle;
  if (!getBottomStyleOptions(gender).includes(next.bottomStyle as never)) next.bottomStyle = base.bottomStyle;
  if (!getShoeStyleOptions(gender).includes(next.shoeStyle as never)) next.shoeStyle = base.shoeStyle;
  if (!getFacialHairOptions(gender).includes(next.facialHair as never)) next.facialHair = base.facialHair;
  if (typeof spec.background === 'string') next.background = spec.background;
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
    eyeType: choose(EYE_TYPES), eyeColor: choose(EYE_COLORS), eyebrowStyle: choose(EYEBROW_STYLES), mouthType: choose(getMouthTypeOptions(resolvedGender)), lipstickColor: choose(LIPSTICK_COLORS), freckles: choose(FRECKLE_OPTIONS),
    facialHair: resolvedGender === 'male' ? choose(FACIAL_HAIR) : 'none', shirtStyle: choose(getShirtStyleOptions(resolvedGender)), shirtColor: choose(SHIRT_COLORS),
    bottomStyle: choose(getBottomStyleOptions(resolvedGender)), pantsColor: choose(PANTS_COLORS), shoeStyle: choose(getShoeStyleOptions(resolvedGender)), shoeColor: choose(SHOE_COLORS), accessory: choose(ACCESSORIES),
  });
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
    case 'bob': return `<path d="M67 70Q68 27 120 27Q172 28 173 72L166 151Q153 166 145 147L140 103H100L95 149Q85 166 74 151Z" fill="${color}"/><path d="M94 96H146V157Q120 164 94 157Z" fill="${color}"/>`;
    case 'long':
    case 'long-straight': return `<path d="M67 68Q70 25 120 25Q170 26 173 69L169 214Q151 221 145 200L141 100H99L95 200Q89 221 71 214Z" fill="${color}"/><path d="M93 95H147V214Q120 223 93 214Z" fill="${color}"/>`;
    case 'long-wavy': return `<path d="M67 68Q70 24 120 25Q170 25 173 69Q178 104 166 129Q179 157 165 184Q176 206 160 223L144 207Q151 181 141 158Q151 131 141 103H99Q89 130 99 157Q89 181 96 207L80 223Q64 206 75 184Q61 157 74 129Q62 104 67 68Z" fill="${color}"/><path d="M93 96H147V216Q120 226 93 216Z" fill="${color}"/>`;
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
    case 'buzz-cut': return `<path d="M72 69Q75 34 120 30Q165 34 168 69Q151 47 120 47Q89 47 72 69Z" fill="${color}"/><path d="M84 49Q120 35 156 50" stroke="${hi}" stroke-width="3" fill="none" opacity=".38"/>`;
    case 'short':
    case 'crop':
    case 'short-textured': return `<path d="M73 69Q70 49 84 38L91 45Q95 31 108 37Q117 24 126 37Q140 28 144 43Q160 37 166 54L164 72Q145 56 121 57Q96 55 73 69Z" fill="${color}"/><path d="M91 48L102 41M117 43L126 36M140 48L151 43" stroke="${hi}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
    case 'side-part': return `<path d="M70 71Q72 35 118 31Q154 30 170 55Q149 48 128 54Q112 59 92 72Z" fill="${color}"/><path d="M125 36Q140 35 154 43" stroke="${hi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>`;
    case 'quiff': return `<path d="M72 72Q72 45 94 39Q97 20 119 31Q136 13 151 35Q169 37 170 65Q147 49 122 53Q99 51 72 72Z" fill="${color}"/><path d="M103 42Q126 27 150 42" stroke="${hi}" stroke-width="4" fill="none" opacity=".5"/>`;
    case 'waves': return `<path d="M70 71Q71 35 120 31Q168 34 170 69Q157 57 145 63Q133 69 121 61Q109 53 96 62Q84 70 70 71Z" fill="${color}"/><path d="M83 52Q96 44 108 51Q120 58 132 50Q144 43 157 51" stroke="${hi}" stroke-width="3" fill="none" opacity=".5"/>`;
    case 'curly':
    case 'curls': return `<g fill="${color}"><circle cx="82" cy="61" r="17"/><circle cx="101" cy="48" r="18"/><circle cx="120" cy="44" r="19"/><circle cx="139" cy="48" r="18"/><circle cx="158" cy="61" r="17"/></g><g fill="${hi}" opacity=".32"><circle cx="101" cy="48" r="5"/><circle cx="139" cy="48" r="5"/></g>`;
    case 'afro': return `<g fill="${color}"><circle cx="78" cy="64" r="18"/><circle cx="93" cy="49" r="20"/><circle cx="111" cy="42" r="21"/><circle cx="129" cy="42" r="21"/><circle cx="147" cy="49" r="20"/><circle cx="162" cy="64" r="18"/><path d="M78 68Q120 52 162 68L158 74Q120 62 82 74Z"/></g>`;
    case 'bob': return `<path d="M70 68Q75 28 120 29Q165 29 170 68Q151 52 128 52Q103 50 70 68Z" fill="${color}"/>`;
    case 'long':
    case 'long-straight': return `<path d="M69 68Q75 27 120 27Q164 27 171 67Q148 50 121 51Q94 50 69 68Z" fill="${color}"/>`;
    case 'long-wavy': return `<path d="M69 68Q74 26 120 27Q165 27 171 68Q153 50 132 54Q119 58 107 52Q88 49 69 68Z" fill="${color}"/><path d="M83 52Q96 45 107 51Q119 58 131 51Q144 44 157 52" stroke="${hi}" stroke-width="3" fill="none" opacity=".5"/>`;
    case 'ponytail': return `<path d="M70 69Q75 29 120 29Q164 29 170 68Q151 52 126 53Q102 51 70 69Z" fill="${color}"/>`;
    case 'bun': return `<path d="M71 69Q76 30 120 30Q164 30 169 69Q151 52 120 54Q90 52 71 69Z" fill="${color}"/>`;
    default: return '';
  }
}

function eyeSvg(type: string, color: string, gender: AvatarGender): string {
  const iris = (x: number, y: number, r = 5) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
  let eyes = '';
  switch (type) {
    case 'almond': eyes = `<path d="M86 89Q96 78 106 89Q96 99 86 89Z" fill="#fff"/><circle cx="96" cy="89" r="5" fill="${color}"/><path d="M134 89Q144 78 154 89Q144 99 134 89Z" fill="#fff"/><circle cx="144" cy="89" r="5" fill="${color}"/>`; break;
    case 'round': eyes = `${iris(96,89,5.5)}${iris(144,89,5.5)}`; break;
    case 'relaxed': eyes = `<path d="M87 90Q96 84 105 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M135 90Q144 84 153 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`; break;
    case 'happy': eyes = `<path d="M87 91Q96 81 105 91" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M135 91Q144 81 153 91" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`; break;
    case 'wink': eyes = `${iris(96,89)}<path d="M135 90Q144 84 153 90" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`; break;
    default: eyes = `${iris(96,89)}${iris(144,89)}`;
  }
  if (gender !== 'female') return eyes;
  const lashes = `<path d="M86 84L81 80M88 81L85 76M154 84L159 80M152 81L155 76" stroke="#2B2322" stroke-width="2.2" stroke-linecap="round"/>`;
  return `${eyes}${lashes}`;
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

function mouthSvg(type: string, gender: AvatarGender, lipstickColor: string): string {
  const lip = '#8D474A', inner = '#5A2B30';
  if (gender === 'female' && type === 'lipstick-smile') {
    return `<path d="M104 120Q120 128 136 120Q130 134 120 134Q110 134 104 120Z" fill="${lipstickColor}"/><path d="M106 121Q120 126 134 121" stroke="${shiftHex(lipstickColor,-28)}" stroke-width="1.6" fill="none"/>`;
  }
  if (gender === 'female' && type === 'lipstick-pout') {
    return `<path d="M106 122Q113 116 120 121Q127 116 134 122Q128 129 120 128Q112 129 106 122Z" fill="${lipstickColor}"/><path d="M108 123Q120 126 132 123" stroke="${shiftHex(lipstickColor,-30)}" stroke-width="1.5" fill="none"/>`;
  }
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
  const c = shiftHex(color, -8), dark = shiftHex(color, -22);
  switch (style) {
    case 'stubble': return `<g fill="${c}" opacity=".72"><circle cx="88" cy="111" r="1.25"/><circle cx="93" cy="117" r="1.2"/><circle cx="96" cy="124" r="1.3"/><circle cx="101" cy="130" r="1.2"/><circle cx="106" cy="136" r="1.3"/><circle cx="113" cy="140" r="1.25"/><circle cx="120" cy="142" r="1.35"/><circle cx="127" cy="140" r="1.25"/><circle cx="134" cy="136" r="1.3"/><circle cx="139" cy="130" r="1.2"/><circle cx="144" cy="124" r="1.3"/><circle cx="147" cy="117" r="1.2"/><circle cx="152" cy="111" r="1.25"/><circle cx="99" cy="118" r="1.05"/><circle cx="106" cy="124" r="1.05"/><circle cx="113" cy="130" r="1.05"/><circle cx="127" cy="130" r="1.05"/><circle cx="134" cy="124" r="1.05"/><circle cx="141" cy="118" r="1.05"/></g>`;
    case 'mustache': return `<path d="M101 115Q111 108 120 115Q129 108 139 115Q134 124 120 121Q106 124 101 115Z" fill="${c}"/>`;
    case 'goatee': return `<path d="M106 116Q120 109 134 116Q129 123 120 121Q111 123 106 116Z" fill="${c}"/><path d="M107 128Q120 139 133 128L129 147Q120 155 111 147Z" fill="${c}"/>`;
    case 'short-beard': return `<path d="M82 103C83 123 89 139 101 149C108 155 114 158 120 159C126 158 132 155 139 149C151 139 157 123 158 103C151 108 147 116 143 123C136 124 131 126 127 130C123 133 117 133 113 130C109 126 104 124 97 123C93 116 89 108 82 103Z" fill="${c}"/><path d="M99 113Q110 106 120 114Q130 106 141 113Q135 122 120 120Q105 122 99 113Z" fill="${dark}"/>`;
    case 'full-beard': return `<path d="M79 99C80 126 88 148 101 161C108 168 114 172 120 174C126 172 132 168 139 161C152 148 160 126 161 99C153 106 149 115 145 122C137 123 132 126 127 130C123 134 117 134 113 130C108 126 103 123 95 122C91 115 87 106 79 99Z" fill="${c}"/><path d="M98 112Q110 104 120 113Q130 104 142 112Q136 122 120 120Q104 122 98 112Z" fill="${dark}"/>`;
    default: return '';
  }
}
function armsSvg(style: string, shirtColor: string, skinColor: string, gender: AvatarGender): string {
  const longSleeve = ['hoodie','sweatshirt','sweater','button-up','blouse','cardigan','wrap-top'].includes(style);
  const female = gender === 'female';
  const xL = female ? 57 : 50, xR = female ? 166 : 165, armW = female ? 19 : 25, handR = female ? 10.5 : 12.5;
  if (style === 'tank') {
    return female
      ? `<path d="M101 151Q86 150 78 159Q69 170 67 191L66 214Q66 225 74 229Q82 228 83 217L84 187Q85 170 99 160Z" fill="${skinColor}"/><path d="M139 151Q154 150 162 159Q171 170 173 191L174 214Q174 225 166 229Q158 228 157 217L156 187Q155 170 141 160Z" fill="${skinColor}"/>`
      : `<path d="M102 151Q86 146 72 155Q58 166 57 191L57 214Q57 227 69 231Q81 228 82 215L83 186Q85 165 104 158Z" fill="${skinColor}"/><path d="M138 151Q154 146 168 155Q182 166 183 191L183 214Q183 227 171 231Q159 228 158 215L157 186Q155 165 136 158Z" fill="${skinColor}"/>`;
  }
  if (style === 'jersey') {
    return `<path d="M${female ? 80 : 74} 156Q${female ? 66 : 56} 153 ${female ? 57 : 48} 169L${female ? 61 : 53} 186L${female ? 81 : 76} 181Z" fill="${shirtColor}"/><rect x="${xL}" y="181" width="${armW}" height="44" rx="${female ? 9 : 12}" fill="${skinColor}"/><circle cx="${female ? 66.5 : 62}" cy="226" r="${handR}" fill="${skinColor}"/><path d="M${female ? 160 : 166} 156Q${female ? 174 : 184} 153 ${female ? 183 : 192} 169L${female ? 179 : 187} 186L${female ? 159 : 164} 181Z" fill="${shirtColor}"/><rect x="${xR}" y="181" width="${armW}" height="44" rx="${female ? 9 : 12}" fill="${skinColor}"/><circle cx="${female ? 173.5 : 178}" cy="226" r="${handR}" fill="${skinColor}"/>`;
  }
  if (longSleeve) {
    return `<path d="M${female ? 80 : 73} 157Q${female ? 65 : 58} 154 ${female ? 57 : 48} 170L${female ? 56 : 47} 218Q${female ? 57 : 48} 226 ${female ? 65 : 58} 226H${female ? 75 : 70}L${female ? 83 : 78} 166Z" fill="${shirtColor}"/><circle cx="${female ? 65 : 58}" cy="226" r="${female ? 10.5 : 13}" fill="${skinColor}"/><path d="M${female ? 160 : 167} 157Q${female ? 175 : 182} 154 ${female ? 183 : 192} 170L${female ? 184 : 193} 218Q${female ? 183 : 192} 226 ${female ? 175 : 182} 226H${female ? 165 : 170}L${female ? 157 : 162} 166Z" fill="${shirtColor}"/><circle cx="${female ? 175 : 182}" cy="226" r="${female ? 10.5 : 13}" fill="${skinColor}"/>`;
  }
  return `<path d="M${female ? 80 : 74} 156Q${female ? 66 : 56} 153 ${female ? 57 : 48} 169L${female ? 61 : 53} 186L${female ? 81 : 76} 181Z" fill="${shirtColor}"/><rect x="${xL}" y="181" width="${armW}" height="44" rx="${female ? 9 : 12}" fill="${skinColor}"/><circle cx="${female ? 66.5 : 62}" cy="226" r="${handR}" fill="${skinColor}"/><path d="M${female ? 160 : 166} 156Q${female ? 174 : 184} 153 ${female ? 183 : 192} 169L${female ? 179 : 187} 186L${female ? 159 : 164} 181Z" fill="${shirtColor}"/><rect x="${xR}" y="181" width="${armW}" height="44" rx="${female ? 9 : 12}" fill="${skinColor}"/><circle cx="${female ? 173.5 : 178}" cy="226" r="${handR}" fill="${skinColor}"/>`;
}
function shirtSvg(style: string, shirtColor: string, skinColor: string, gender: AvatarGender): string {
  const shade = shiftHex(shirtColor, -22), light = shiftHex(shirtColor, 22);
  const maleBody = `<path d="M76 151Q91 145 103 145H137Q149 145 164 151L160 237H80Z" fill="${shirtColor}"/>`;
  const femaleBody = `<path d="M83 151Q95 145 105 145H135Q145 145 157 151L154 184Q151 207 157 237H83Q89 207 86 184Z" fill="${shirtColor}"/>`;
  const body = gender === 'female' ? femaleBody : maleBody;
  switch (style) {
    case 'fitted-tee': return `${femaleBody}<path d="M103 147Q120 158 137 147" stroke="${shade}" stroke-width="4" fill="none" opacity=".5"/>`;
    case 'square-neck': return `${femaleBody}<path d="M104 146V160H136V146Q132 166 120 167Q108 166 104 146Z" fill="${skinColor}"/><path d="M104 160H136" stroke="${light}" stroke-width="2.5"/>`;
    case 'wrap-top': return `${femaleBody}<path d="M101 146L136 183" stroke="${light}" stroke-width="5"/><path d="M139 146L106 183" stroke="${shade}" stroke-width="3"/><path d="M91 206Q120 214 149 206" stroke="${light}" stroke-width="3" fill="none"/>`;
    case 'peplum': return `<path d="M84 151Q96 145 106 145H134Q144 145 156 151L153 201Q145 207 140 211L159 237H81L100 211Q95 207 87 201Z" fill="${shirtColor}"/><path d="M103 147Q120 164 137 147" stroke="${light}" stroke-width="4" fill="none"/><path d="M91 205Q120 216 149 205" stroke="${shade}" stroke-width="2.5" fill="none"/>`;
    case 'blouse': return `${femaleBody}<path d="M102 146Q120 164 138 146L133 170Q120 162 107 170Z" fill="${light}"/><path d="M120 162V232" stroke="${shade}" stroke-width="2"/><path d="M88 205Q120 216 152 205" stroke="${light}" stroke-width="3" fill="none" opacity=".7"/>`;
    case 'cardigan': return `${femaleBody}<path d="M104 146Q120 160 136 146" stroke="${light}" stroke-width="4" fill="none"/><path d="M120 151V237" stroke="${shade}" stroke-width="3"/><circle cx="125" cy="177" r="2" fill="${light}"/><circle cx="125" cy="197" r="2" fill="${light}"/><circle cx="125" cy="217" r="2" fill="${light}"/>`;
    case 'v-neck': return `${body}<path d="M103 146L120 169L137 146Z" fill="${skinColor}"/>`;
    case 'polo': return `${body}<path d="M101 146L120 161L139 146L132 168L120 160L108 168Z" fill="${light}"/><path d="M120 160V188" stroke="${shade}" stroke-width="3"/><circle cx="124" cy="174" r="2" fill="${shade}"/>`;
    case 'button-up': return `${body}<path d="M103 146L120 161L109 174L96 151ZM137 146L120 161L131 174L144 151Z" fill="${light}"/><path d="M120 160V236" stroke="${shade}" stroke-width="2"/><g fill="${shade}"><circle cx="125" cy="180" r="2"/><circle cx="125" cy="199" r="2"/><circle cx="125" cy="218" r="2"/></g>`;
    case 'hoodie': return `${body}<path d="M95 148Q120 132 145 148L137 171Q120 158 103 171Z" fill="${shade}"/><path d="M108 163L113 184M132 163L127 184" stroke="${light}" stroke-width="2.5"/><path d="M101 209Q120 201 139 209L136 228H104Z" fill="${shade}"/>`;
    case 'sweatshirt': return `${body}<rect x="82" y="226" width="76" height="11" rx="5" fill="${shade}"/><path d="M102 147Q120 159 138 147" stroke="${shade}" stroke-width="7" fill="none"/>`;
    case 'sweater': return `${body}<path d="M101 148Q120 163 139 148" stroke="${light}" stroke-width="5" fill="none"/><path d="M87 171H153M87 193H153M87 215H153" stroke="${light}" stroke-width="2" opacity=".32"/>`;
    case 'jersey': return `<path d="M88 148H101Q120 160 139 148H152L164 161L157 237H83L76 161Z" fill="${shirtColor}"/><path d="M92 149Q120 174 148 149" stroke="${light}" stroke-width="5" fill="none"/><path d="M88 154L84 228M152 154L156 228" stroke="${light}" stroke-width="4" opacity=".65"/>`;
    case 'tank': return gender === 'female'
      ? `<path d="M96 147H106Q120 159 134 147H144L154 237H86Z" fill="${shirtColor}"/><path d="M104 148Q120 168 136 148" fill="${skinColor}"/>`
      : `<path d="M76 151Q88 145 102 145H138Q152 145 164 151L162 237H78Z" fill="${shirtColor}"/><path d="M109 146Q120 158 131 146Q128 163 120 165Q112 163 109 146Z" fill="${skinColor}"/>`;
    default: return `${body}<path d="M101 147Q120 159 139 147" stroke="${shade}" stroke-width="5" fill="none" opacity=".55"/>`;
  }
}
function lowerBodySvg(style: string, pantsColor: string, skinColor: string, gender: AvatarGender): string {
  const shade = shiftHex(pantsColor, -22), light = shiftHex(pantsColor, 20);
  if (gender === 'female') {
    switch (style) {
      case 'skinny-jeans': return `<path d="M86 235H119L113 318H86Z" fill="${pantsColor}"/><path d="M121 235H154L154 318H127Z" fill="${pantsColor}"/><path d="M91 251H111M129 251H149" stroke="${light}" stroke-width="2" opacity=".5"/>`;
      case 'straight-jeans': return `<path d="M84 235H119L115 318H82Z" fill="${pantsColor}"/><path d="M121 235H156L158 318H125Z" fill="${pantsColor}"/>`;
      case 'joggers': return `<path d="M84 235H119L112 310H86Z" fill="${pantsColor}"/><path d="M121 235H156L154 310H128Z" fill="${pantsColor}"/><rect x="85" y="304" width="28" height="11" rx="5" fill="${shade}"/><rect x="127" y="304" width="28" height="11" rx="5" fill="${shade}"/><path d="M106 239Q120 248 134 239" stroke="${light}" stroke-width="2" fill="none"/>`;
      case 'tailored-shorts': return `<path d="M83 235H119L115 273H82Q77 255 83 235Z" fill="${pantsColor}"/><path d="M121 235H157Q163 255 158 273H125Z" fill="${pantsColor}"/><rect x="88" y="269" width="25" height="49" rx="10" fill="${skinColor}"/><rect x="127" y="269" width="25" height="49" rx="10" fill="${skinColor}"/><path d="M89 246H111M129 246H151" stroke="${light}" stroke-width="2" opacity=".55"/>`;
      case 'wide-leg': return `<path d="M82 235H119L115 318H75Z" fill="${pantsColor}"/><path d="M121 235H158L165 318H125Z" fill="${pantsColor}"/>`;
      case 'skirt': return `<path d="M86 235H154L166 290H74Z" fill="${pantsColor}"/><path d="M91 246Q120 253 149 246" stroke="${light}" stroke-width="3" fill="none" opacity=".6"/><rect x="90" y="286" width="23" height="33" rx="10" fill="${skinColor}"/><rect x="127" y="286" width="23" height="33" rx="10" fill="${skinColor}"/>`;
    }
  }
  switch (style) {
    case 'chinos': return `<path d="M82 235H118L114 318H80Z" fill="${pantsColor}"/><path d="M122 235H158L160 318H126Z" fill="${pantsColor}"/><path d="M86 247L108 248M132 248L154 247" stroke="${shade}" stroke-width="2"/>`;
    case 'joggers': return `<path d="M82 235H118L111 310H83Z" fill="${pantsColor}"/><path d="M122 235H158L157 310H129Z" fill="${pantsColor}"/><rect x="82" y="304" width="30" height="12" rx="5" fill="${shade}"/><rect x="128" y="304" width="30" height="12" rx="5" fill="${shade}"/><path d="M105 239Q120 248 135 239" stroke="${light}" stroke-width="2" fill="none"/>`;
    case 'shorts': return `<path d="M81 235H119L115 278H78Z" fill="${pantsColor}"/><path d="M121 235H159L162 278H125Z" fill="${pantsColor}"/><rect x="83" y="274" width="31" height="43" rx="12" fill="${skinColor}"/><rect x="126" y="274" width="31" height="43" rx="12" fill="${skinColor}"/>`;
    case 'wide-leg': return `<path d="M79 235H119L116 318H71Z" fill="${pantsColor}"/><path d="M121 235H161L169 318H124Z" fill="${pantsColor}"/>`;
    default: return `<path d="M81 235H119L115 318H79Z" fill="${pantsColor}"/><path d="M121 235H159L161 318H125Z" fill="${pantsColor}"/><path d="M84 252H111M129 252H156" stroke="${light}" stroke-width="2" opacity=".5"/>`;
  }
}
function shoesSvg(style: string, color: string, gender: AvatarGender): string {
  const shade = shiftHex(color, -28), light = shiftHex(color, 28);
  if (gender === 'female') {
    switch (style) {
      case 'ankle-boots': return `<path d="M80 299H112V337H70Q65 331 72 325L82 316Z" fill="${color}"/><path d="M128 299H160L158 316L168 325Q175 331 170 337H128Z" fill="${color}"/><path d="M75 329H111M129 329H165" stroke="${shade}" stroke-width="3"/>`;
      case 'flats': return `<path d="M84 320H112L115 336H72Q68 330 78 324Z" fill="${color}"/><path d="M128 320H156L162 324Q172 330 168 336H125Z" fill="${color}"/><path d="M83 323Q95 329 108 323M132 323Q145 329 157 323" stroke="${light}" stroke-width="2" fill="none"/>`;
      case 'mary-janes': return `<path d="M82 316H112L116 336H71Q67 329 78 323Z" fill="${color}"/><path d="M128 316H158L162 323Q173 329 169 336H124Z" fill="${color}"/><path d="M85 317L107 329M155 317L133 329" stroke="${shade}" stroke-width="3"/><circle cx="103" cy="327" r="2.5" fill="${light}"/><circle cx="137" cy="327" r="2.5" fill="${light}"/>`;
    }
  }
  switch (style) {
    case 'high-tops': return `<path d="M72 302H114V337H68Q61 333 66 326L77 319Z" fill="${color}"/><path d="M168 302H126V337H172Q179 333 174 326L163 319Z" fill="${color}"/><path d="M72 329H113M127 329H168" stroke="${light}" stroke-width="4"/><path d="M82 309L104 319M158 309L136 319" stroke="${shade}" stroke-width="2"/>`;
    case 'boots': return `<path d="M75 294H113V337H66Q61 330 69 324L77 317Z" fill="${color}"/><path d="M127 294H165L163 317L171 324Q179 330 174 337H127Z" fill="${color}"/><path d="M72 326H112M128 326H168" stroke="${shade}" stroke-width="4"/>`;
    case 'loafers': return `<path d="M78 315H113L116 336H66Q61 328 72 322Z" fill="${color}"/><path d="M127 315H162L168 322Q179 328 174 336H124Z" fill="${color}"/><path d="M79 322H105M135 322H161" stroke="${light}" stroke-width="3"/>`;
    default: return `<path d="M${gender === 'female' ? 80 : 77} 315H113L117 337H${gender === 'female' ? 70 : 65}Q${gender === 'female' ? 65 : 60} 329 ${gender === 'female' ? 75 : 72} 322Z" fill="${color}"/><path d="M127 315H${gender === 'female' ? 160 : 163}L${gender === 'female' ? 165 : 168} 322Q${gender === 'female' ? 175 : 180} 329 ${gender === 'female' ? 170 : 175} 337H123Z" fill="${color}"/><path d="M${gender === 'female' ? 71 : 66} 331H116M124 331H${gender === 'female' ? 169 : 174}" stroke="${light}" stroke-width="4"/><path d="M82 320L104 328M158 320L136 328" stroke="${shade}" stroke-width="2"/>`;
  }
}
function accessorySvg(accessory: string, shirtColor: string): string {
  const dark = '#23262B', accent = shirtColor, light = shiftHex(shirtColor, 30), accentDark = shiftHex(accent, -18);
  switch (accessory) {
    case 'glasses': return `<rect x="83" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><rect x="129" y="80" width="28" height="20" rx="7" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M71 86L83 88M157 88L169 86" stroke="${dark}" stroke-width="3" fill="none"/>`;
    case 'round-glasses': return `<circle cx="97" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><circle cx="143" cy="89" r="14" fill="none" stroke="${dark}" stroke-width="3"/><path d="M111 89H129M72 85L83 87M157 87L168 85" stroke="${dark}" stroke-width="3"/>`;
    case 'sunglasses': return `<path d="M81 80H111L108 99Q97 106 86 99Z" fill="${dark}"/><path d="M129 80H159L154 99Q143 106 132 99Z" fill="${dark}"/><path d="M111 87H129M69 83L81 85M159 85L171 83" stroke="${dark}" stroke-width="3"/>`;
    case 'cap': return `<path d="M72 57Q76 26 120 24Q164 26 168 57L165 62H75Z" fill="${accent}"/><path d="M105 59Q139 54 171 61Q164 69 137 71Q118 71 103 67Z" fill="${accentDark}"/><path d="M91 38Q120 29 149 38" stroke="${light}" stroke-width="2.5" fill="none" opacity=".5"/><path d="M120 25V56" stroke="${accentDark}" stroke-width="1.8" opacity=".3"/>`;
    case 'beanie': return `<path d="M69 58Q72 24 120 22Q168 24 171 58Z" fill="${accent}"/><rect x="67" y="52" width="106" height="19" rx="8" fill="${accentDark}"/><path d="M94 37H146" stroke="${light}" stroke-width="2.5" opacity=".42"/>`;
    case 'headband': return `<path d="M73 62Q120 46 167 62" stroke="${accent}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M76 61Q120 49 164 61" stroke="${light}" stroke-width="2" fill="none" opacity=".38"/>`;
    case 'earrings': return `<circle cx="71" cy="108" r="4.5" fill="#D7B44B"/><circle cx="169" cy="108" r="4.5" fill="#D7B44B"/><circle cx="71" cy="115" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/><circle cx="169" cy="115" r="3" fill="none" stroke="#D7B44B" stroke-width="2"/>`;
    default: return '';
  }
}
function frecklesSvg(freckles: string, skinColor: string): string {
  if (freckles !== 'freckles') return '';
  const c = alpha(shiftHex(skinColor, -58), .52);
  return `<g fill="${c}"><circle cx="91" cy="105" r="1.2"/><circle cx="96" cy="108" r="1"/><circle cx="101" cy="104" r="1.1"/><circle cx="106" cy="109" r=".95"/><circle cx="149" cy="105" r="1.2"/><circle cx="144" cy="108" r="1"/><circle cx="139" cy="104" r="1.1"/><circle cx="134" cy="109" r=".95"/></g>`;
}
function hatTempleHairSvg(style: string, color: string, accessory: string): string {
  if ((accessory !== 'cap' && accessory !== 'beanie') || style === 'bald') return '';
  return `<path d="M73 63Q79 61 85 65L84 104Q80 111 74 108Z" fill="${color}"/><path d="M167 63Q161 61 155 65L156 104Q160 111 166 108Z" fill="${color}"/>`;
}

function faceShapeSvg(skinColor: string): string {
  return `<ellipse cx="120" cy="87" rx="49" ry="54" fill="${skinColor}"/>`;
}
function neckSvg(gender: AvatarGender, skinColor: string): string {
  return gender === 'female'
    ? `<rect x="107" y="126" width="26" height="35" rx="11" fill="${skinColor}"/>`
    : `<rect x="104" y="126" width="32" height="35" rx="11" fill="${skinColor}"/>`;
}

function hairClipDefs(accessory: string): string {
  if (accessory === 'cap') return `<defs><clipPath id="hair-visible"><rect x="0" y="67" width="240" height="283"/></clipPath></defs>`;
  if (accessory === 'beanie') return `<defs><clipPath id="hair-visible"><rect x="0" y="72" width="240" height="278"/></clipPath></defs>`;
  return '';
}
function clippedHair(svg: string, accessory: string): string {
  return accessory === 'cap' || accessory === 'beanie' ? `<g clip-path="url(#hair-visible)">${svg}</g>` : svg;
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
  const { gender, skinColor, hairStyle, hairColor, eyeType, eyeColor, eyebrowStyle, mouthType, lipstickColor, freckles, facialHair,
    shirtStyle, shirtColor, bottomStyle, pantsColor, shoeStyle, shoeColor, accessory } = resolved;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame.viewBox}" width="${frame.width}" height="${frame.height}" preserveAspectRatio="xMidYMid meet">
  ${hairClipDefs(accessory)}
  ${lowerBodySvg(bottomStyle, pantsColor, skinColor, gender)}
  ${shoesSvg(shoeStyle, shoeColor, gender)}
  ${clippedHair(hairBack(hairStyle, hairColor), accessory)}
  ${armsSvg(shirtStyle, shirtColor, skinColor, gender)}
  ${shirtSvg(shirtStyle, shirtColor, skinColor, gender)}
  ${neckSvg(gender, skinColor)}
  <ellipse cx="72" cy="95" rx="9" ry="14" fill="${skinColor}"/><ellipse cx="168" cy="95" rx="9" ry="14" fill="${skinColor}"/>
  ${faceShapeSvg(skinColor)}
  ${hatTempleHairSvg(hairStyle, hairColor, accessory)}
  ${eyebrowSvg(eyebrowStyle, hairColor)}
  ${eyeSvg(eyeType, eyeColor, gender)}
  ${noseSvg(skinColor)}
  ${frecklesSvg(freckles, skinColor)}
  ${gender === 'male' ? facialHairSvg(facialHair, hairColor) : ''}
  ${mouthSvg(mouthType, gender, lipstickColor)}
  ${clippedHair(hairFront(hairStyle, hairColor), accessory)}
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
