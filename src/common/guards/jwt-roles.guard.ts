import { ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/Role"; // Ajusta la ruta
import { ROLES_KEY } from "../decorators/roles.decorator"; // Ajusta la ruta

@Injectable()
export class JwtRolesGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // 1. Reutilizamos tu lógica de validación
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Esto ejecuta el Passport y tu handleRequest automáticamente
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    // 2. Si llegó aquí, el usuario YA está inyectado en la request (como en el logout)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 3. Verificamos Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    console.log('--- VALIDANDO ROL EN PROPERTIES ---');
    console.log('Usuario:', user.role, '| Requeridos:', requiredRoles);

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('No tienes el rol necesario para esta acción');
    }

    return true;
  }

  // Mantenemos tu handleRequest para ver los logs
  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('Error en Properties Auth:', info?.message);
      throw err || new UnauthorizedException('Token inválido o ausente');
    }
    return user;
  }
}