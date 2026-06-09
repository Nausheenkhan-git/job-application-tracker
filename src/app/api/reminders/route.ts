import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserId(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { applicationId, reminderDate, message } = await request.json();
    
    const reminder = await prisma.reminder.create({
      data: {
        applicationId,
        reminderDate: new Date(reminderDate),
        message,
        isSent: false
      }
    });
    
    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Reminder creation error:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const reminders = await prisma.reminder.findMany({
      where: {
        application: {
          userId: userId
        },
        isSent: false,
        reminderDate: {
          gte: new Date()
        }
      },
      include: {
        application: {
          select: {
            company: true,
            position: true
          }
        }
      },
      orderBy: {
        reminderDate: 'asc'
      }
    });
    
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Fetch reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}