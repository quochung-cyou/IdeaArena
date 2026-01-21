/**
 * Compresses an image file and returns a base64 string.
 * Resizes the image to a maximum dimension of 800px and uses JPEG compression with 0.7 quality.
 */
export interface ImageCompressionOptions {
    maxDimension?: number;
    quality?: number;
}

/**
 * Compresses an image file and returns a base64 string.
 * Resizes the image to a maximum dimension and uses JPEG compression with specified quality.
 */
export const compressImage = (file: File, options: ImageCompressionOptions = {}): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { maxDimension = 800, quality = 0.7 } = options;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height *= maxDimension / width;
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width *= maxDimension / height;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress as JPEG with specified quality
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
