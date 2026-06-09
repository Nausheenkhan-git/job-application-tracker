import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword, verifyPassword } from '@/lib/auth';
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, currentPassword, newPassword } = await request.json();

    // Update name only
    if (name && !email && !currentPassword && !newPassword) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: { id: true, name: true, email: true, createdAt: true }
      });
      return NextResponse.json(updatedUser);
    }

    // Update email only
    if (email && !name && !currentPassword && !newPassword) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { email },
        select: { id: true, name: true, email: true, createdAt: true }
      });
      return NextResponse.json(updatedUser);
    }

    // Update both name and email
    if (name && email && !currentPassword && !newPassword) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name, email },
        select: { id: true, name: true, email: true, createdAt: true }
      });
      return NextResponse.json(updatedUser);
    }

    // Update password
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
        select: { id: true, name: true, email: true, createdAt: true }
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}