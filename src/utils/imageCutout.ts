const transparentCache = new Map<string, string>();
const inflightCache = new Map<string, Promise<string>>();

/**
 * Flood-fills from the four outer corners/edges of an isolated white-background
 * studio illustration so that interior cream/white details (like Mimi's hijab
 * or ambulance body) stay completely untouched while the outer background becomes
 * cleanly transparent for overlays and the Selfie Photobooth canvas.
 */
export function removeWhiteBackground(src: string): Promise<string> {
  const cached = transparentCache.get(src);
  if (cached) return Promise.resolve(cached);

  const pending = inflightCache.get(src);
  if (pending) return pending;

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxDim = 760;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const total = width * height;
        const visited = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;

        const isNearWhite = (idx: number) => {
          const p = idx * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          // Pure white / soft studio off-white background threshold
          return r >= 240 && g >= 238 && b >= 236 && Math.max(r, g, b) - Math.min(r, g, b) <= 16;
        };

        const enqueue = (x: number, y: number) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return;
          const idx = y * width + x;
          if (visited[idx]) return;
          if (!isNearWhite(idx)) return;
          visited[idx] = 1;
          queue[tail++] = idx;
        };

        // Seed all 4 borders
        for (let x = 0; x < width; x++) {
          enqueue(x, 0);
          enqueue(x, height - 1);
        }
        for (let y = 1; y < height - 1; y++) {
          enqueue(0, y);
          enqueue(width - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          const x = idx % width;
          const y = (idx - x) / width;

          const p = idx * 4;
          data[p + 3] = 0;

          enqueue(x + 1, y);
          enqueue(x - 1, y);
          enqueue(x, y + 1);
          enqueue(x, y - 1);
        }

        // Soften 1px fringe adjacent to cleared background
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (visited[idx]) continue;
            const hasTransparentNeighbor =
              visited[idx - 1] ||
              visited[idx + 1] ||
              visited[idx - width] ||
              visited[idx + width];
            if (hasTransparentNeighbor) {
              const p = idx * 4;
              const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
              if (lum > 225) {
                data[p + 3] = Math.round(data[p + 3] * 0.45);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const resultUrl = canvas.toDataURL('image/png');
        transparentCache.set(src, resultUrl);
        resolve(resultUrl);
      } catch {
        resolve(src);
      }
    };

    img.onerror = () => resolve(src);
    img.src = src;
  }).finally(() => {
    inflightCache.delete(src);
  });

  inflightCache.set(src, promise);
  return promise;
}
