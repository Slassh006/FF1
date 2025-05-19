import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';

export async function GET() {
    try {
        await dbConnect();

        // Fetch only settings marked as public
        const publicSettings = await Settings.find({ isPublic: true }).select('key value -_id'); // Select only key and value

        // Format the settings into a simple key-value object
        const settingsObject = publicSettings.reduce((acc, setting) => {
            if (setting.key) { // Ensure key exists
                 acc[setting.key] = setting.value;
            }
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json(settingsObject);

    } catch (error) {
        console.error('Error fetching public settings:', error);
        // Avoid leaking detailed errors in a public route
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
} 