'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import Select, { StylesConfig, OnChangeValue, MultiValue, SingleValue } from 'react-select'; 
import { FaPaperPlane, FaSpinner, FaTimes, FaUpload } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash.debounce';
import { useDropzone } from 'react-dropzone';

// Types from template page (can be moved to a types file)
interface EmailTemplateItem {
    _id: string;
    name: string;
    subject: string;
    body: string;
}
interface UserOption {
    value: string; // User ID
    label: string; // User Name or Email
}

// Import shared editor
import TiptapEditor from '@/app/components/TiptapEditor';

const AdminSendMailPage: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
    const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateItem | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Fetch templates
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const response = await fetch('/api/admin/mails/templates');
                if (!response.ok) throw new Error('Failed to fetch templates');
                const data = await response.json();
                if (data.success) {
                    setTemplates(data.templates as EmailTemplateItem[]);
                } else { throw new Error(data.error || 'Failed'); }
            } catch (err) { toast.error('Could not load templates.'); console.error(err); }
            setLoadingTemplates(false);
        };
        fetchTemplates();
    }, []);

    // Handle template selection
    const handleTemplateChange = (selectedOption: SingleValue<{ value: string; label: string; template: EmailTemplateItem }>) => {
        if (selectedOption) {
            setSelectedTemplate(selectedOption.template);
            setSubject(selectedOption.template.subject);
            setBody(selectedOption.template.body || '');
        } else {
            setSelectedTemplate(null);
            setSubject('');
            setBody('');
        }
    };

    // Remove an attachment
    const removeAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(file => file.name !== fileName));
    };

    // --- Dropzone Setup ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Append new files, could add checks for duplicates or limits here
        setAttachments(prev => [...prev, ...acceptedFiles]);
        toast.success(`${acceptedFiles.length} file(s) added.`);
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        multiple: true,
        noClick: true, // Prevent default click behavior, we might use a button
        noKeyboard: true, // Prevent keyboard activation
        // Add accept prop if needed (e.g., accept: { 'image/*': [], 'application/pdf': ['.pdf'] })
    });
    // -------------------

    // --- User Search Logic for AsyncSelect ---
    const loadUsers = async (inputValue: string): Promise<UserOption[]> => {
        if (!inputValue || inputValue.length < 2) { // Only search if input > 1 char
            return [];
        }
        try {
            const response = await fetch(`/api/admin/users/list-for-select?search=${encodeURIComponent(inputValue)}`);
            if (!response.ok) {
                console.error('Failed to search users:', response.statusText);
                return []; // Return empty on error
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.users)) {
                return data.users; // API already returns { value, label }
            } else {
                console.error('Invalid user search response:', data);
                return [];
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to search users.');
            return [];
        }
    };

    // Debounce the loadUsers function (e.g., 500ms delay)
    const debouncedLoadUsers = useCallback(debounce(loadUsers, 500), []);
    // --------------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body || body.trim() === '<p></p>' || body.trim() === '') {
            toast.error('Subject and Body are required.');
            return;
        }
        if (target === 'specific' && selectedUsers.length === 0) { 
            toast.error('Select users for specific target.'); 
            return; 
        }

        setIsSubmitting(true);
        try {
            const bodyHtml = body;
            const payload = {
                subject,
                body: bodyHtml,
                target,
                templateId: selectedTemplate?._id,
                userIds: target === 'specific' ? selectedUsers.map(u => u.value) : undefined,
            };

            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('body', bodyHtml);
            formData.append('target', target);

            if (target === 'specific') {
                selectedUsers.forEach((user) => {
                    formData.append('recipients[]', user.value);
                });
            }

            attachments.forEach((file) => {
                formData.append('attachments', file);
            });

            const response = await fetch('/api/admin/mails/send', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to send mail');

            if (result.success) {
                toast.success(result.message || 'Mail processing started successfully!');
                setSubject('');
                setBody('');
                setSelectedUsers([]);
                setSelectedTemplate(null);
                setTarget('all');
                setAttachments([]);
            } else {
                toast.error(result.message || 'An error occurred during sending.');
            }

        } catch (err: any) {
            toast.error(err.message || 'An unexpected error occurred.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Define react-select styles using theme colors (Ensure this replaces the old one)
    const selectStyles: StylesConfig<any, any> = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#0A0A0A', // dark
            borderColor: state.isFocused ? '#FFD700' : 'rgba(255, 215, 0, 0.3)', // primary or primary/30
            borderWidth: '1px',
            boxShadow: state.isFocused ? `0 0 0 1px #FFD700` : 'none', // Ring effect
            padding: '0.1rem', 
            minHeight: '42px',
            '&:hover': { borderColor: '#FFD700' }, // primary
        }),
        menu: (provided) => ({ ...provided, backgroundColor: '#0A0A0A', border: '1px solid rgba(255, 215, 0, 0.3)', zIndex: 50 }), // dark, primary/30
        option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#FFD700' : state.isFocused ? 'rgba(255, 215, 0, 0.1)' : '#0A0A0A', color: state.isSelected ? '#121212' : '#FFFFFF', '&:active': { backgroundColor: '#FFD700', color: '#121212' }, cursor: 'pointer' }), // primary, primary/10, dark, secondary, light
        singleValue: (provided) => ({ ...provided, color: '#FFFFFF' }), // light
        multiValue: (provided) => ({ ...provided, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: '4px' }), // primary/20
        multiValueLabel: (provided) => ({ ...provided, color: '#FFD700', paddingRight: '6px' }), // primary
        multiValueRemove: (provided) => ({ ...provided, color: 'rgba(255, 215, 0, 0.7)', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', '&:hover': { backgroundColor: '#FF4500', color: '#FFFFFF' } }), // primary/70, accent, light
        placeholder: (provided) => ({ ...provided, color: 'rgba(255, 255, 255, 0.5)' }), // white/50
        input: (provided) => ({ ...provided, color: '#FFFFFF' }), // light
        indicatorSeparator: (provided) => ({ ...provided, backgroundColor: 'rgba(255, 215, 0, 0.3)' }), // primary/30
        dropdownIndicator: (provided) => ({ ...provided, color: 'rgba(255, 215, 0, 0.7)', '&:hover': { color: '#FFD700' } }), // primary/70 -> primary
        clearIndicator: (provided) => ({ ...provided, color: 'rgba(255, 215, 0, 0.7)', '&:hover': { color: '#FFD700' } }), // primary/70 -> primary
    };

    const templateOptions = templates.map(t => ({ value: t._id, label: t.name, template: t }));

    return (
        <div className="p-4 md:p-6">
             <h1 className="section-title">Send Mail</h1>
             <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-secondary rounded-lg border border-primary/20">
                <div>
                    <label htmlFor="templateSelect" className="label">Load Template (Optional)</label>
                    <Select
                        id="templateSelect"
                        instanceId="admin-select-template"
                        options={templateOptions}
                        value={selectedTemplate ? { value: selectedTemplate._id, label: selectedTemplate.name, template: selectedTemplate } : null}
                        onChange={handleTemplateChange}
                        isLoading={loadingTemplates}
                        isClearable
                        placeholder="Select a template..."
                        styles={selectStyles} // Apply themed styles
                        className="basic-single-select mt-1" 
                        classNamePrefix="react-select"
                    />
                </div>
                
                 <div>
                    <label htmlFor="subject" className="label">Subject *</label>
                    <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field mt-1" required />
                </div>
                <div>
                    <label className="label">Body *</label>
                    <div className="mt-1 w-full bg-dark text-white border border-primary/30 rounded-md focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent overflow-hidden">
                        <TiptapEditor
                            content={body}
                            onChange={(newContent: string) => setBody(newContent)}
                            placeholder="Compose your email body here..."
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Tip: Use placeholders like {'{{user.name}}'} or {'{{user.email}}'}. The backend will replace them.</p>
                </div>
                
                {/* --- Target Selection --- */}
                <div>
                    <label className="label">Recipient Target *</label>
                    <div className="mt-1 flex space-x-4">
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                className="form-radio bg-dark border-primary/30 text-primary focus:ring-primary focus:ring-offset-secondary"
                                name="target"
                                value="all"
                                checked={target === 'all'}
                                onChange={() => setTarget('all')}
                            />
                            <span className="ml-2 label !mb-0">All Users</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                className="form-radio bg-dark border-primary/30 text-primary focus:ring-primary focus:ring-offset-secondary"
                                name="target"
                                value="specific"
                                checked={target === 'specific'}
                                onChange={() => setTarget('specific')}
                            />
                            <span className="ml-2 label !mb-0">Specific Users</span>
                        </label>
                    </div>
                </div>

                {/* --- Specific User Selection (NOW ASYNC) --- */}
                {target === 'specific' && (
                    <div>
                        <label htmlFor="userSelect" className="label">Search & Select Users *</label>
                        <AsyncSelect
                            id="userSelect"
                            instanceId="admin-select-users-async"
                            isMulti
                            cacheOptions 
                            defaultOptions 
                            loadOptions={debouncedLoadUsers} 
                            value={selectedUsers}
                            onChange={(selected) => setSelectedUsers(selected as UserOption[])}
                            placeholder="Type to search users by name or email..."
                            styles={selectStyles} // Apply themed styles
                            className="basic-multi-select mt-1"
                            classNamePrefix="react-select"
                            required={target === 'specific'}
                            noOptionsMessage={({ inputValue }) => 
                                !inputValue || inputValue.length < 2 ? "Type 2+ characters to search" : "No users found"
                            }
                            loadingMessage={() => "Searching..."}
                        />
                    </div>
                )}

                {/* --- Attachments (Dropzone) --- */}
                <div>
                    <label className="label">Attachments</label>
                    {/* Dropzone Area */}
                    <div 
                        {...getRootProps()} 
                        className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer 
                          ${isDragActive ? 'border-primary bg-primary/10' : 'border-primary/30 hover:border-primary/50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="text-center text-white/70">
                            <FaUpload className="mx-auto h-8 w-8 mb-2" />
                            {isDragActive ? (
                                <p>Drop the files here ...</p>
                            ) : (
                                <p>Drag & drop some files here, or <button type="button" onClick={open} className="text-primary font-semibold hover:underline focus:outline-none">click to select files</button></p>
                            )}
                            {/* Optional: Add file type/size hints */}
                            {/* <p className="text-xs text-white/50 mt-1">Max 5MB per file</p> */}
                        </div>
                    </div>
                    
                     {/* Display selected file names (Keep existing logic) */}
                    {attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-white/50">Selected files:</p>
                            <ul className="list-disc list-inside text-sm text-white/80">
                                {attachments.map(file => (
                                    <li key={`${file.name}-${file.lastModified}`} className="flex justify-between items-center"> {/* Improve key */}
                                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                        <button 
                                            type="button"
                                            onClick={() => removeAttachment(file.name)} // Consider removing by index or a unique ID if names clash
                                            className="text-accent hover:text-red-400 ml-2 p-1 rounded-full hover:bg-accent/10 transition-colors"
                                            title="Remove file"
                                        >
                                            <FaTimes size={12}/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* --- Submit Button --- */}
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={isSubmitting || (target === 'specific' && selectedUsers.length === 0)}
                        className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane className="-ml-1 mr-2 h-4 w-4" />
                                Send Mail
                            </>
                        )}
                    </button>
                </div>
             </form>
        </div>
    );
};

export default AdminSendMailPage; 