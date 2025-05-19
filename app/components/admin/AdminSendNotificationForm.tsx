'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Select, { 
    StylesConfig, 
    OnChangeValue, 
    MultiValue, 
    CSSObjectWithLabel, 
    OptionProps,
    MultiValueProps,
    GroupBase
} from 'react-select'; // Using react-select for multi-user selection
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

// Assume User type/interface is available or define a basic one
interface UserOption {
    value: string; // User ID
    label: string; // User Name or Email
}

interface AdminSendNotificationFormProps {
    // Props if needed, e.g., for closing a modal
}

const AdminSendNotificationForm: React.FC<AdminSendNotificationFormProps> = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch users for the dropdown when target is 'specific'
    useEffect(() => {
        const fetchUsers = async () => {
            if (target === 'specific') {
                setLoadingUsers(true);
                try {
                    // Assuming an API endpoint exists to fetch users for selection
                    const response = await fetch('/api/admin/users/list-for-select'); // Needs implementation
                    if (!response.ok) throw new Error('Failed to fetch users');
                    const data = await response.json();
                    if (data.success) {
                         // Format data for react-select
                        const options = data.users.map((user: { _id: string; name?: string; email: string }) => ({
                            value: user._id,
                            label: user.name ? `${user.name} (${user.email})` : user.email
                        }));
                        setUserOptions(options);
                    } else {
                        throw new Error(data.error || 'Failed to fetch users');
                    }
                } catch (err) {
                    toast.error('Could not load user list.');
                    console.error(err);
                    setUserOptions([]); // Clear options on error
                }
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [target]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) {
            toast.error('Title and Message are required.');
            return;
        }
        if (target === 'specific' && selectedUsers.length === 0) {
            toast.error('Please select at least one user for specific targeting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                message,
                link: link || undefined,
                target,
                userIds: target === 'specific' ? selectedUsers.map(u => u.value) : undefined,
            };

            const response = await fetch('/api/admin/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send notification');
            }

            toast.success(result.message || 'Notification sent successfully!');
            // Reset form
            setTitle('');
            setMessage('');
            setLink('');
            setTarget('all');
            setSelectedUsers([]);

        } catch (err: any) {
            toast.error(err.message || 'An error occurred.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";

    // Define styles config type and type parameters in style functions
    const selectStyles: StylesConfig<UserOption, true> = { 
        control: (base: CSSObjectWithLabel) => ({ 
            ...base, 
            backgroundColor: 'var(--color-dark)', 
            borderColor: 'var(--color-gray-700)' 
        }),
        menu: (base: CSSObjectWithLabel) => ({ 
            ...base, 
            backgroundColor: 'var(--color-secondary)' 
        }),
        // Type state and base for option
        option: (base: CSSObjectWithLabel, state: OptionProps<UserOption, true>) => ({ 
            ...base, 
            backgroundColor: state.isFocused ? 'var(--color-primary-alpha-10)' : state.isSelected ? 'var(--color-primary)' : 'var(--color-secondary)', 
            color: state.isSelected ? 'var(--color-dark)' : 'var(--color-text-primary)', 
            ':active': {
                ...base[':active'], // Ensure base active styles are preserved if needed
                backgroundColor: state.isSelected ? 'var(--color-primary)' : 'var(--color-primary-alpha-20)'
            }
        }),
        // Type base for multiValue
        multiValue: (base: CSSObjectWithLabel, props: MultiValueProps<UserOption>) => ({ 
            ...base, 
            backgroundColor: 'var(--color-primary-alpha-20)' 
        }),
        // Type base for multiValueLabel
        multiValueLabel: (base: CSSObjectWithLabel, props: MultiValueProps<UserOption>) => ({ 
            ...base, 
            color: 'var(--color-text-primary)' 
        }),
        // Add types for other parts if needed (e.g., input, placeholder)
        input: (base: CSSObjectWithLabel) => ({
            ...base,
            color: 'var(--color-text-primary)' // Ensure input text is visible
        }),
         placeholder: (base: CSSObjectWithLabel) => ({
            ...base,
            color: 'var(--color-text-secondary)' // Style placeholder text
        }),
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-secondary rounded-lg border border-primary/20">
            <div>
                <label htmlFor="title" className={labelClass}>Title *</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                    required
                    maxLength={150}
                />
            </div>
            <div>
                <label htmlFor="message" className={labelClass}>Message *</label>
                <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={inputClass}
                    required
                    maxLength={1000}
                />
            </div>
            <div>
                <label htmlFor="link" className={labelClass}>Optional Link URL</label>
                <input
                    id="link"
                    type="url"
                    placeholder="https://example.com/some-page"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div>
                <label className={labelClass}>Target Users *</label>
                <div className="flex gap-4">
                    <label className="flex items-center">
                        <input type="radio" name="target" value="all" checked={target === 'all'} onChange={() => setTarget('all')} className="text-primary focus:ring-primary"/>
                        <span className="ml-2 text-white/90">All Users</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="target" value="specific" checked={target === 'specific'} onChange={() => setTarget('specific')} className="text-primary focus:ring-primary"/>
                        <span className="ml-2 text-white/90">Specific Users</span>
                    </label>
                </div>
            </div>

            {target === 'specific' && (
                <div>
                    <label htmlFor="users" className={labelClass}>Select Users *</label>
                    <Select<UserOption, true> // Specify type parameters for Select
                        id="users"
                        instanceId="admin-select-users-notify"
                        isMulti
                        options={userOptions}
                        value={selectedUsers}
                        // Type the 'selected' parameter in onChange
                        onChange={(selected: OnChangeValue<UserOption, true>) => setSelectedUsers(selected as MultiValue<UserOption>)}
                        isLoading={loadingUsers}
                        placeholder="Search or select users..."
                        className="text-black basic-multi-select" 
                        classNamePrefix="react-select"
                        styles={selectStyles} // Apply typed styles
                    />
                </div>
            )}

            <div className="text-right">
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-dark bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                    {isSubmitting ? <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <FaPaperPlane className="-ml-1 mr-2 h-5 w-5" />}
                    Send Notification
                </button>
            </div>
        </form>
    );
};

export default AdminSendNotificationForm; 