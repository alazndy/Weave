// Image compression utility for Firebase sync
// Firebase Firestore has a 1MB document size limit, so we need to compress images before syncing

/**
 * Compress an image to reduce its size for Firebase storage
 * @param imageUrl Base64 or URL of the image
 * @param maxWidth Maximum width (default 400px for thumbnails)
 * @param quality JPEG quality 0-1 (default 0.7)
 * @returns Compressed base64 image or original URL if not base64
 */
export async function compressImageForSync(
  imageUrl: string,
  maxWidth: number = 400,
  quality: number = 0.7
): Promise<string> {
  // If it's not a base64 image, return as-is (external URLs are fine)
  if (!imageUrl || !imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageUrl); // Fallback to original
        return;
      }

      // Calculate new dimensions (maintain aspect ratio)
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed JPEG
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Log compression result
      const originalSize = Math.round(imageUrl.length / 1024);
      const compressedSize = Math.round(compressedUrl.length / 1024);
      console.log(`[ImageCompressor] ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);

      resolve(compressedUrl);
    };

    img.onerror = () => {
      console.warn('[ImageCompressor] Failed to load image, using original');
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

/**
 * Check if an image needs compression (> 500KB base64)
 */
export function needsCompression(imageUrl: string): boolean {
  if (!imageUrl || !imageUrl.startsWith('data:')) {
    return false;
  }
  // Base64 adds ~33% overhead, so 500KB base64 ≈ 375KB actual image
  return imageUrl.length > 500 * 1024;
}

/**
 * Convert base64 data URL to Blob for upload
 */
function dataURLtoBlob(dataURL: string): Blob {
  const [header, base64Data] = dataURL.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64Data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Upload an image to Firebase Storage and return the download URL
 * @param imageUrl Base64 or existing URL
 * @param productId Product ID for filename
 * @returns Download URL from Firebase Storage
 */
export async function uploadImageToStorage(
  imageUrl: string,
  productId: string
): Promise<string> {
  // If it's not a base64 image, return as-is (already a URL)
  if (!imageUrl || !imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    // Dynamic import to avoid circular dependency
    const { storage } = await import('../lib/firebase');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `weave-products/${productId}_${timestamp}.jpg`;
    const storageRef = ref(storage, filename);

    // First compress the image
    const compressedImage = await compressImageForSync(imageUrl, 800, 0.8);
    
    // Convert to blob
    const blob = dataURLtoBlob(compressedImage);
    
    console.log(`[Storage] Uploading ${Math.round(blob.size / 1024)}KB to ${filename}`);
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        productId,
        uploadedAt: new Date().toISOString(),
        source: 'weave'
      }
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`[Storage] Upload complete: ${downloadURL.substring(0, 50)}...`);
    
    return downloadURL;
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    // Fallback to compressed base64 if storage fails
    return compressImageForSync(imageUrl, 400, 0.5);
  }
}
