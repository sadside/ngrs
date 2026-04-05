import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@iridium/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (existing) {
      throw new ConflictException('Login already taken');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'DRIVER',
        status: 'PENDING',
      },
    });
    return { id: user.id, status: user.status };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Account is blocked');
    }
    if (user.status === UserStatus.PENDING) {
      return { status: 'PENDING' as const };
    }
    const tokens = await this.generateTokens(user.id);
    return { ...tokens, status: 'ACTIVE' as const };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        telegramChatId: true,
        telegramLinkedAt: true,
      },
    });
    return user;
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRATION'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
