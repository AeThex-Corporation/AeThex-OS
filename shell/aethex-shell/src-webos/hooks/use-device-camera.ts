import { useState, useCallback } from 'react';
import { isMobile } from '@/lib/platform';

export interface PhotoResult {
  webPath?: string;
  path?: string;
  format?: string;
}

export function useDeviceCamera() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);

  const takePhoto = useCallback(async () => {
    if (!isMobile()) {
      setError('Camera only available on mobile');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { Camera } = await import('@capacitor/camera');
      const { CameraResultType, CameraSource } = await import('@capacitor/camera');

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      const result: PhotoResult = {
        path: image.path || '',
        webPath: image.webPath,
        format: image.format,
      };

      setPhoto(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera error';
      setError(message);
      console.error('[Camera Error]', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickPhoto = useCallback(async () => {
    if (!isMobile()) {
      setError('Photo picker only available on mobile');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { Camera } = await import('@capacitor/camera');
      const { CameraResultType, CameraSource } = await import('@capacitor/camera');

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      const result: PhotoResult = {
        path: image.path || '',
        webPath: image.webPath,
        format: image.format,
      };

      setPhoto(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Photo picker error';
      setError(message);
      console.error('[Photo Picker Error]', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    takePhoto,
    pickPhoto,
    clearPhoto,
    photo,
    isLoading,
    error,
  };
}
