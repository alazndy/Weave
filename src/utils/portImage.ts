import { scaledSize } from './portDetail';

/** Reads an uploaded picture as a data URL, downscaled so project files and autosave stay small. */
export async function readPortImage(file: File): Promise<string> {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('unsupported image type');
    const bitmap = await createImageBitmap(file);
    const { w, h } = scaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL(file.type, 0.9);
}
