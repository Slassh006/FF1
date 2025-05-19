'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  codeId: string;
  codeTitle: string;
}

const reportCategories = [
  { value: 'spam', label: 'Spam or Advertisement' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'broken', label: 'Broken or Invalid Code' },
  { value: 'duplicate', label: 'Duplicate Code' },
  { value: 'other', label: 'Other Issue' }
];

export default function ReportDialog({ isOpen, onClose, codeId, codeTitle }: ReportDialogProps) {
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !reason) {
      toast.error('Please select a category and provide a reason');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/craftland-codes/${codeId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          reason,
          details: details || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit report');
      }

      toast.success('Report submitted successfully');
      onClose();
      
      // Reset form
      setCategory('');
      setReason('');
      setDetails('');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-secondary p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium text-white">
                    Report Code: {codeTitle}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-white/50 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-dark text-white py-2 px-3 rounded-lg border border-primary/30 focus:border-primary focus:outline-none"
                      required
                    >
                      <option value="">Select a category</option>
                      {reportCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Reason *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-dark text-white py-2 px-3 rounded-lg border border-primary/30 focus:border-primary focus:outline-none"
                      rows={3}
                      placeholder="Please explain why you are reporting this code..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full bg-dark text-white py-2 px-3 rounded-lg border border-primary/30 focus:border-primary focus:outline-none"
                      rows={2}
                      placeholder="Any additional information that might help us review this report..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-white/80 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-lg ${
                        isSubmitting
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-black hover:bg-primary/80'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 