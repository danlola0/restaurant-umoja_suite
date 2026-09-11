export async function imageToThermalQrPng(src: string, outputSize = 512): Promise<string> {
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
  const pad = Math.max(12, Math.round(side * 0.14));
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
  const quiet = Math.round(outputSize * 0.12);
  const inner = outputSize - quiet * 2;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(source, cropX, cropY, cropW, cropH, quiet, quiet, inner, inner);

  return out.toDataURL('image/png');
}

export const RECEIPT_PRINT_CSS = `
@page { size: A5 portrait; margin: 6mm 7mm; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
#umoja-print-receipt {
  width: 100% !important;
  max-width: 134mm !important;
  margin: 0 auto !important;
  padding: 0 !important;
  box-sizing: border-box;
  font-size: 11px !important;
  line-height: 1.25 !important;
}
#umoja-print-receipt h1 {
  margin: 6px 0 4px !important;
  font-size: 14px !important;
}
#umoja-print-receipt table td,
#umoja-print-receipt table th {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
`;
