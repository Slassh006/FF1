import React, { useState, useEffect } from 'react';
import { FaTimes, FaExternalLinkAlt, FaUndo, FaSpinner } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast'; // Import toast for confirmation potentially
import LoadingSpinner from '../../../app/components/LoadingSpinner'; // <-- Import new spinner

// Assuming MediaAsset interface is defined here or imported
interface MediaAsset {
    _id: string;
    filename_original: string;
    url_original: string;
    type: string;
    mimeType: string;
    createdAt: string;
    uploader?: {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
    };
    size_original?: number;
    resolution?: string;
    gridfs_id_edited?: string | null;
    url_edited?: string | null;
    // Add other potential fields like tags, url_compressed, url_edited if needed
}

interface MetadataModalProps {
    asset: MediaAsset | null;
    onClose: () => void;
    onRestoreOriginal: (assetId: string) => Promise<void>; // Pass full asset or just ID?
    isRestoring: boolean; // <-- Add prop type
}

// Helper function to format bytes (can be moved to a utils file later)
const formatBytes = (bytes?: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const MetadataModal: React.FC<MetadataModalProps> = ({ asset, onClose, onRestoreOriginal, isRestoring }) => {
    // State to control which preview is shown
    const [showEditedPreview, setShowEditedPreview] = useState(false);

    // Effect to set initial preview state when asset changes
    useEffect(() => {
        if (asset?.gridfs_id_edited) {
            setShowEditedPreview(true); // Default to showing edited if available
        } else {
            setShowEditedPreview(false); // Otherwise show original
        }
    }, [asset]); // Rerun when the asset prop changes

    if (!asset) return null;

    const hasEditedVersion = !!asset.gridfs_id_edited;
    const previewUrl = showEditedPreview ? asset.url_edited : asset.url_original;

    // Restore Handler within Modal
    const handleRestoreClick = () => {
        if (asset && asset.gridfs_id_edited && !isRestoring) {
            if (window.confirm("Are you sure you want to restore the original image? This will permanently delete the edited version.")) {
                onRestoreOriginal(asset._id);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose} // Close on overlay click
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
            >
                {/* Image Preview Section */}
                <div className="md:w-1/2 p-4 flex flex-col items-center justify-center bg-gray-900">
                    <img 
                        key={previewUrl} // Add key to force re-render on src change
                        src={previewUrl || '/placeholder-image.png'} 
                        alt={showEditedPreview ? 'Edited Preview' : 'Original Preview'} 
                        className="max-w-full max-h-[70vh] md:max-h-[calc(90vh-100px)] object-contain mb-2"
                        onError={(e) => {(e.target as HTMLImageElement).src = '/placeholder-image.png';}}
                    />
                    {/* View Toggle Buttons */} 
                    {hasEditedVersion && (
                         <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                             <div className="flex space-x-2">
                                <button 
                                    onClick={() => setShowEditedPreview(false)}
                                    disabled={!showEditedPreview}
                                    className={`px-3 py-1 text-xs rounded ${!showEditedPreview ? 'bg-primary text-dark' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    View Original
                                </button>
                                <button 
                                    onClick={() => setShowEditedPreview(true)}
                                    disabled={showEditedPreview}
                                    className={`px-3 py-1 text-xs rounded ${showEditedPreview ? 'bg-primary text-dark' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    View Edited
                                </button>
                            </div>
                            <button 
                                onClick={handleRestoreClick}
                                className="text-sm text-yellow-400 hover:text-yellow-300 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isRestoring} // <-- Disable when restoring
                                title="Restore Original Version"
                            >
                                {isRestoring ? (
                                    // Use new spinner (small)
                                    <LoadingSpinner size="small" className="mr-1.5" /> 
                                ) : (
                                    <FaUndo className="mr-1.5" size={12} />
                                )}
                                {isRestoring ? 'Restoring...' : 'Restore Original'}
                            </button>
                         </div>
                     )}
                </div>

                {/* Metadata Details Section */}
                <div className="md:w-1/2 p-6 overflow-y-auto text-gray-300">
                    <div className="flex justify-end items-center mb-1">
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                            title="Close"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-primary font-orbitron mb-4">Asset Details</h2>
                    <div className="space-y-3 text-sm">
                        <DetailItem label="Filename" value={asset.filename_original} isCode />
                        <DetailItem label="Asset ID" value={asset._id} isCode />
                        <DetailItem label="Type" value={asset.type} capitalize />
                        <DetailItem label="MIME Type" value={asset.mimeType} />
                        <DetailItem label="Resolution" value={asset.resolution || 'N/A'} />
                        <DetailItem label="Original Size" value={formatBytes(asset.size_original)} />
                        <DetailItem label="Uploaded At" value={format(new Date(asset.createdAt), 'PPpp')} /> 
                        {/* Show Edited GridFS ID if it exists */} 
                        {asset.gridfs_id_edited && (
                             <DetailItem label="Edited File ID" value={asset.gridfs_id_edited} isCode />
                         )}
                        
                        <hr className="border-gray-600 my-4" />

                        <h3 className="text-lg font-semibold text-primary/90 font-orbitron">Uploader Info</h3>
                        {asset.uploader ? (
                            <>
                                <DetailItem label="Name" value={asset.uploader.name || 'N/A'} />
                                <DetailItem label="Email" value={asset.uploader.email || 'N/A'} />
                                <DetailItem label="Role" value={asset.uploader.role || 'N/A'} capitalize />
                                <DetailItem label="User ID" value={asset.uploader.id || 'N/A'} isCode />
                             </>
                        ) : (
                            <p className="text-gray-500 italic">Uploader information not available.</p>
                        )}
                        
                        {/* Add other fields like Tags, compressed/edited URLs later if needed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper sub-component for consistent detail display
interface DetailItemProps {
    label: string;
    value: string | number;
    capitalize?: boolean;
    isCode?: boolean;
}
const DetailItem: React.FC<DetailItemProps> = ({ label, value, capitalize = false, isCode = false }) => (
    <div className="flex flex-wrap justify-between">
        <span className="font-medium text-gray-400 mr-2">{label}:</span>
        <span className={`${isCode ? 'font-mono bg-gray-700 px-1 rounded text-primary/80' : ''} ${capitalize ? 'capitalize' : ''} text-right break-all`}>
            {value}
        </span>
    </div>
);

export default MetadataModal; 