import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// GET /api/profile/devices - Get user devices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('devices');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/profile/devices - Remove a device
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the device exists
    const deviceExists = user.devices.some(device => device.deviceId === deviceId);
    if (!deviceExists) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await user.removeDevice(deviceId);
    await user.logActivity('device_removed', { deviceId });
    return NextResponse.json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error('Error removing device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 