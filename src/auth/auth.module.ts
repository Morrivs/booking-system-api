import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule, PassportModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'), 
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtModule,JwtStrategy],
  exports:[JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
