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
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: { userId },
      select: {
        status: true,
        appliedDate: true,
        company: true
      }
    });

    // Status breakdown
    const statusCount: Record<string, number> = {};
    applications.forEach(app => {
      statusCount[app.status] = (statusCount[app.status] || 0) + 1;
    });

    // Monthly applications
    const monthlyCount: Record<string, number> = {};
    applications.forEach(app => {
      const month = new Date(app.appliedDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });

    // Response rate (non-rejected, non-ghosted)
    const total = applications.length;
    const positive = applications.filter(a => 
      a.status !== 'REJECTED' && a.status !== 'GHOSTED'
    ).length;
    const responseRate = total > 0 ? Math.round((positive / total) * 100) : 0;

    // Interview rate
    const interviews = applications.filter(a => 
      a.status === 'INTERVIEW' || a.status === 'TECHNICAL'
    ).length;
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

    return NextResponse.json({
      statusBreakdown: statusCount,
      monthlyTrend: monthlyCount,
      responseRate,
      interviewRate,
      totalApplications: total
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}