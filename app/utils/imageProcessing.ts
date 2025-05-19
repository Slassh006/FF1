export type Resolution = {
  width: number;
  height: number;
  label: string;
};

export const RESOLUTIONS = {
  MOBILE: { width: 1080, height: 1920, label: 'Mobile (1080x1920)' },
  DESKTOP: { width: 1920, height: 1080, label: 'Desktop (1920x1080)' },
  TABLET: { width: 1620, height: 2160, label: 'Tablet (1620x2160)' },
  HD: { width: 1280, height: 720, label: 'HD (1280x720)' },
  FULL_HD: { width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
  QUAD_HD: { width: 2560, height: 1440, label: 'Quad HD (2560x1440)' },
} as const;

export async function createThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set thumbnail dimensions
      const maxWidth = 300;
      const maxHeight = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function cropImage(
  file: File,
  resolution: Resolution
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set target dimensions
      canvas.width = resolution.width;
      canvas.height = resolution.height;

      // Calculate crop dimensions
      const sourceAspect = img.width / img.height;
      const targetAspect = resolution.width / resolution.height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // Smart cropping - maintain center focus
      if (sourceAspect > targetAspect) {
        // Source is wider than target
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Source is taller than target
        sourceHeight = img.width / targetAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw and crop image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        resolution.width,
        resolution.height
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to crop image'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
} 