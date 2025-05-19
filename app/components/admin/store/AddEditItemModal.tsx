'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaUpload, FaTimes, FaSpinner, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { StoreItem, StoreItemCategory, StoreItemFormData } from '@/app/types/store';

interface AddEditItemModalProps {
  item: StoreItem | null;
  onClose: () => void;
  onSave: () => void;
}

const BASE_API_URL = '/api/admin/store';

export default function AddEditItemModal({ item, onClose, onSave }: AddEditItemModalProps) {
  const getInitialFormData = useCallback((): StoreItemFormData => {
    if (item) {
      return {
        _id: item._id,
        name: item.name,
        description: item.description,
        category: item.category,
        coinCost: item.coinCost,
        imageUrl: item.imageUrl || '',
        redeemCode: item.redeemCode || '',
        rewardDetails: item.rewardDetails || '',
        inventory: item.inventory === null ? '' : item.inventory,
        isActive: item.isActive,
      };
    } else {
      return {
        name: '',
        description: '',
        category: StoreItemCategory.REDEEM_CODE,
        coinCost: '',
        imageUrl: '',
        redeemCode: '',
        rewardDetails: '',
        inventory: '',
        isActive: true,
      };
    }
  }, [item]);

  const [formData, setFormData] = useState<StoreItemFormData>(getInitialFormData);
  const [imagePreview, setImagePreview] = useState<string>(item?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData(getInitialFormData());
    setImagePreview(item?.imageUrl || '');
    setSelectedImageFile(null);
    setErrors({});
  }, [item, getInitialFormData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    const coinCostVal = Number(formData.coinCost);
    if (formData.coinCost === '' || isNaN(coinCostVal) || coinCostVal < 0) {
        newErrors.coinCost = 'Valid, non-negative Coin Cost is required';
    }

    const inventoryVal = formData.inventory === '' ? null : Number(formData.inventory);
    if (inventoryVal !== null && (isNaN(inventoryVal) || inventoryVal < 0)) {
        newErrors.inventory = 'Inventory must be a non-negative number or empty (for infinite)';
    }

    if (!item && !formData.imageUrl?.trim() && !selectedImageFile) {
      newErrors.imageUrl = 'Image URL or uploaded image is required for new items';
    }

    if (formData.category === StoreItemCategory.REDEEM_CODE && !formData.redeemCode?.trim()) {
      newErrors.redeemCode = 'Redeem Code is required for this category';
    }

    if (formData.category === StoreItemCategory.DIGITAL_REWARD && !formData.rewardDetails?.trim()) {
      newErrors.rewardDetails = 'Reward Details are required for this category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      setErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    let finalImageUrl = formData.imageUrl?.trim() || '';

    try {
      if (selectedImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedImageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: imageFormData });
        if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.error || 'Failed to upload image');
        }
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData?.data?.url;
        if (!finalImageUrl) {
             throw new Error('Image URL not returned after upload.');
        }
      }

      const payload: Omit<StoreItemFormData, 'imageUrl' | '_id'> & { imageUrl?: string, coinCost: number, inventory: number | null } = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        coinCost: Number(formData.coinCost),
        inventory: formData.inventory === '' ? null : Number(formData.inventory),
        isActive: formData.isActive,
        imageUrl: finalImageUrl || undefined,
        redeemCode: formData.category === StoreItemCategory.REDEEM_CODE ? formData.redeemCode?.trim() : undefined,
        rewardDetails: formData.category === StoreItemCategory.DIGITAL_REWARD ? formData.rewardDetails?.trim() : undefined,
      };

      Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);

      const url = item ? `${BASE_API_URL}/${item._id}` : BASE_API_URL;
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${item ? 'update' : 'create'} item`);
      }

      toast.success(`Item ${item ? 'updated' : 'created'} successfully`);
      onSave();

    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof StoreItemFormData) =>
    `w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[field] ? 'border-red-500 ring-red-500' : ''}`;

  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
       <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-700">
         <div className="p-6">
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
             <h2 className="text-2xl font-bold text-white">
               {item ? 'Edit Item' : 'Add New Item'}
             </h2>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal" disabled={loading}>
               <FaTimes size={20} />
             </button>
           </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className={labelClass}>Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={inputClass('name')} disabled={loading} required />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="description" className={labelClass}>Description *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className={inputClass('description')} disabled={loading} required />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="category" className={labelClass}>Category *</label>
                    <select id="category" name="category" value={formData.category} onChange={handleInputChange} className={inputClass('category')} disabled={loading}>
                         {Object.values(StoreItemCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="coinCost" className={labelClass}>Coin Cost *</label>
                    <input type="number" id="coinCost" name="coinCost" value={formData.coinCost} onChange={handleInputChange} min="0" step="1" className={inputClass('coinCost')} disabled={loading} required />
                    {errors.coinCost && <p className="mt-1 text-sm text-red-500">{errors.coinCost}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="inventory" className={labelClass}>Inventory (empty for infinite)</label>
                    <input 
                        type="number" 
                        id="inventory" 
                        name="inventory" 
                        value={formData.inventory ?? ''.toString()}
                        onChange={handleInputChange} 
                        min="0" 
                        step="1" 
                        placeholder="Empty for Infinite" 
                        className={inputClass('inventory')} 
                        disabled={loading} 
                    />
                    {errors.inventory && <p className="mt-1 text-sm text-red-500">{errors.inventory}</p>}
                </div>
                 <div className="flex items-center space-x-3 mt-2 md:mt-0 pb-1">
                     <label htmlFor="isActive" className={labelClass}>Status:</label>
                    <button type="button" onClick={handleToggleActive} className={`flex items-center px-3 py-1 rounded-full text-sm font-semibold ${formData.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'} text-white transition-colors`} disabled={loading}>
                        {formData.isActive ? <FaToggleOn className="mr-2" /> : <FaToggleOff className="mr-2" />}
                        {formData.isActive ? 'Active' : 'Inactive'}
                     </button>
                </div>
            </div>

             <div>
                <label className={labelClass}>Item Image {(!item && !imagePreview && !selectedImageFile) ? '*' : '(URL or Upload)'}</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="relative">
                        <input type="text" id="imageUrl" name="imageUrl" placeholder="Paste Image URL here" value={formData.imageUrl} onChange={handleInputChange} className={inputClass('imageUrl')} disabled={loading || !!selectedImageFile} />
                        {errors.imageUrl && !selectedImageFile && <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>}
                        {selectedImageFile && <p className="mt-1 text-sm text-gray-400 italic">Using uploaded file below.</p>}
                    </div>
                     <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-700 text-center">
                        {imagePreview ? (
                            <div className="relative w-24 h-24 mb-2">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border border-gray-500"/>
                                <button type="button" onClick={() => { setImagePreview(''); setSelectedImageFile(null); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700" disabled={loading} aria-label="Remove image">
                                    <FaTimes />
                                </button>
                            </div>
                        ) : (
                            <FaUpload className="h-8 w-8 text-gray-500 mb-2" />
                        )}
                        <label htmlFor="image-upload" className={`cursor-pointer px-3 py-1 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded transition-colors`}>
                            {imagePreview ? 'Change Upload' : 'Upload File'}
                            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={loading}/>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                         {errors.imageUrl && selectedImageFile && <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>}
                    </div>
                </div>
            </div>

            {formData.category === StoreItemCategory.REDEEM_CODE && (
                <div>
                    <label htmlFor="redeemCode" className={labelClass}>Redeem Code *</label>
                    <input type="text" id="redeemCode" name="redeemCode" value={formData.redeemCode} onChange={handleInputChange} className={inputClass('redeemCode')} disabled={loading} required />
                    {errors.redeemCode && <p className="mt-1 text-sm text-red-500">{errors.redeemCode}</p>}
                </div>
            )}

            {formData.category === StoreItemCategory.DIGITAL_REWARD && (
                <div>
                    <label htmlFor="rewardDetails" className={labelClass}>Reward Details *</label>
                    <textarea id="rewardDetails" name="rewardDetails" value={formData.rewardDetails} onChange={handleInputChange} rows={3} className={inputClass('rewardDetails')} disabled={loading} required />
                    {errors.rewardDetails && <p className="mt-1 text-sm text-red-500">{errors.rewardDetails}</p>}
                </div>
            )}

             <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                 <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors" disabled={loading}>
                    Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
                    {loading ? <FaSpinner className="animate-spin" /> : (item ? 'Update Item' : 'Create Item')}
                 </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 