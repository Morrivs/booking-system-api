import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config"; 
import { Role } from "src/common/enums/Role";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey:configService.get<string>('JWT_ACCESS_SECRET') || '',
        });
    }
    async validate(payload: {sub:string; email:string; role?:string}) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role as Role,
        }
    }
}