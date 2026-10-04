export function positionLabel(index, total) {
  const count = Number.isFinite(Number(total)) ? Math.max(0, Math.floor(Number(total))) : 0;
  const position = count ? ((Number(index) || 0) % count + count) % count + 1 : 0;
  return `${String(position).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
}

export function normalizePhoto(photo, assetBase, alts = {}) {
  if (typeof photo === 'string' && photo) {
    return {
      id: 0, name: photo, url: `${assetBase}${photo}-1536.webp`,
      srcset: [480, 960, 1536].map(width => `${assetBase}${photo}-${width}.webp ${width}w`).join(', '),
      width: 1536, height: 2048, alt: alts[photo] || '',
    };
  }
  if (!photo || typeof photo !== 'object' || typeof photo.url !== 'string' || !photo.url.trim()) return null;
  return {
    ...photo, id: Number(photo.id) || 0, name: String(photo.name || ''),
    srcset: String(photo.srcset || ''), width: Number(photo.width) || 1536,
    height: Number(photo.height) || 2048, alt: String(photo.alt || ''),
  };
}
