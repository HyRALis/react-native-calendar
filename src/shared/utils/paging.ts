/**
 * Which page a horizontal scroll settled on. Kept pure and free of any view so
 * the paging rule can be unit tested without simulating a gesture, and so it
 * can absorb iOS rubber-band (negative) and Android overscroll offsets.
 */
export function pageIndexFromOffset(
  offsetX: number,
  pageWidth: number,
  pageCount: number,
): number {
  if (pageWidth <= 0 || pageCount <= 0) {
    return 0;
  }

  return clampIndex(Math.round(offsetX / pageWidth), pageCount);
}

export function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), count - 1);
}
