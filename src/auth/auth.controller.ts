import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({passthrough:true}) res: Response
  ) {
    const tokens = await this.authService.login(data);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly:true,
      secure:false, //true en produccion
      sameSite:'strict',
      path: '/auth/resfresh'
    })
    return {accessToken:tokens.accessToken}
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken; // Usa el optional chaining '?'

    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró el refresh token en las cookies');
    }

    return await this.authService.refreshTokens(refreshToken);
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
