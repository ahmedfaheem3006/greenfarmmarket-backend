import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/audit';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, governorate, city, customRole, farmName, area, areaUnit, mainCrops, animalType, animalCount, notes } = req.body;

    if (!name || !email || !phone || !password || !governorate || !city) {
      return sendError(res, 'جميع الحقول الأساسية مطلوبة (الاسم، البريد، الهاتف، كلمة المرور، المحافظة، المدينة).', [], 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return sendError(res, 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.', [], 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Security Whitelist: Public registration can NEVER grant ADMIN role
    const allowedPublicRoles: Role[] = [
      Role.FARMER,
      Role.FARM_OWNER,
      Role.FARM_MANAGER,
      Role.AGRI_ENGINEER,
      Role.WORKER,
      Role.BUYER,
      Role.SELLER,
      Role.DRIVER,
      Role.SERVICE_PROVIDER,
    ];

    const assignedRole = (role && allowedPublicRoles.includes(role as Role))
      ? (role as Role)
      : Role.FARMER;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: assignedRole,
        customRole,
        governorate,
        city,
      },
    });

    // If farm information provided, create Farm record
    if (farmName || area) {
      await prisma.farm.create({
        data: {
          userId: newUser.id,
          name: farmName || `مزرعة ${name}`,
          governorate,
          city,
          area: parseFloat(area) || 1,
          areaUnit: areaUnit || 'FEDDAN',
          mainCrops,
          animalType,
          animalCount: animalCount ? parseInt(animalCount) : undefined,
          notes,
        },
      });
    }

    const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logActivity({
      userId: newUser.id,
      action: 'REGISTER',
      module: 'AUTH',
      description: `تسجيل مستخدم جديد: ${newUser.name} (${newUser.email}) بصلاحية ${newUser.role}`,
      req,
    });

    return sendSuccess(res, 'تم إنشاء الحساب بنجاح!', {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        governorate: newUser.governorate,
        city: newUser.city,
      },
      accessToken,
      refreshToken,
    }, 201);
  } catch (error: any) {
    console.error('Register error:', error);
    return sendError(res, 'حدث خطأ أثناء إنشاء الحساب.', [error.message], 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return sendError(res, 'يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور.', [], 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
      include: { farms: true },
    });

    if (!user) {
      return sendError(res, 'بيانات الدخول غير صحيحة.', [], 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'بيانات الدخول غير صحيحة.', [], 401);
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      description: `تسجيل دخول ناجح للمستخدم: ${user.name} (${user.email})`,
      req,
    });

    return sendSuccess(res, 'تم تسجيل الدخول بنجاح.', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        governorate: user.governorate,
        city: user.city,
        farms: user.farms,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return sendError(res, 'حدث خطأ أثناء تسجيل الدخول.', [error.message], 500);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'غير مصرح.', [], 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { farms: true },
    });

    if (!user) return sendError(res, 'المستخدم غير موجود.', [], 404);

    return sendSuccess(res, 'بيانات الحساب الشخصي', {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      governorate: user.governorate,
      city: user.city,
      farms: user.farms,
    });
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب بيانات المستخدم.', [error.message], 500);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const { name, phone, governorate, city, farmName, farmArea, areaUnit, mainCrops, animalType, animalCount } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(governorate && { governorate }),
        ...(city && { city }),
      },
    });

    if (farmName || farmArea || mainCrops || animalType || animalCount) {
      const existingFarm = await prisma.farm.findFirst({ where: { userId } });
      if (existingFarm) {
        await prisma.farm.update({
          where: { id: existingFarm.id },
          data: {
            ...(farmName && { name: farmName }),
            ...(farmArea && { area: parseFloat(farmArea) }),
            ...(areaUnit && { areaUnit }),
            ...(governorate && { governorate }),
            ...(city && { city }),
            ...(mainCrops !== undefined && { mainCrops }),
            ...(animalType !== undefined && { animalType }),
            ...(animalCount !== undefined && { animalCount: parseInt(animalCount) }),
          },
        });
      } else {
        await prisma.farm.create({
          data: {
            userId,
            name: farmName || 'مزرعتي النموذجية',
            governorate: governorate || 'البحيرة',
            city: city || 'النوبارية',
            area: farmArea ? parseFloat(farmArea) : 10,
            areaUnit: areaUnit || 'FEDDAN',
            mainCrops: mainCrops || 'محاصيل متنوعة',
            animalType,
            animalCount: animalCount ? parseInt(animalCount) : 0,
          },
        });
      }
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { farms: true },
    });

    return sendSuccess(res, 'تم تحديث بيانات الحساب والمزرعة بنجاح!', {
      id: fullUser?.id,
      name: fullUser?.name,
      email: fullUser?.email,
      phone: fullUser?.phone,
      role: fullUser?.role,
      governorate: fullUser?.governorate,
      city: fullUser?.city,
      farms: fullUser?.farms,
    });
  } catch (error: any) {
    return sendError(res, 'فشل تحديث بيانات الحساب.', [error.message], 500);
  }
};

