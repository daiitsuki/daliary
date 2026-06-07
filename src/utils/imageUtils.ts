/**
 * Canvas API를 사용해 이미지 Blob을 WebP 형식으로 변환합니다.
 * browser-image-compression으로 리사이즈/용량 압축 후 이 함수로 WebP 변환하는
 * 두 단계 파이프라인으로 사용하세요.
 *
 * @param blob - 변환할 이미지 Blob (JPEG, PNG 등 모든 형식 가능)
 * @param quality - WebP 품질 (0.0 ~ 1.0, 기본값 0.8)
 * @returns WebP 형식의 Blob
 */
export const convertToWebP = (blob: Blob, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas 2D context를 가져올 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('WebP 변환에 실패했습니다. 브라우저가 WebP를 지원하지 않을 수 있습니다.'));
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = objectUrl;
  });
};
