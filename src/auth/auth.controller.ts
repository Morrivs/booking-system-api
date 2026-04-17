import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
  }

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { tokens, user } = await this.authService.login(data);
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, 
      secure: isProduction, 
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { 
      access_token: tokens.accessToken, 
      user 
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken; 
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró el refresh token en las cookies');
    }

    const { tokens, user } =  await this.authService.refreshTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return { access_token: tokens.accessToken,
      user
     };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId
    await this.authService.logout(userId);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
  }

  @Post('password-reset-request')
  requestReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string
  ) {
    return this.authService.resetPassword(token, password);
  }
}
