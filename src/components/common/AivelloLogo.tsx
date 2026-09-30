import React, { useId } from 'react';

/**
 * Aivello brand mark.
 *
 * Concept: a bold, rounded "A" drawn as a folded ribbon (the left stroke is a
 * translucent layer behind the solid right stroke + crossbar) with a four-point
 * AI spark, on a violet -> pink squircle tile. The tile gradient is exactly
 * Tailwind `from-purple-600 to-pink-600` (see tailwind.config.js).
 */
export const AIVELLO_BRAND = {
  from: '#8139F2', // purple-600
  to: '#D4247F', // pink-600
} as const;

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  /**
   * Accessible name (defaults to "Aivello"). Pass an empty string when the logo
   * is decorative, e.g. when visible "Aivello" text sits right next to it.
   */
  title?: string;
}

interface WordmarkLogoProps extends LogoProps {
  /**
   * Paint the wordmark with the brand gradient. By default it uses
   * `currentColor`, so `text-gray-900 dark:text-white` keeps it legible in both
   * themes; prefer that on dark backgrounds.
   */
  gradientText?: boolean;
}

const a11yProps = (title: string) =>
  title
    ? ({ role: 'img', 'aria-label': title } as const)
    : ({ 'aria-hidden': true, focusable: false } as const);

// useId() output contains characters (":" / "«»") that are awkward inside url(#...).
const useSvgId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

/** White mark on the 512x512 tile grid. */
const Mark: React.FC = () => (
  <>
    <path
      d="M116 390L230 150"
      fill="none"
      stroke="#fff"
      strokeOpacity={0.72}
      strokeWidth={80}
      strokeLinecap="round"
    />
    <path d="M211.6 282H292.7V338H185Z" fill="#fff" />
    <path d="M230 150L344 390" fill="none" stroke="#fff" strokeWidth={80} strokeLinecap="round" />
    <path
      d="M376 80Q388.8 131.2 440 144Q388.8 156.8 376 208Q363.2 156.8 312 144Q363.2 131.2 376 80Z"
      fill="#fff"
    />
  </>
);

const BrandGradient: React.FC<{ id: string; userSpace?: boolean; horizontal?: boolean }> = ({
  id,
  userSpace = false,
  horizontal = false,
}) =>
  userSpace ? (
    <linearGradient id={id} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stopColor={AIVELLO_BRAND.from} />
      <stop offset="1" stopColor={AIVELLO_BRAND.to} />
    </linearGradient>
  ) : (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2={horizontal ? '0' : '1'}>
      <stop stopColor={AIVELLO_BRAND.from} />
      <stop offset="1" stopColor={AIVELLO_BRAND.to} />
    </linearGradient>
  );

// Lockup geometry: 64-unit icon + 14-unit gap + wordmark (344 x 84 units scaled by 0.42).
const LOCKUP_W = 223;
const LOCKUP_H = 64;

/** Monoline "Aivello" wordmark (baseline y=84); the dot of the i is a brand spark. */
const WORDMARK_D =
  'M7 77L37 7L67 77M16.4 55H57.6M89 31V77M109 31L131 77L153 31M172 54H220A24 24 0 1 0 214.9 68.8' +
  'M242 7V77M266 7V77M289 54A24 24 0 1 0 337 54A24 24 0 1 0 289 54Z';
const WORDMARK_SPARK_D = 'M89 -6.5Q91.7 1.3 99.5 4Q91.7 6.7 89 14.5Q86.3 6.7 78.5 4Q86.3 1.3 89 -6.5Z';

/** Horizontal logo lockup: icon tile + "Aivello" wordmark. */
export const AivelloLogo: React.FC<WordmarkLogoProps> = ({
  width,
  height,
  className = '',
  title = 'Aivello',
  gradientText = false,
}) => {
  const uid = useSvgId();
  const tileId = `${uid}-tile`;
  const accentId = `${uid}-accent`;
  const textId = `${uid}-text`;

  const h = height ?? (width ? (width * LOCKUP_H) / LOCKUP_W : 40);
  const w = width ?? (h * LOCKUP_W) / LOCKUP_H;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${LOCKUP_W} ${LOCKUP_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...a11yProps(title)}
    >
      <defs>
        <BrandGradient id={tileId} userSpace />
        <BrandGradient id={accentId} />
        {gradientText && <BrandGradient id={textId} horizontal />}
      </defs>

      <g transform="scale(0.125)">
        <rect width="512" height="512" rx="120" fill={`url(#${tileId})`} />
        <Mark />
      </g>

      <g transform="translate(78 14.36) scale(0.42)">
        <path
          d={WORDMARK_D}
          fill="none"
          stroke={gradientText ? `url(#${textId})` : 'currentColor'}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d={WORDMARK_SPARK_D} fill={`url(#${accentId})`} />
      </g>
    </svg>
  );
};

/** Square app icon (brand tile + mark). Reads down to 16px. */
export const AivelloIcon: React.FC<LogoProps> = ({ width, height, className = '', title = 'Aivello' }) => {
  const uid = useSvgId();
  const tileId = `${uid}-tile`;
  const w = width ?? height ?? 32;
  const h = height ?? width ?? 32;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...a11yProps(title)}
    >
      <defs>
        <BrandGradient id={tileId} userSpace />
      </defs>
      <rect width="512" height="512" rx="120" fill={`url(#${tileId})`} />
      <Mark />
    </svg>
  );
};
