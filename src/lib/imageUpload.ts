const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type ImageUploadOptions = {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = src;
  });
}

/**
 * Reads a picked image, scales it down and returns a compressed data URL.
 * Keeping uploads as data URLs means profiles still work without a file host;
 * the resize pass keeps localStorage comfortably below its quota.
 */
export async function imageFileToDataUrl(
  file: File,
  { maxWidth, maxHeight, quality = 0.86 }: ImageUploadOptions,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPG or WebP image.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That image is too large. Keep it under 25 MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) {
      throw new Error("That image has no readable dimensions.");
    }

    const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not process that image.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (!dataUrl || dataUrl === "data:,") {
      throw new Error("That image could not be compressed.");
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
