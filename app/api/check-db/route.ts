import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    const status = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }[state];

    return NextResponse.json({
      status: status,
      connected: state === 1,
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      connected: false
    }, { status: 500 });
  }
} 