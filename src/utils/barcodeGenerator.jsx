import React from 'react';

/**
 * Standard Code 128 (Subset B) Barcode Table
 * ISO/IEC 15417 specification compliant.
 * Patterns of 6 bar/space widths (except Stop character 106 which has 7 widths).
 */
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

/**
 * Encodes text into Code 128 bar positions.
 * @param {string} text - Alphanumeric string to encode.
 * @param {number} quietZoneModules - Margins on left and right (default 12).
 * @returns {{ totalModules: number, bars: Array<{ x: number, width: number }> }}
 */
export function generateCode128Bars(text, quietZoneModules = 12) {
  const clean = String(text || '').trim();
  const START_B = 104; // Code 128 Subset B start character
  const STOP = 106;    // Code 128 Stop character

  const codes = [START_B];
  let checksum = START_B;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    const safeVal = val >= 0 && val <= 95 ? val : 0;
    codes.push(safeVal);
    checksum += safeVal * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP);

  const bars = [];
  let currentX = quietZoneModules;

  for (let sIdx = 0; sIdx < codes.length; sIdx++) {
    const p = CODE128_PATTERNS[codes[sIdx]];
    if (!p) continue;
    for (let j = 0; j < p.length; j++) {
      const w = parseInt(p[j], 10);
      const isBar = j % 2 === 0;
      if (isBar) {
        bars.push({ x: currentX, width: w });
      }
      currentX += w;
    }
  }

  const totalModules = currentX + quietZoneModules;
  return { totalModules, bars };
}

/**
 * Pure SVG Barcode component.
 * Renders high-contrast, razor-sharp vector black bars for instant optical scanning.
 */
export const BarcodeSVG = ({
  value,
  height = 64,
  showText = false,
  className = '',
  style = {}
}) => {
  if (!value) return null;

  // Use compact quiet zone (6 modules) so barcode bars fill the full horizontal width
  const { totalModules, bars } = generateCode128Bars(value, 6);
  const textSpace = showText ? 16 : 0;
  const totalSvgHeight = height + textSpace;

  return (
    <svg
      viewBox={`0 0 ${totalModules} ${totalSvgHeight}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        ...style
      }}
      role="img"
      aria-label={`Barcode: ${value}`}
    >
      {/* Crisp White Background */}
      <rect x="0" y="0" width={totalModules} height={totalSvgHeight} fill="#FFFFFF" />

      {/* Vector Black Bars */}
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y="0"
          width={bar.width}
          height={height}
          fill="#000000"
          shapeRendering="crispEdges"
        />
      ))}

      {/* Optional Monospace Caption */}
      {showText && (
        <text
          x={totalModules / 2}
          y={height + 12}
          textAnchor="middle"
          fontFamily="'Courier New', Courier, monospace"
          fontSize="10"
          fontWeight="700"
          fill="#0F172A"
          letterSpacing="1.5px"
        >
          {value}
        </text>
      )}
    </svg>
  );
};

export default BarcodeSVG;
