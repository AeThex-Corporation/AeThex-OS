import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, FlipHorizontal, Image as ImageIcon, Send } from 'lucide-react';
import { useLocation } from 'wouter';
import { useDeviceCamera } from '@/hooks/use-device-camera';
import { useNativeFeatures } from '@/hooks/use-native-features';
import { haptics } from '@/lib/haptics';
import { isMobile } from '@/lib/platform';

export default function MobileCamera() {
  const [, navigate] = useLocation();
  const { photo, isLoading, error, takePhoto, pickPhoto } = useDeviceCamera();
  const native = useNativeFeatures();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  if (!isMobile()) {
    navigate('/home');
    return null;
  }

  const handleTakePhoto = async () => {
    haptics.medium();
    const result = await takePhoto();
    if (result) {
      setCapturedImage(result.webPath || result.path || '');
      native.showToast('Photo captured!');
      haptics.success();
    }
  };

  const handlePickFromGallery = async () => {
    haptics.light();
    const result = await pickPhoto();
    if (result) {
      setCapturedImage(result.webPath || result.path || '');
      native.showToast('Photo selected!');
    }
  };

  const handleShare = async () => {
    if (capturedImage) {
      haptics.medium();
      await native.shareText('Check out my photo!', 'Photo from AeThex OS');
      haptics.success();
    }
  };

  const handleClose = () => {
    haptics.light();
    navigate('/mobile');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-emerald-500/30">
        <div className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
          <button
            onClick={handleClose}
            className="p-3 rounded-full bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">
            Camera
          </h1>
          {capturedImage ? (
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <Send className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="pt-20 pb-32 px-4">
        {capturedImage ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-2xl shadow-2xl"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  haptics.light();
                }}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl font-semibold transition-colors"
              >
                Share
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Camera placeholder */}
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-500/30">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                <p className="text-sm text-gray-400">Tap button below to capture</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Camera controls */}
            <div className="flex gap-4">
              <button
                onClick={handlePickFromGallery}
                disabled={isLoading}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Gallery
              </button>
              <button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {isLoading ? 'Capturing...' : 'Capture'}
              </button>
            </div>

            {/* Info */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-xs text-cyan-200 font-mono">
                📸 <strong>Camera Access:</strong> This feature uses your device camera.
                Grant permission when prompted to capture photos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
