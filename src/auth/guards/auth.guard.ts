import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { JwtPayload } from '../interfaces/jwtPayload';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService : AuthService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const req = context.switchToHttp().getRequest()
    const token = this.extractToken(req)
    if (!token) {
      throw new UnauthorizedException('Not logged')
    }
    const payload = await this.jwtService.verifyAsync<JwtPayload>(
      token,
      { secret: process.env.SECRET }
    )
    const user = await this.authService.findById(payload.id)
    if(!user) throw new UnauthorizedException('User does not exists')
    if(!user.isActive) throw new UnauthorizedException('Inactive User')

    // User exists
    req['user'] = user
    return true
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers['authorization']?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
