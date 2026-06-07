import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserId(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      interviews: true,
      reminders: true
    },
    orderBy: { lastUpdated: 'desc' }
  });
  
  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await request.json();
  const application = await prisma.application.create({
    data: {
      ...data,
      userId
    }
  });
  
  return NextResponse.json(application);
}