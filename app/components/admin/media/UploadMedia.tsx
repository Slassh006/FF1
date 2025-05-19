'use client';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMediaStore } from '@/store/mediaStore'; // Adjust path
import { motion } from 'framer-motion';
import { UploadCloud, X, File as FileIcon } from 'lucide-react'; // Example icons
import { MediaState } from '@/types/media'; // Import MediaState

const UploadMedia: React.FC = () => {
    const {
        addFilesToUpload,
        uploadQueue,
        processUploadQueue,
        removeFileFromUpload,
        uploadProgress
    } = useMediaStore();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        addFilesToUpload(acceptedFiles);
    }, [addFilesToUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        // accept: { // Example accept prop
        //   'image/*': ['.jpeg', '.png', '.gif'],
        //   'video/*': ['.mp4', '.mov']
        // }
    });

    const handleUploadClick = () => {
        if (uploadQueue.length > 0) {
            processUploadQueue();
        }
    };

    // Selectors with explicit state type
    const isUploading = useMediaStore((state: MediaState) => state.isLoading && state.uploadQueue.length > 0);
    const currentQueue = useMediaStore((state: MediaState) => state.uploadQueue);
    const currentProgress = useMediaStore((state: MediaState) => state.uploadProgress);

    return (
        <div className="mb-6 space-y-4">
            <div
                {...getRootProps()}
                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out
                 ${isDragActive ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}`}
            >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                {isDragActive ? (
                    <p className="mt-2 text-primary">Drop the files here ...</p>
                ) : (
                    <p className="mt-2 text-gray-500">Drag 'n' drop some files here, or click to select files</p>
                )}
            </div>

            {currentQueue.length > 0 && (
                <div className="space-y-2">
                     <h3 className="text-lg font-semibold">Upload Queue:</h3>
                     {currentQueue.map((file: File) => ( // Add File type here
                        <div key={file.name} className="flex items-center justify-between p-2 bg-base-200 rounded">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                 <FileIcon className="h-5 w-5 flex-shrink-0 text-gray-500"/>
                                 <span className="truncate text-sm">{file.name}</span>
                                 {currentProgress[file.name] !== undefined && (
                                    <progress
                                        className="progress progress-primary w-20 h-2"
                                        value={currentProgress[file.name]}
                                        max="100"
                                    ></progress>
                                 )}
                            </div>
                            <button
                                 onClick={() => removeFileFromUpload(file.name)}
                                 className="btn btn-ghost btn-sm btn-circle"
                                 aria-label="Remove file"
                            >
                                 <X className="h-4 w-4" />
                            </button>
                        </div>
                     ))}
                    <button
                        onClick={handleUploadClick}
                        className="btn btn-primary w-full"
                        disabled={isUploading} // Use the selector variable
                    >
                        {isUploading ? 'Uploading...' : `Upload ${currentQueue.length} File(s)`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UploadMedia; 