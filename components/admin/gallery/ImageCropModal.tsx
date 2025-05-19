import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { FaTimes, FaCropAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ImageCropModalProps {
    imageUrl: string | null;
    originalFilename: string;
    onClose: () => void;
    onSave: (croppedBlob: Blob) => Promise<void>; // Prop to handle saving the blob
}

// Utility to create cropped image via Canvas
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Needed to prevent CORS issues if image is not from the same origin
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to match cropped area size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw cropped image onto canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        reject(new Error('Cropped image generation failed.'));
        return;
      }
       // Optional: Set desired output format and quality
      resolve(blob);
    }, 'image/jpeg', 0.9); // Adjust format/quality as needed (e.g., image/png)
  });
}


const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageUrl, originalFilename, onClose, onSave }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCrop = async () => {
        if (!croppedAreaPixels || !imageUrl) {
            toast.error("Could not determine crop area.");
            return;
        }
        setIsProcessing(true);
        const toastId = toast.loading("Processing cropped image...");
        try {
            const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
            if (!croppedBlob) {
                throw new Error("Failed to generate cropped image blob.");
            }
            await onSave(croppedBlob); // Call the parent save function
            // Success toast is handled by the caller (onSave) after successful backend interaction
            onClose(); // Close modal after onSave completes (whether success or handled error)
        } catch (error: any) {
            console.error("Error cropping image:", error);
            // Don't automatically dismiss loading toast here, caller might want to show success/error
            toast.error(`Error: ${error.message || 'Failed to crop image.'}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 transition-opacity duration-300" // Higher z-index
            onClick={onClose} 
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} 
            >
                 {/* Header */}
                 <div className="flex justify-between items-center p-4 border-b border-gray-700 text-gray-200">
                     <h2 className="text-lg font-semibold flex items-center"><FaCropAlt className="mr-2 text-primary"/> Crop Image</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700" title="Close"><FaTimes size={20} /></button>
                 </div>

                 {/* Cropper Area */}
                 <div className="relative flex-grow h-[60vh] bg-gray-900">
                     <Cropper
                         image={imageUrl}
                         crop={crop}
                         zoom={zoom}
                         aspect={16 / 9} // Default aspect ratio, make this configurable later
                         onCropChange={setCrop}
                         onZoomChange={setZoom}
                         onCropComplete={onCropComplete}
                         // You might need to add more props for specific behavior
                     />
                 </div>

                 {/* Controls & Actions */}
                 <div className="p-4 bg-gray-700 border-t border-gray-600 flex flex-wrap justify-between items-center gap-4">
                     <div className="flex items-center gap-2">
                         <label htmlFor="zoomSlider" className="text-sm text-gray-300">Zoom:</label>
                         <input
                             id="zoomSlider"
                             type="range"
                             min={1}
                             max={3}
                             step={0.1}
                             value={zoom}
                             onChange={(e) => setZoom(Number(e.target.value))}
                             className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                             disabled={isProcessing}
                         />
                     </div>
                     {/* Add Aspect Ratio controls later */}
                     <div className="flex gap-3">
                         <button 
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-500 rounded-lg shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 disabled:opacity-50"
                         >
                             Cancel
                         </button>
                         <button 
                            onClick={handleSaveCrop}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-dark bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-800 disabled:opacity-50"
                         >
                            {isProcessing ? 'Processing...' : 'Apply Crop'}
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default ImageCropModal; 