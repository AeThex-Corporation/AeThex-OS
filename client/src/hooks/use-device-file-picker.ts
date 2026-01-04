import { useState, useCallback } from 'react';

export interface FileResult {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export function useDeviceFilePicker() {
  const [file, setFile] = useState<FileResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use web file input as fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';

      const filePromise = new Promise<File | null>((resolve) => {
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          resolve(target.files?.[0] || null);
        };
        input.oncancel = () => resolve(null);
      });

      input.click();

      const selectedFile = await filePromise;
      if (!selectedFile) {
        return null;
      }

      // Read file as data URL
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      reader.readAsDataURL(selectedFile);
      const dataUrl = await dataUrlPromise;

      const result: FileResult = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        dataUrl,
      };

      setFile(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'File picker error';
      setError(message);
      console.error('[File Picker Error]', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return {
    file,
    isLoading,
    error,
    pickFile,
    clearFile,
  };
}
