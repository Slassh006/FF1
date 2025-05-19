import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCached, PERMISSIONS, hasPermission } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import { deleteFile } from '@/app/lib/gridfs';

// GET /api/admin/craftland-codes/[id]
export async function GET(request: Request, context: any) {
  const { params } = await context;
  try {
    const session = await getServerSessionCached();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const craftlandCode = await CraftlandCode.findById(params.id).populate('creator', 'name email');
    if (!craftlandCode) {
      return NextResponse.json(
        { error: 'Craftland code not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, craftlandCode });
  } catch (error: any) {
    console.error('Error fetching craftland code:', error);
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch craftland code' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/craftland-codes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionCached();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.permissions || [], PERMISSIONS.CRAFTLAND.MANAGE)) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing required permission' },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Craftland code ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const craftlandCode = await CraftlandCode.findById(id);
    if (!craftlandCode) {
      return NextResponse.json(
        { error: 'Craftland code not found' },
        { status: 404 }
      );
    }

    // Delete associated image if exists
    if (craftlandCode.imageId) {
      try {
        await deleteFile(craftlandCode.imageId);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await CraftlandCode.findByIdAndDelete(id);

    // Add to audit log
    await addToAuditLog({
      action: 'DELETE',
      entityType: 'CRAFTLAND_CODE',
      entityId: id,
      userId: session.user.id,
      details: `Deleted craftland code: ${craftlandCode.title}`
    });

    return NextResponse.json({
      message: 'Craftland code deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete craftland code' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/craftland-codes/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionCached();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.permissions || [], PERMISSIONS.CRAFTLAND.MANAGE)) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing required permission' },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Craftland code ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const existingCode = await CraftlandCode.findById(id).select('imageId');
    if (!existingCode) {
      return NextResponse.json(
        { error: 'Craftland code not found' },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    // Handle image deletion if needed
    if (updateData.deleteImage && existingCode.imageId) {
      try {
        await deleteFile(existingCode.imageId);
        updateData.imageUrl = null;
        updateData.imageId = null;
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // --- Ensure status is consistent with isVerified ---
    if (typeof updateData.isVerified === 'boolean') {
      updateData.status = updateData.isVerified ? 'approved' : 'pending';
    }

    // Add audit trail
    updateData.lastModifiedBy = session.user.id;
    updateData.lastModifiedAt = new Date();

    const updatedCraftlandCode = await CraftlandCode.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('creator', 'name email');

    if (!updatedCraftlandCode) {
      return NextResponse.json(
        { error: 'Failed to update craftland code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Craftland code updated successfully',
      craftlandCode: updatedCraftlandCode
    });

  } catch (error: any) {
    console.error('Error updating craftland code:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update craftland code',
        details: error.errors || {}
      },
      { status: 500 }
    );
  }
}

async function addToAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: string;
}) {
  try {
    const { db } = await connectDB();
    await db.collection('auditlogs').insertOne({
      ...data,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error adding to audit log:', error);
  }
} 