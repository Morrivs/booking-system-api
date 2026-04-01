import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/common/helpers/mail/MailService';
import crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly usersService: UsersService,
    private readonly configService: ConfigService, private readonly prisma:PrismaService, private readonly mailService:MailService
  ) {}

  async register(data:RegisterDto){
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      role: Role.GUEST,
      password: hashedPassword
    })

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(user: LoginDto) {
    const foundUser = await this.usersService.findByEmail(user.email);
    
    if (!foundUser || !(await bcrypt.compare(user.password, foundUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(foundUser);
    await this.saveRefreshToken(foundUser.id, tokens.refreshToken);

    const { password, refreshToken, ...userWithoutPassword } = foundUser;

    return {
      tokens,
      user: userWithoutPassword,
    };
  }

  async refreshTokens(refreshTokenX: string) {
    const payload = await this.jwtService.verifyAsync(refreshTokenX, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(
      refreshTokenX,
      user.refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user);

    await this.saveRefreshToken(user.id, tokens.refreshToken);
    const { password,refreshToken, ...userWithoutPassword } = user;

    return {
      tokens,
      user: userWithoutPassword,
    };;
  }

  private generateTokens(user: { id: string; email: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);

    await this.usersService.update(userId, {
      refreshToken: hashed,
    });
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    });
  }

  async requestPasswordReset(email: string) {

    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');

    const expires = new Date(Date.now() + 1000 * 60 * 15);

    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    const link = `https://tuapp.com/reset-password?token=${token}`;

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: `
        <h2>Password reset</h2>
        <p>Click the link below to reset your password</p>
        <a href="${link}">${link}</a>
      `
    });
  }

  async resetPassword(token: string, newPassword: string) {

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });
  }
}
