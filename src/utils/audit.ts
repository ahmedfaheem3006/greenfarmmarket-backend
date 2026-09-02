import { Request } from 'express';
import { prisma } from '../lib/prisma';

export interface LogActivityParams {
  userId?: string | null;
  action: string; // LOGIN, LOGOUT, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, DIAGNOSIS, CREATE_JOB, SEARCH, UPDATE_SETTINGS
  module: string; // AUTH, MARKETPLACE, AI_DOCTOR, TRANSPORT, JOBS, NEWS, SYSTEM, SECURITY
  description: string;
  req?: Request;
}

export const logActivity = async ({
  userId,
  action,
  module,
  description,
  req,
}: LogActivityParams): Promise<void> => {
  try {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'System Agent';

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        module,
        description,
        ipAddress: String(ipAddress),
        userAgent: String(userAgent).slice(0, 500),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
