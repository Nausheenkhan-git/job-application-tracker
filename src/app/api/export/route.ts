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
      include: {
        interviews: true,
        reminders: true
      },
      orderBy: { appliedDate: 'desc' }
    });

    // Format as CSV
    const headers = ['Company', 'Position', 'Status', 'Applied Date', 'Location', 'Remote', 'Job URL', 'Notes'];
    const rows = applications.map(app => [
      app.company,
      app.position,
      app.status,
      new Date(app.appliedDate).toLocaleDateString(),
      app.location || '',
      app.remote ? 'Yes' : 'No',
      app.jobUrl || '',
      app.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="careerlog-applications-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}