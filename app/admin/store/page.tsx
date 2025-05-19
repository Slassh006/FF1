import { Metadata } from 'next';
import AdminStoreManager from '../../components/admin/store/AdminStoreManager';

export const metadata: Metadata = {
  title: 'Store Management - Admin Dashboard',
  description: 'Manage store items, inventory, and orders',
};

export default function AdminStorePage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Store Management</h1>
        <AdminStoreManager />
      </div>
    </main>
  );
} 