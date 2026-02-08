import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { X, RotateCcw, ZoomIn, RefreshCw, Check } from "lucide-react";

interface ImageEditorModalProps {
  image: string;
  onClose: () => void;
  onSave: (croppedImage: Blob) => void;
  aspect?: number;
  circularCrop?: boolean;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  image,
  onClose,
  onSave,
  aspect = 1,
  circularCrop = true,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const maxSize = Math.max(img.width, img.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(
        img,
        safeArea / 2 - img.width * 0.5,
        safeArea / 2 - img.height * 0.5,
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + img.width * 0.5 - croppedAreaPixels.x),
        Math.round(0 - safeArea / 2 + img.height * 0.5 - croppedAreaPixels.y),
      );

      return new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (file) => {
            if (file) resolve(file);
          },
          "image/jpeg",
          0.9,
        );
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      onSave(croppedBlob);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h3 className="text-lg font-black text-gray-800">사진 편집</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="relative flex-1 min-h-[350px] bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-white space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ZoomIn size={18} className="text-gray-400" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-rose-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-4">
              <RefreshCw size={18} className="text-gray-400" />
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-rose-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-4 bg-gray-50 text-gray-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-3 px-4 bg-gray-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-lg shadow-gray-200"
            >
              <Check size={18} />
              편집 완료
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageEditorModal;
