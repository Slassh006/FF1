'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Define user type based on API response/model
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'subscriber'; // Assuming these roles
  coins: number;
  permissions: string[];
  isAdmin: boolean; // Keep isAdmin for potential display logic, but sync with role
  isBlocked?: boolean; // Add if needed based on your model
  isActive?: boolean; // Add if needed
  // Add other fields as needed
}

// Define available roles and permissions (adjust as needed)
const availableRoles = ['admin', 'subscriber'];
const availablePermissions = [
    'read:blogs', 'write:blogs', 
    'read:wallpapers', 'write:wallpapers', 
    'read:users', 'write:users', 
    'read:orders', 'write:orders', 
    'manage:settings'
];

export default function EditUserPage() {
  // Get params using the hook
  const params = useParams();
  const id = params.id as string; // Get ID and assert as string
  
  const { data: session, status: sessionStatus, update } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({}); // Use partial for form state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/admin/login');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
      toast.error('Unauthorized access.');
      router.replace('/admin');
    }
  }, [session, sessionStatus, router]);

  // Fetch user data
  useEffect(() => {
    if (!id || sessionStatus !== 'authenticated') return;

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user data');
        }
        const fetchedUser: UserData = await response.json();
        setUser(fetchedUser);
        // Initialize form data with fetched user data
        setFormData({
            name: fetchedUser.name,
            role: fetchedUser.role,
            coins: fetchedUser.coins,
            permissions: fetchedUser.permissions || [],
            // Add isBlocked/isActive if they exist in UserData
            // isBlocked: fetchedUser.isBlocked ?? false, 
            // isActive: fetchedUser.isActive ?? true, 
        });
      } catch (err: any) {
        console.error("Fetch User Error:", err);
        setError(err.message);
        toast.error(`Error loading user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, sessionStatus]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle numeric input changes (e.g., coins)
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  // Handle permissions checkbox changes
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (checked) {
        return { ...prev, permissions: [...currentPermissions, value] };
      } else {
        return { ...prev, permissions: currentPermissions.filter(p => p !== value) };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Client-side Validation --- 
    if (!formData.name?.trim()) {
        toast.error('Name field cannot be empty.');
        return; // Prevent submission
    }
    if (!formData.role) {
        toast.error('Please select a valid role.');
        return; // Prevent submission
    }
    // Add more specific validation if needed (e.g., coin limits?)
    // -------------------------------

    setIsSubmitting(true);
    setError(null);

    try {
        // Prepare data for PATCH request
        const updateData: Partial<UserData> = { 
            name: formData.name, 
            role: formData.role,
            permissions: formData.permissions
            // Add other fields like isBlocked/isActive if they are part of formData
        }; 

        // Handle coins conversion safely
        const coinsValue = formData.coins;
        if (typeof coinsValue === 'string') {
            // Explicitly assert type or check again
            const stringValue = coinsValue as string; // Assert type
            if (stringValue.trim() === '') { 
                updateData.coins = 0;
            } else {
                const numCoins = Number(stringValue);
                updateData.coins = isNaN(numCoins) ? 0 : numCoins;
            }
        } else if (typeof coinsValue === 'number') {
            updateData.coins = coinsValue;
        } else {
            // Handles undefined or null
            updateData.coins = 0; 
        }
        
        // Remove fields that shouldn't be sent or are handled by backend (like isAdmin)
        // Note: formData shouldn't contain these if initialized correctly
        // delete updateData.id;
        // delete updateData.email;
        delete updateData.isAdmin; // Ensure isAdmin isn't sent, backend syncs it with role

        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user');
        }

        toast.success('User updated successfully!');
        
        // Update the session data - this primarily updates the admin's session 
        // but ensures the JWT callback logic runs. The edited user's session 
        // will update on their next refresh/navigation.
        await update(); 

        router.push('/admin/users'); // Redirect back to user list

    } catch (err: any) {
        console.error("Update User Error:", err);
        setError(err.message);
        toast.error(`Update failed: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Render Loading State
  if (loading || sessionStatus === 'loading') {
    return (
      <div className="p-6 text-center">
        <FaSpinner className="animate-spin text-primary text-4xl mx-auto" />
      </div>
    );
  }

  // Render Error State
  if (error && !user) {
    return (
      <div className="p-6 bg-secondary rounded-lg">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400">{error}</p>
        <Link href="/admin/users" className="text-primary mt-4 inline-block">Go back to Users</Link>
      </div>
    );
  }

  // Render Not Found State (if applicable after loading)
  if (!user) {
     return (
       <div className="p-6 bg-secondary rounded-lg">
         <h1 className="text-2xl font-bold text-yellow-500 mb-4">User Not Found</h1>
         <p className="text-gray-400">Could not find user with ID: {id}</p>
         <Link href="/admin/users" className="text-primary mt-4 inline-block">Go back to Users</Link>
       </div>
     );
  }

  // Render Edit Form
  return (
    <div className="p-6">
       <div className="flex items-center mb-6">
         <Link href="/admin/users" className="mr-4 text-white/70 hover:text-white">
           <FaArrowLeft size={20} />
         </Link>
         <h1 className="text-2xl font-bold text-white">Edit User: {user.name}</h1>
       </div>

       {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
             {error}
          </div>
       )}

       <form onSubmit={handleSubmit} className="bg-secondary rounded-md p-6 space-y-6">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-white mb-2">Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
                    required
                />
            </div>

            {/* Email (Read-only) */}
            <div>
                <label htmlFor="email" className="block text-white/70 mb-2">Email (Read-only)</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={user.email || ''}
                    className="w-full bg-dark/50 text-white/50 py-2 px-4 rounded-md border border-primary/30 cursor-not-allowed"
                    readOnly
                    disabled
                />
            </div>

             {/* Role */}
            <div>
                <label htmlFor="role" className="block text-white mb-2">Role</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role || 'subscriber'}
                    onChange={handleChange}
                    className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
                >
                    {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
            </div>
            
             {/* Coins */}
             <div>
                 <label htmlFor="coins" className="block text-white mb-2">Coins</label>
                 <input
                     type="number"
                     id="coins"
                     name="coins"
                     value={formData.coins ?? ''} // Handle null/undefined for initial state
                     onChange={handleNumberChange}
                     min="0"
                     className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
                 />
             </div>

            {/* Permissions */}
            <div className="md:col-span-1"> {/* Adjust span if needed */} 
                <label className="block text-white mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-dark rounded-md border border-primary/30">
                   {availablePermissions.map(perm => (
                     <label key={perm} className="flex items-center space-x-2 text-white/80">
                       <input
                         type="checkbox"
                         value={perm}
                         checked={formData.permissions?.includes(perm) || false}
                         onChange={handlePermissionChange}
                         className="form-checkbox bg-dark border-primary/30 text-primary rounded focus:ring-primary/50"
                       />
                       <span>{perm}</span>
                     </label>
                   ))}
                </div>
            </div>

            {/* Add IsBlocked / IsActive Toggles if needed */}
            {/* Example: 
            <div>
                 <label className="block text-white mb-2">Status</label>
                 <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-white/80">
                       <input type="checkbox" name="isActive" checked={formData.isActive ?? true} onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))} />
                       <span>Active</span>
                    </label>
                     <label className="flex items-center space-x-2 text-white/80">
                       <input type="checkbox" name="isBlocked" checked={formData.isBlocked ?? false} onChange={(e) => setFormData(prev => ({...prev, isBlocked: e.target.checked}))} />
                       <span>Blocked</span>
                    </label>
                 </div>
            </div>
            */}

            {/* Submit Button */}
           <div className="flex justify-end pt-4">
             <button
               type="submit"
               disabled={isSubmitting || loading}
               className="flex items-center bg-primary text-black px-6 py-2 rounded-md hover:bg-primary/80 transition disabled:opacity-50"
             >
               {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
               {isSubmitting ? 'Saving...' : 'Save Changes'}
             </button>
           </div>
       </form>
    </div>
  );
} 