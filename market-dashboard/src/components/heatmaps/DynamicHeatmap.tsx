"use client";

export const getDynamicColor = (momentum: number, maxIntensity: number) => {
  const clamped = Math.max(-maxIntensity, Math.min(maxIntensity, momentum));
  const intensity = Math.abs(clamped) / maxIntensity;

  if (clamped > 0) {
    const r = Math.round(148 - (96 * intensity));
    const g = Math.round(163 + (48 * intensity));
    const b = Math.round(184 - (31 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (clamped < 0) {
    const r = Math.round(148 + (103 * intensity));
    const g = Math.round(163 - (50 * intensity));
    const b = Math.round(184 - (51 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return `rgb(148, 163, 184)`;
};