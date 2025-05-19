'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import PaginationControls from '../../components/common/PaginationControls';
import Modal from '../../components/common/Modal';
import TiptapEditor from '@/app/components/TiptapEditor';

// Interface for Template data (plain object)
interface EmailTemplateItem {
    _id: string;
    name: string;
    subject: string;
    body: string;
    createdBy?: { _id: string; name?: string; email: string }; // Optional populated data
    createdAt: string;
    updatedAt: string;
}

// --- Template Form Component (for Create/Edit) ---
interface TemplateFormProps {
    initialData?: EmailTemplateItem | null;
    onSave: (data: Partial<EmailTemplateItem>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ initialData, onSave, onCancel, isSaving }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [body, setBody] = useState(initialData?.body || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Template Name is required.');
            return;
        }
        if (!subject.trim()) {
            toast.error('Subject is required.');
            return;
        }
        if (!body || body.trim() === '<p></p>' || body.trim() === '') {
            toast.error('Body content is required.');
            return;
        }
        onSave({ _id: initialData?._id, name, subject, body });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="templateName" className="label">Template Name *</label>
                <input id="templateName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1" required maxLength={100} />
            </div>
            <div>
                <label htmlFor="templateSubject" className="label">Subject *</label>
                <input id="templateSubject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field mt-1" required maxLength={255} />
            </div>
             <div>
                <label htmlFor="templateBody" className="label">Body (HTML) *</label>
                <div className="mt-1 w-full bg-dark text-white border border-primary/30 rounded-md focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent overflow-hidden">
                    <TiptapEditor
                        content={body}
                        onChange={(newContent: string) => setBody(newContent)}
                        placeholder="Enter email body content here... Use HTML or the toolbar."
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1">Tip: Use placeholders like {'{{user.name}}'} or {'{{user.email}}'}. The backend will replace them.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-white/80 bg-dark hover:bg-gray-700 transition-colors border border-gray-600">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2">
                    {isSaving && <FaSpinner className="animate-spin"/>}
                    {initialData ? 'Save Changes' : 'Create Template'}
                </button>
            </div>
        </form>
    );
};

// --- Main Template Manager Component ---
const MailTemplateManager = () => {
    const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10; // Or make configurable

    const fetchTemplates = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            // Add pagination query parameters
            const response = await fetch(`/api/admin/mails/templates?page=${page}&limit=${itemsPerPage}`);
            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            if (data.success) {
                setTemplates(data.templates as EmailTemplateItem[]);
                // Assuming API returns pagination info
                setTotalPages(data.pagination?.totalPages || 1);
                setCurrentPage(data.pagination?.currentPage || page);
                setTotalItems(data.pagination?.totalItems || data.templates.length);
            } else {
                throw new Error(data.error || 'Failed to fetch templates');
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(`Error fetching templates: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates(currentPage);
    }, [fetchTemplates, currentPage]); // Re-fetch when currentPage changes

    const handleOpenModal = (template: EmailTemplateItem | null = null) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSaveTemplate = async (data: Partial<EmailTemplateItem>) => {
        setIsSaving(true);
        const isEditing = !!data._id;
        const url = isEditing ? `/api/admin/mails/templates/${data._id}` : '/api/admin/mails/templates';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} template`);
            }
            toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCloseModal();
            fetchTemplates(currentPage); // Re-fetch the *current* page list
        } catch (err: any) {
            toast.error(err.message);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`/api/admin/mails/templates/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete template');
            }
            toast.success('Template deleted successfully!');
            // Adjust fetching after delete: Go to previous page if current page becomes empty
            const newTotalItems = totalItems - 1;
            const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
            if (currentPage > 1 && templates.length === 1) {
                 // If it was the last item on a page > 1, go to previous page
                 fetchTemplates(currentPage - 1);
            } else {
                // Otherwise, re-fetch the current page (or page 1 if total pages reduced)
                fetchTemplates(Math.min(currentPage, newTotalPages > 0 ? newTotalPages : 1));
            }
            setTotalItems(newTotalItems); // Update total count immediately
        } catch (err: any) {
             toast.error(err.message);
             console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Manage Email Templates</h2>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/80 flex items-center gap-2">
                    <FaPlus /> Create New Template
                </button>
            </div>

            {loading && <div className="text-center p-6"><FaSpinner className="animate-spin text-primary text-3xl mx-auto"/></div>}
            {error && <div className="text-center p-6 text-red-400 bg-red-900/20 rounded-md">Error: {error}</div>}
            {!loading && !error && templates.length === 0 && (
                <div className="text-center p-6 text-white/50 bg-secondary rounded-md">No email templates found.</div>
            )}
            {!loading && !error && templates.length > 0 && (
                 <div className="overflow-x-auto bg-secondary rounded-lg shadow border border-primary/10">
                     <table className="min-w-full divide-y divide-primary/20">
                        <thead className="bg-dark/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Subject</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Last Updated</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                            {templates.map(template => (
                                <tr key={template._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{template.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">{template.subject}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{new Date(template.updatedAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button onClick={() => handleOpenModal(template)} className="text-primary hover:text-yellow-300 transition-colors" title="Edit"><FaEdit /></button>
                                        <button onClick={() => handleDeleteTemplate(template._id)} className="text-accent hover:text-red-400 transition-colors" title="Delete"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            )}
            {/* Add Pagination Controls */}
            {!loading && !error && totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page: number) => setCurrentPage(page)} // Update state on change
                    />
                </div>
            )}

            {/* Create/Edit Modal */} 
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTemplate ? 'Edit Template' : 'Create New Template'}>
                    <TemplateForm 
                        initialData={editingTemplate}
                        onSave={handleSaveTemplate}
                        onCancel={handleCloseModal}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
        </div>
    );
};

// --- Page Component ---
export default function AdminMailTemplatesPage() {
    // This page uses the client component to handle logic
    return (
        <div> 
            {/* Assuming AdminLayout provides overall structure */}
            <MailTemplateManager />
        </div>
    );
} 