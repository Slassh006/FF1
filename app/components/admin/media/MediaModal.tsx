'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useMediaStore } from '@/store/mediaStore';
import { MediaItem } from '@/types/media';
import NextImage from 'next/image';
import { X, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const MediaModal: React.FC = () => {
    const { isModalOpen, modalMode, selectedItem, closeModal, updateMedia, isLoading } = useMediaStore();
    const [newFilename, setNewFilename] = useState('');
    const [newAltText, setNewAltText] = useState('');
    const [newCaption, setNewCaption] = useState('');

    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (selectedItem) {
            setNewFilename(selectedItem.filename);
            setNewAltText(selectedItem.altText || '');
            setNewCaption(selectedItem.caption || '');
        } else {
            setNewFilename('');
            setNewAltText('');
            setNewCaption('');
        }
    }, [selectedItem]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (isModalOpen && dialog && !dialog.open) {
            dialog.showModal();
        } else if (!isModalOpen && dialog && dialog.open) {
            dialog.close();
        }
    }, [isModalOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        const handleClickOutside = (event: MouseEvent) => {
            if (dialog && event.target === dialog) {
                closeModal();
            }
        };
        if (dialog) {
            dialog.addEventListener('click', handleClickOutside);
        }
        return () => {
            if (dialog) {
                dialog.removeEventListener('click', handleClickOutside);
            }
        };
    }, [closeModal]);

    useEffect(() => {
        if(isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
             document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleSave = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!selectedItem) return;

        const changes: { filename?: string; altText?: string; caption?: string; } = {};
        const trimmedFilename = newFilename.trim();
        const trimmedAltText = newAltText.trim();
        const trimmedCaption = newCaption.trim();

        if (!trimmedFilename) {
            toast.error("Filename cannot be empty.");
            return;
        }

        if (trimmedFilename !== selectedItem.filename) { changes.filename = trimmedFilename; }
        if (trimmedAltText !== (selectedItem.altText || '')) { changes.altText = trimmedAltText; }
        if (trimmedCaption !== (selectedItem.caption || '')) { changes.caption = trimmedCaption; }

        if (Object.keys(changes).length === 0) {
            toast('No changes detected.', { duration: 2000 });
            return;
        }

        updateMedia(selectedItem.slug, changes);
    };

    if (!selectedItem) return null;

    const hasFilenameChanged = newFilename.trim() !== selectedItem.filename;
    const hasAltTextChanged = newAltText.trim() !== (selectedItem.altText || '');
    const hasCaptionChanged = newCaption.trim() !== (selectedItem.caption || '');
    const isSaveDisabled = isLoading ||
                           (!hasFilenameChanged && !hasAltTextChanged && !hasCaptionChanged) ||
                           !newFilename.trim();

    const renderPreviewOnlyContent = () => {
        if (selectedItem.type.startsWith('image/') && selectedItem.url && typeof selectedItem.url === 'string' && selectedItem.url.trim() !== '') {
            return (
                 <div className="relative w-full h-full flex items-center justify-center">
                    <NextImage
                        src={selectedItem.url + `?v=${new Date(selectedItem.uploadDate).getTime()}`}
                        alt={selectedItem.altText || selectedItem.filename}
                        width={800}
                        height={600}
                        style={{ width: 'auto', height: 'auto', maxHeight: 'calc(90vh - 150px)', maxWidth: '100%' }}
                        className="block object-contain"
                        priority
                    />
                 </div>
            );
        } else if (selectedItem.type.startsWith('video/')) {
            return (
                <video controls className="w-full max-h-[calc(90vh - 150px)] rounded" preload="metadata">
                    <source src={selectedItem.url} type={selectedItem.type} />
                    Your browser does not support the video tag.
                </video>
            );
        } else {
            return (
                 <div className="p-4 py-10 text-center bg-gray-900/50 rounded flex flex-col items-center justify-center h-full">
                     <FileText className="w-16 h-16 text-gray-500 mb-4"/>
                     <p className="mb-2 text-gray-400">Cannot preview this file type ({selectedItem.type}).</p>
                    <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="link link-primary mt-2 inline-block text-sm">
                         Download/View File
                    </a>
                </div>
            );
        }
    };

    return (
         <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle p-0" onClose={closeModal}>
            <div
                className="bg-gray-800 rounded-lg shadow-xl overflow-hidden w-11/12 max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-white">
                        {modalMode === 'edit' ? 'Edit Image Details' : 'Media Preview'}
                    </h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {selectedItem && selectedItem.url && typeof selectedItem.url === 'string' ? (
                    modalMode === 'edit' ? (
                        <div className="flex-grow p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-gray-900/50 rounded flex items-center justify-center p-2 min-h-[300px] max-h-[calc(90vh - 200px)] relative">
                                {selectedItem.url.trim() !== '' ? (
                                    <NextImage
                                        key={selectedItem.slug}
                                        src={selectedItem.url + `?v=${new Date(selectedItem.uploadDate).getTime()}`}
                                        alt={newAltText || selectedItem.filename}
                                        width={600}
                                        height={600}
                                        style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 220px)', objectFit: 'contain' }}
                                        className="block mx-auto"
                                        priority
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
                                    />
                                ) : (
                                    <div className="text-gray-500">Invalid image URL</div>
                                )}
                            </div>
                            <div className="md:col-span-1 space-y-4">
                                <div>
                                    <label htmlFor="filename" className="block text-sm font-medium text-gray-300 mb-1">Filename</label>
                                    <input
                                        type="text"
                                        id="filename"
                                        value={newFilename}
                                        onChange={(e) => setNewFilename(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="altText" className="block text-sm font-medium text-gray-300 mb-1">Alt Text</label>
                                    <input
                                        type="text"
                                        id="altText"
                                        value={newAltText}
                                        onChange={(e) => setNewAltText(e.target.value)}
                                        placeholder="Describe the image for accessibility"
                                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Describe the image for screen readers.</p>
                                </div>
                                <div>
                                    <label htmlFor="caption" className="block text-sm font-medium text-gray-300 mb-1">Caption</label>
                                    <textarea
                                        id="caption"
                                        value={newCaption}
                                        onChange={(e) => setNewCaption(e.target.value)}
                                        placeholder="Optional caption text"
                                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 h-20 resize-none"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-1">Details</h4>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                        <li><strong>URL:</strong> <span className="break-all select-all cursor-pointer hover:text-primary" title="Copy URL" onClick={() => copyUrlToClipboard(selectedItem.url)}>{selectedItem.url}</span></li>
                                        <li><strong>Type:</strong> {selectedItem.type}</li>
                                        <li><strong>Size:</strong> {formatBytes(selectedItem.size)}</li>
                                        <li><strong>Uploaded:</strong> {new Date(selectedItem.uploadDate).toLocaleString()}</li>
                                        <li><strong>Original Alt:</strong> {selectedItem.altText || '-'}</li>
                                        <li><strong>Original Caption:</strong> {selectedItem.caption || '-'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow p-5 overflow-y-auto bg-gray-900/50 flex items-center justify-center">
                            {renderPreviewOnlyContent()}
                        </div>
                    )
                ) : (
                    <div className="flex-grow p-5 flex items-center justify-center text-gray-500">Loading details...</div>
                )}

                <div className="flex justify-end items-center p-4 border-t border-gray-700 bg-gray-800 space-x-3 flex-shrink-0">
                    <button
                        onClick={closeModal}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 disabled:opacity-50"
                    >
                        {modalMode === 'edit' ? 'Cancel' : 'Close'}
                    </button>
                    {modalMode === 'edit' && selectedItem && (
                        <button
                            onClick={handleSave}
                            disabled={isSaveDisabled}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {isLoading ? <span className="loading loading-spinner loading-xs mr-2"></span> : <Save className="w-4 h-4 mr-2"/>}
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={closeModal}>close</button>
            </form>
         </dialog>
    );
};

const copyUrlToClipboard = (url: string) => {
    if (!url) {
        toast.error('Cannot copy empty URL.');
        return;
    }
    const absoluteUrl = url.startsWith('http') ? url : window.location.origin + (url.startsWith('/') ? url : '/' + url);
    navigator.clipboard.writeText(absoluteUrl)
        .then(() => toast.success('URL copied!'))
        .catch(err => {
            console.error('Failed to copy URL: ', err);
            toast.error('Failed to copy URL.');
        });
};

export default MediaModal;