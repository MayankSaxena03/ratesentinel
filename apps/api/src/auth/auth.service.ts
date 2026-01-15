import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SignupDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signup(tenantId: number, dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(tenantId, {
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
    };
  }
}
