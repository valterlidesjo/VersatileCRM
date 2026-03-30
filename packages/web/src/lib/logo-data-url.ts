/**
 * Loads a logo URL into a canvas and returns a PNG data URL for jsPDF.
 * Always resolves (never rejects) — returns undefined if the image can't load.
 * NOTE: requires CORS to be configured on the storage bucket.
 */
export function fetchLogoDataUrl(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(undefined); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(undefined);
      }
    };

    img.onerror = () => resolve(undefined);

    img.src = url;
  });
}
