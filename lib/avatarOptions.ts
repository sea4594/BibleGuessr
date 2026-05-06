export interface AvatarSpec {
  id: string;
  bg: string;
  skin: string;
  hair: string;
  eyes: 'round' | 'sleepy' | 'dot' | 'wide';
  mouth: 'smile' | 'grin' | 'flat' | 'o';
  accessory: 'none' | 'glasses' | 'brow' | 'earring';
}

const BG_COLORS = ['#254d70', '#37718e', '#4b6cb7', '#4a6fa5', '#6b9080', '#9c6644', '#b56576', '#6d597a', '#355070', '#8d99ae'];
const SKIN_COLORS = ['#f5d0b5', '#e7b594', '#d29c7b', '#b98262', '#8d5f4b'];
const HAIR_COLORS = ['#1f1f1f', '#402218', '#744b27', '#a0673f', '#5b3b6a', '#1e3a5f'];

export function makeAvatarSpec(seed: number): AvatarSpec {
  const bg = BG_COLORS[seed % BG_COLORS.length];
  const skin = SKIN_COLORS[Math.floor(seed / 2) % SKIN_COLORS.length];
  const hair = HAIR_COLORS[Math.floor(seed / 3) % HAIR_COLORS.length];
  const eyes = (['round', 'sleepy', 'dot', 'wide'] as const)[Math.floor(seed / 5) % 4];
  const mouth = (['smile', 'grin', 'flat', 'o'] as const)[Math.floor(seed / 7) % 4];
  const accessory = (['none', 'glasses', 'brow', 'earring'] as const)[Math.floor(seed / 11) % 4];

  return {
    id: `avatar-${seed}`,
    bg,
    skin,
    hair,
    eyes,
    mouth,
    accessory,
  };
}

export function getAvatarOptions(count = 72): AvatarSpec[] {
  return Array.from({ length: count }, (_, idx) => makeAvatarSpec(idx + 1));
}

function eyesSvg(eyes: AvatarSpec['eyes']) {
  if (eyes === 'sleepy') {
    return '<path d="M87 114 h20" stroke="#1f1f1f" stroke-width="5"/><path d="M149 114 h20" stroke="#1f1f1f" stroke-width="5"/>';
  }
  if (eyes === 'dot') {
    return '<circle cx="97" cy="114" r="4" fill="#1f1f1f"/><circle cx="159" cy="114" r="4" fill="#1f1f1f"/>';
  }
  if (eyes === 'wide') {
    return '<ellipse cx="97" cy="114" rx="9" ry="7" fill="#fff"/><ellipse cx="159" cy="114" rx="9" ry="7" fill="#fff"/><circle cx="97" cy="114" r="4" fill="#1f1f1f"/><circle cx="159" cy="114" r="4" fill="#1f1f1f"/>';
  }
  return '<circle cx="97" cy="114" r="6" fill="#1f1f1f"/><circle cx="159" cy="114" r="6" fill="#1f1f1f"/>';
}

function mouthSvg(mouth: AvatarSpec['mouth']) {
  if (mouth === 'grin') {
    return '<rect x="109" y="149" width="38" height="12" rx="5" fill="#fff"/><rect x="109" y="149" width="38" height="6" rx="3" fill="#8b2f2f"/>';
  }
  if (mouth === 'flat') {
    return '<line x1="111" y1="154" x2="145" y2="154" stroke="#402218" stroke-width="4"/>';
  }
  if (mouth === 'o') {
    return '<ellipse cx="128" cy="155" rx="8" ry="10" fill="#8b2f2f"/>';
  }
  return '<path d="M110 152 q18 16 36 0" stroke="#8b2f2f" stroke-width="4" fill="none"/>';
}

function accessorySvg(accessory: AvatarSpec['accessory']) {
  if (accessory === 'glasses') {
    return '<rect x="81" y="104" width="30" height="20" rx="6" fill="none" stroke="#1f1f1f" stroke-width="4"/><rect x="145" y="104" width="30" height="20" rx="6" fill="none" stroke="#1f1f1f" stroke-width="4"/><line x1="111" y1="114" x2="145" y2="114" stroke="#1f1f1f" stroke-width="3"/>';
  }
  if (accessory === 'brow') {
    return '<path d="M82 101 q14 -9 30 -3" stroke="#2a1d10" stroke-width="4"/><path d="M144 98 q14 -8 30 0" stroke="#2a1d10" stroke-width="4"/>';
  }
  if (accessory === 'earring') {
    return '<circle cx="70" cy="145" r="5" fill="#f2d53c"/><circle cx="186" cy="145" r="5" fill="#f2d53c"/>';
  }
  return '';
}

export function avatarToDataUri(spec: AvatarSpec) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="28" fill="${spec.bg}" />
      <ellipse cx="128" cy="145" rx="72" ry="78" fill="${spec.skin}" />
      <path d="M58 128 q12 -72 70 -72 q58 0 70 72 v8 h-140z" fill="${spec.hair}" />
      ${eyesSvg(spec.eyes)}
      ${mouthSvg(spec.mouth)}
      ${accessorySvg(spec.accessory)}
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}