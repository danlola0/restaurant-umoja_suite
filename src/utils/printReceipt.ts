export async function imageToThermalQrPng(src: string, outputSize = 384): Promise<string> {
  const absolute = src.startsWith('http') || src.startsWith('data:')
    ? src
    : `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('QR image load failed'));
    image.src = absolute;
  });

  const source = document.createElement('canvas');
  source.width = image.naturalWidth || image.width;
  source.height = image.naturalHeight || image.height;
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  if (!sourceCtx) return absolute;
  sourceCtx.drawImage(image, 0, 0);
  const { data, width, height } = sourceCtx.getImageData(0, 0, source.width, source.height);

  const luma = (index: number) => 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (luma(index) < 145) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = width - 1;
    maxY = height - 1;
  }
  const side = Math.max(maxX - minX, maxY - minY);
  const pad = Math.max(4, Math.round(side * 0.06));
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, side + pad * 2);
  const cropH = Math.min(height - cropY, side + pad * 2);

  const out = document.createElement('canvas');
  out.width = outputSize;
  out.height = outputSize;
  const outCtx = out.getContext('2d');
  if (!outCtx) return absolute;
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, outputSize, outputSize);
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, outputSize, outputSize);

  const pixels = outCtx.getImageData(0, 0, outputSize, outputSize);
  const outData = pixels.data;
  for (let i = 0; i < outData.length; i += 4) {
    const value = 0.299 * outData[i] + 0.587 * outData[i + 1] + 0.114 * outData[i + 2] < 160 ? 0 : 255;
    outData[i] = value;
    outData[i + 1] = value;
    outData[i + 2] = value;
    outData[i + 3] = 255;
  }
  outCtx.putImageData(pixels, 0, 0);
  return out.toDataURL('image/png');
}

export const RECEIPT_PRINT_CSS = `
@page { size: 80mm auto; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body { width: 80mm; }
#umoja-print-receipt {
  width: 72mm !important;
  max-width: 72mm !important;
  margin: 2mm auto !important;
  padding: 0 !important;
}
img.umoja-qr {
  width: 28mm !important;
  height: 28mm !important;
  object-fit: contain;
  image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
}
`;
