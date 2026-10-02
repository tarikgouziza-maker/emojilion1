import { EmojiVariation, SkinTone, GenderType } from '../types/emoji';

// Helper to convert character sequence to code points string e.g. "U+1F600" or "U+1F468 U+200D U+1F4BB"
export function getCodePoints(emojiStr: string): string {
  if (!emojiStr) return '';
  return Array.from(emojiStr)
    .map(c => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'))
    .join(' ');
}

export function getCodePointHex(emojiStr: string): string {
  if (!emojiStr) return '';
  return Array.from(emojiStr)
    .map(c => c.codePointAt(0)!.toString(16).toLowerCase())
    .join('-');
}

export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Skin tone modifiers
export const SKIN_TONES: { tone: SkinTone; label: string; char: string; hex: string }[] = [
  { tone: 'light', label: 'Light Skin Tone', char: '\u{1F3FB}', hex: '1f3fb' },
  { tone: 'medium-light', label: 'Medium-Light Skin Tone', char: '\u{1F3FC}', hex: '1f3fc' },
  { tone: 'medium', label: 'Medium Skin Tone', char: '\u{1F3FD}', hex: '1f3fd' },
  { tone: 'medium-dark', label: 'Medium-Dark Skin Tone', char: '\u{1F3FE}', hex: '1f3fe' },
  { tone: 'dark', label: 'Dark Skin Tone', char: '\u{1F3FF}', hex: '1f3ff' },
];

export function generateSkinToneVariations(baseChar: string, baseName: string): EmojiVariation[] {
  return SKIN_TONES.map(st => {
    // If baseChar has ZWJ, insert the skin tone before the ZWJ
    let variant = '';
    if (baseChar.includes('\u200D')) {
      const parts = baseChar.split('\u200D');
      variant = parts[0] + st.char + '\u200D' + parts.slice(1).join('\u200D');
    } else {
      variant = baseChar + st.char;
    }
    return {
      type: 'skin_tone',
      emoji: variant,
      label: `${baseName}: ${st.label}`,
      skinTone: st.tone,
      codePoint: getCodePoints(variant)
    };
  });
}

export function generateGenderVariations(
  roleName: string,
  personBase: string,
  manEmoji: string,
  womanEmoji: string,
  neutralEmoji: string
): EmojiVariation[] {
  return [
    { type: 'gender', emoji: womanEmoji, label: `Woman ${roleName}`, gender: 'female', codePoint: getCodePoints(womanEmoji) },
    { type: 'gender', emoji: manEmoji, label: `Man ${roleName}`, gender: 'male', codePoint: getCodePoints(manEmoji) },
    { type: 'gender', emoji: neutralEmoji, label: `Person ${roleName}`, gender: 'neutral', codePoint: getCodePoints(neutralEmoji) },
  ];
}

// Official ISO 3166-1 country code flag generator
export function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
