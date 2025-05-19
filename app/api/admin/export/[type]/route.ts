import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import User from '@/app/models/User';
import CraftlandCode from '@/app/models/CraftlandCode';
import { Parser } from 'json2csv';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { dateRange } = await request.json();
    const { start, end } = dateRange;
    
    let data: any[] = [];
    let fields: string[] = [];

    await connectDB();

    switch (params.type) {
      case 'stats':
        const [totalUsers, totalCraftlandCodes] = await Promise.all([
          User.countDocuments(),
          CraftlandCode.countDocuments()
        ]);

        data = [{
          totalUsers,
          totalCraftlandCodes,
          exportDate: new Date().toISOString(),
        }];
        
        fields = ['totalUsers', 'totalCraftlandCodes', 'exportDate'];
        break;

      case 'activity':
        const users = await User.find({
          lastLogin: {
            $gte: start ? new Date(start) : undefined,
            $lte: end ? new Date(end) : undefined,
          },
        }).sort({ lastLogin: -1 }).select('name email lastLogin role');

        data = users.map(user => ({
          user: user.name,
          email: user.email,
          action: 'Login',
          type: user.role,
          timestamp: user.lastLogin?.toISOString() || 'Never',
        }));

        fields = ['user', 'email', 'action', 'type', 'timestamp'];
        break;

      default:
        return new NextResponse('Invalid export type', { status: 400 });
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${params.type}-export.csv`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 