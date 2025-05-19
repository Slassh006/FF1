import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/app/lib/mongodb';
import CraftlandCode from '@/app/models/CraftlandCode';
import { User } from '@/app/models/User';

interface LeaderboardItem {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  badges: string[];
  rank: number;
}

interface AggregatedUser {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  badges: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    // Get top creators
    const topCreators = await CraftlandCode.aggregate<AggregatedUser>([
      { $match: { isVerified: true } },
      { $group: { _id: '$creator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
          score: '$count',
          badges: {
            $cond: {
              if: { $gte: ['$count', 10] },
              then: ['verified', 'top_contributor'],
              else: ['verified']
            }
          }
        }
      }
    ]);

    // Get top voters
    const topVoters = await CraftlandCode.aggregate<AggregatedUser>([
      { $unwind: '$upvotes' },
      { $group: { _id: '$upvotes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
          score: '$count',
          badges: {
            $cond: {
              if: { $gte: ['$count', 50] },
              then: ['community_leader'],
              else: []
            }
          }
        }
      }
    ]);

    // Get top contributors (combination of creators and voters)
    const topContributors = await User.aggregate<AggregatedUser>([
      {
        $lookup: {
          from: 'craftlandcodes',
          localField: '_id',
          foreignField: 'creator',
          as: 'createdCodes'
        }
      },
      {
        $lookup: {
          from: 'craftlandcodes',
          localField: '_id',
          foreignField: 'upvotes',
          as: 'votedCodes'
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$name',
          avatar: '$avatar',
          score: {
            $add: [
              { $size: '$createdCodes' },
              { $size: '$votedCodes' }
            ]
          },
          badges: {
            $cond: {
              if: {
                $or: [
                  { $gte: [{ $size: '$createdCodes' }, 5] },
                  { $gte: [{ $size: '$votedCodes' }, 20] }
                ]
              },
              then: ['early_adopter'],
              else: []
            }
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      success: true,
      leaderboards: {
        creators: topCreators.map((creator, index) => ({
          ...creator,
          rank: index + 1
        })),
        voters: topVoters.map((voter, index) => ({
          ...voter,
          rank: index + 1
        })),
        contributors: topContributors.map((contributor, index) => ({
          ...contributor,
          rank: index + 1
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 