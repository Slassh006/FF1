import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import Activity, { IActivity } from '@/app/models/Activity';

interface ActivityWithId extends IActivity {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
}

export async function GET() {
  try {
    await connectDB();

    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean();

    // Format activities for frontend
    const formattedActivities = activities.map((activity: ActivityWithId) => ({
      id: activity._id.toString(),
      type: activity.type,
      user: activity.userId.name,
      action: activity.action,
      timestamp: activity.timestamp
    }));

    return NextResponse.json({
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Get admin activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 