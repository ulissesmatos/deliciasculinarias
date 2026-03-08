/**
 * Convert an image File to WebP format using Canvas API.
 * @param {File} file - Original image file
 * @param {number} quality - WebP quality (0 to 1), default 0.8
 * @returns {Promise<File>} - Converted WebP file
 */
export async function convertToWebp(file, quality = 0.8) {
  if (file.type === 'image/webp') return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  );

  const name = file.name.replace(/\.[^.]+$/, '.webp');
  return new File([blob], name, { type: 'image/webp' });
}
