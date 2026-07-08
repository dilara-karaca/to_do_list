const extensionByMimeType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/pjpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

const mimeTypeByExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
};

const allowedAvatarMimeTypes = new Set(Object.keys(extensionByMimeType));
export const maxAvatarSize = 2 * 1024 * 1024;

export const resolveAvatarMimeType = (file: File) => {
    const normalizedType = file.type.toLowerCase();
    if (allowedAvatarMimeTypes.has(normalizedType)) {
        return normalizedType === 'image/jpg' || normalizedType === 'image/pjpeg'
            ? 'image/jpeg'
            : normalizedType;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return mimeTypeByExtension[extension] ?? null;
};

export const validateAvatarFile = (file: File) => {
    const mimeType = resolveAvatarMimeType(file);

    if (!mimeType) {
        return { ok: false as const, message: 'Sadece JPG, PNG, WEBP veya GIF yüklenebilir.' };
    }

    if (file.size > maxAvatarSize) {
        return { ok: false as const, message: 'Dosya boyutu en fazla 2 MB olabilir.' };
    }

    return { ok: true as const, mimeType };
};

export const prepareAvatarImage = async (file: File, mimeType: string) => {
    if (mimeType === 'image/gif') {
        return file;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error('Görsel okunamadı.'));
            element.src = objectUrl;
        });

        const maxEdge = 512;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            return file;
        }

        context.drawImage(image, 0, 0, width, height);

        const outputType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), outputType, 0.88);
        });

        if (!blob) {
            return file;
        }

        const extension = extensionByMimeType[outputType] ?? 'jpg';
        return new File([blob], `avatar.${extension}`, { type: outputType });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

export const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
});

export const getAvatarExtension = (mimeType: string) => extensionByMimeType[mimeType] ?? 'jpg';
