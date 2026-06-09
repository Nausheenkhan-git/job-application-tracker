import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendFollowUpEmail } from '@/lib/email';

// This endpoint will be called by a cron job (Vercel Cron Jobs or similar)
export async function GET() {
  try {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        isSent: false,
        reminderDate: {
          lte: now
        }
      },
      include: {
        application: {
          include: {
            user: true
          }
        }
      }
    });
    
    for (const reminder of reminders) {
      const { user } = reminder.application;
      
      await sendFollowUpEmail(
        user.email,
        user.name,
        reminder.application.company,
        reminder.application.position,
        reminder.reminderDate
      );
      
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { isSent: true }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      sent: reminders.length 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}