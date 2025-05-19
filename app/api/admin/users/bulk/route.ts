import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '../../../lib/dbConnect';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json({ error: 'Invalid or empty user IDs array' }, { status: 400 });
    }
    
    const objectIds = userIds.map(id => new mongoose.Types.ObjectId(id));

    await dbConnect();

    switch (action) {
      case 'delete':
        const adminCount = await UserModel.countDocuments({ role: 'admin' });
        const adminsToDelete = await UserModel.countDocuments({ _id: { $in: objectIds }, role: 'admin' });
        if (adminsToDelete > 0 && adminCount - adminsToDelete < 1) {
             return NextResponse.json({ error: 'Bulk delete includes the last admin(s). Action aborted.' }, { status: 400 });
        }
        
        await UserModel.deleteMany({
          _id: {
            $in: objectIds,
          },
        });
        break;

      case 'ban':
        await UserModel.updateMany({
          _id: {
            $in: objectIds,
          },
        }, {
          $set: { 
              isBlocked: true, 
              blockReason: 'Banned via bulk action'
          }
        });
        break;

      case 'makeAdmin':
        await UserModel.updateMany({
          _id: {
            $in: objectIds,
          },
        }, {
          $set: { 
              role: 'admin', 
              isAdmin: true 
          }
        });
        break;
        
      case 'makeSubscriber':
         await UserModel.updateMany({
          _id: {
            $in: objectIds,
          },
         }, {
           $set: { 
               role: 'subscriber', 
               isAdmin: false 
           }
         });
         break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `Bulk action '${action}' successful.` }, { status: 200 });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 