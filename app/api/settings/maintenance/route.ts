import { NextResponse } from 'next/server';
import Settings, { ISettings } from '@/app/models/Settings';
import dbConnect from '@/app/lib/dbConnect';
import mongoose from 'mongoose';

// Ensure this route runs in the Node.js runtime
export const runtime = 'nodejs';

// Define a type for the lean settings document
type LeanSettings = {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  isPublic: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
    try {
        await dbConnect();
        const maintenanceSetting = await Settings.findOne({ key: 'maintenance.enabled' }).lean();
        
        if (!maintenanceSetting) {
            // If no setting exists, return default value (false)
            return NextResponse.json({ enabled: false });
        }

        const typedSetting = maintenanceSetting as unknown as LeanSettings;
        return NextResponse.json({ enabled: Boolean(typedSetting?.value) });
    } catch (error) {
        console.error('Error fetching maintenance status:', error);
        return NextResponse.json({ error: 'Failed to fetch maintenance status' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { enabled } = await request.json();
        
        // Validate input
        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid maintenance mode value' }, { status: 400 });
        }

        await dbConnect();
        
        await Settings.findOneAndUpdate(
            { key: 'maintenance.enabled' },
            { 
                value: enabled,
                type: 'boolean',
                description: 'Enable/disable maintenance mode',
                category: 'maintenance',
                isPublic: true
            },
            { upsert: true }
        );

        return NextResponse.json({ enabled });
    } catch (error) {
        console.error('Error updating maintenance status:', error);
        return NextResponse.json({ error: 'Failed to update maintenance status' }, { status: 500 });
    }
} 