export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  const alphaHex = toHex(a * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? alphaHex : ''}`;
}

export function darkenRGB(color: RGB, factor: number): RGB {
  return {
    r: Math.round(color.r * factor),
    g: Math.round(color.g * factor),
    b: Math.round(color.b * factor)
  };
}

export function shiftHueRGB(color: RGB): RGB {
  // Simple hue shift approximation by mixing channels slightly
  // For a real app, HSL conversion is better, but this is fast and good enough for a secondary glow
  return {
    r: Math.min(255, color.r * 0.8 + color.b * 0.2),
    g: Math.min(255, color.g * 0.9 + color.r * 0.1),
    b: Math.min(255, color.b * 0.8 + color.g * 0.2)
  };
}

export function getAverageColor(imageUrl: string): Promise<RGB> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // We don't need full resolution to get the average color, downscaling makes it faster
      canvas.width = 50;
      canvas.height = 75;
      
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 16) { // Step by 16 for speed (every 4th pixel)
          // Ignore highly transparent or completely black/white pixels to get true dominant color
          if (data[i + 3] > 128) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        // Fallback to purple if calculation fails
        if (count === 0) {
          resolve({ r: 139, g: 92, b: 246 });
          return;
        }

        // Boost saturation slightly for a more vibrant UI
        const avgR = r / count;
        const avgG = g / count;
        const avgB = b / count;
        
        const max = Math.max(avgR, avgG, avgB);
        const boost = max < 200 ? 1.2 : 1.0;

        resolve({
          r: Math.min(255, avgR * boost),
          g: Math.min(255, avgG * boost),
          b: Math.min(255, avgB * boost),
        });
      } catch (err) {
        // Tainted canvas due to CORS
        console.warn("Could not extract color due to CORS, falling back to default.", err);
        resolve({ r: 139, g: 92, b: 246 });
      }
    };
    
    img.onerror = () => {
      console.warn("Image load failed for color extraction.");
      resolve({ r: 139, g: 92, b: 246 });
    };

    img.src = imageUrl;
  });
}

export const THEME_VARS = [
  '--primary-alpha-60',
  '--primary-alpha-35',
  '--primary-alpha-5',
  '--primary-alpha-40',
  '--primary-alpha-20',
  '--primary-alpha-3',
  '--primary-alpha-10',
  '--primary-alpha-50',
  '--secondary-alpha-50',
  '--primary-color',
  '--primary-color-glow',
  '--bg-mesh-1',
  '--bg-mesh-2'
];

export async function applyThemeFromImage(imageUrl: string) {
  const color = await getAverageColor(imageUrl);
  const root = document.documentElement;

  // Set primary alphas
  root.style.setProperty('--primary-alpha-60', rgbaToHex(color.r, color.g, color.b, 0.6));
  root.style.setProperty('--primary-alpha-50', rgbaToHex(color.r, color.g, color.b, 0.5));
  root.style.setProperty('--primary-alpha-40', rgbaToHex(color.r, color.g, color.b, 0.4));
  root.style.setProperty('--primary-alpha-35', rgbaToHex(color.r, color.g, color.b, 0.35));
  root.style.setProperty('--primary-alpha-20', rgbaToHex(color.r, color.g, color.b, 0.2));
  root.style.setProperty('--primary-alpha-10', rgbaToHex(color.r, color.g, color.b, 0.1));
  root.style.setProperty('--primary-alpha-5', rgbaToHex(color.r, color.g, color.b, 0.05));
  root.style.setProperty('--primary-alpha-3', rgbaToHex(color.r, color.g, color.b, 0.03));
  
  // Base colors
  root.style.setProperty('--primary-color', rgbaToHex(color.r, color.g, color.b, 1));
  root.style.setProperty('--primary-color-glow', rgbaToHex(color.r, color.g, color.b, 0.5));

  // Secondary/Accent
  const secondary = shiftHueRGB(color);
  root.style.setProperty('--secondary-alpha-50', rgbaToHex(secondary.r, secondary.g, secondary.b, 0.5));

  // Mesh Backgrounds (Dark variants of primary)
  const dark1 = darkenRGB(color, 0.3); // Equivalent to #2a1450 from #8b5cf6
  const dark2 = darkenRGB(shiftHueRGB(color), 0.2); // Equivalent to #141b50 from #8b5cf6
  
  root.style.setProperty('--bg-mesh-1', rgbaToHex(dark1.r, dark1.g, dark1.b, 0.4));
  root.style.setProperty('--bg-mesh-2', rgbaToHex(dark2.r, dark2.g, dark2.b, 0.4));
}

export function resetTheme() {
  const root = document.documentElement;
  THEME_VARS.forEach(variable => {
    root.style.removeProperty(variable);
  });
}