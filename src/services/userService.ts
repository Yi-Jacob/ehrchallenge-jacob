import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/connection';
import { AuditService } from './auditService';
import { User, UserRole } from '@prisma/client';
import { EncryptionService, ENCRYPTED_FIELDS } from '../utils/encryption';

export interface CreateUserRequest {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_domain: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
}

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class UserService {
  static async createUser(userData: CreateUserRequest, auditContext: { userId?: string | undefined; ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<User> {
    // Encrypt email before checking for existing user
    const encryptedEmail = EncryptionService.encrypt(userData.email);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: encryptedEmail,
        tenantId: userData.tenantId,
      },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user with encrypted email
    const user = await prisma.user.create({
      data: {
        tenantId: userData.tenantId,
        email: encryptedEmail,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      },
    });

    // Audit log
    await AuditService.log({
      tenantId: userData.tenantId,
      userId: auditContext.userId,
      action: 'CREATE',
      tableName: 'users',
      recordId: user.id,
      newValues: { ...user, passwordHash: '[REDACTED]' },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
    });

    return user;
  }

  static async login(loginData: { email: string; password: string; tenant_domain: string }): Promise<LoginResponse> {
    const { email, password, tenant_domain } = loginData;

    // Find tenant by domain
    const tenant = await prisma.tenant.findUnique({ where: { domain: tenant_domain } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    // Encrypt email for database lookup
    const encryptedEmail = EncryptionService.encrypt(email);
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: encryptedEmail,
        tenantId: tenant.id,
        isActive: true,
      },
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Decrypt email for response
    const decryptedEmail = EncryptionService.decrypt(user.email);
    
    return {
      token,
      user: {
        id: user.id,
        email: decryptedEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  static async getUserById(userId: string, tenantId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
      },
    });

    if (user) {
      // Decrypt email before returning
      return {
        ...user,
        email: EncryptionService.decrypt(user.email)
      };
    }

    return user;
  }

  static async getUserByEmail(email: string, tenantId: string): Promise<User | null> {
    const encryptedEmail = EncryptionService.encrypt(email);
    
    const user = await prisma.user.findFirst({
      where: {
        email: encryptedEmail,
        tenantId,
        isActive: true,
      },
    });

    if (user) {
      // Decrypt email before returning
      return {
        ...user,
        email: EncryptionService.decrypt(user.email)
      };
    }

    return user;
  }

  static async getUsersByTenant(tenantId: string, role?: UserRole): Promise<User[]> {
    const where: any = {
      tenantId,
      isActive: true,
    };
    
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Decrypt emails for all users
    return users.map(user => ({
      ...user,
      email: EncryptionService.decrypt(user.email)
    }));
  }

  static async updateUser(userId: string, tenantId: string, updates: Partial<User>, auditContext: { userId?: string | undefined; ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<User | null> {
    // Get current user for audit
    const currentUser = await this.getUserById(userId, tenantId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
        tenantId,
      },
      data: updates,
    });

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.userId,
      action: 'UPDATE',
      tableName: 'users',
      recordId: userId,
      oldValues: currentUser,
      newValues: updatedUser,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
    });

    return updatedUser;
  }

  static async deleteUser(userId: string, tenantId: string, auditContext: { userId?: string; ipAddress?: string; userAgent?: string }): Promise<boolean> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          isActive: false,
        },
      });

      // Audit log
      await AuditService.log({
        tenantId,
        userId: auditContext.userId,
        action: 'DELETE',
        tableName: 'users',
        recordId: userId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  static async changePassword(userId: string, tenantId: string, newPassword: string): Promise<boolean> {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          passwordHash,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
  }
} 