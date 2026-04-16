// users/users.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

export type LoginResponse = {
  role: 'admin' | 'agent' | 'client';
  user: {
    id: string;
    full_name: string;
    email: string;
  };
};

type UserView = User & { name: string };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private toUserView(user: User): UserView {
    return {
      ...user,
      name: user.full_name,
    };
  }

  async findAll(): Promise<UserView[]> {
    const users = await this.usersRepository.find({
      order: { created_at: 'ASC' },
    });
    return users.map((user) => this.toUserView(user));
  }

  async findByRole(role: string): Promise<UserView[]> {
    const users = await this.usersRepository.find({
      where: { role },
      order: { created_at: 'ASC' },
    });
    return users.map((user) => this.toUserView(user));
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    try {
      const savedUser = await this.usersRepository.manager.transaction(async (manager) => {
        const id = uuidv4();
        const fullName = dto.full_name ?? dto.name;

        await manager.query(
          `
            INSERT INTO auth.users (
              id,
              aud,
              role,
              email,
              encrypted_password,
              email_confirmed_at,
              confirmation_sent_at,
              raw_app_meta_data,
              raw_user_meta_data,
              is_sso_user,
              is_anonymous,
              created_at,
              updated_at
            ) VALUES (
              $1,
              'authenticated',
              'authenticated',
              $2,
              crypt($3, gen_salt('bf')),
              NOW(),
              NOW(),
              $4::jsonb,
              $5::jsonb,
              FALSE,
              FALSE,
              NOW(),
              NOW()
            )
          `,
          [
            id,
            dto.email,
            dto.password,
            JSON.stringify({ provider: 'email', providers: ['email'] }),
            JSON.stringify({
              name: dto.name,
              full_name: fullName,
              role: dto.role,
              status: dto.status,
              specialty: dto.specialty,
            }),
          ],
        );

        return manager.getRepository(User).save({
          id,
          role: dto.role,
          full_name: fullName,
          contract_number: dto.contract_number,
          phone: dto.phone ?? '',
        });
      });

      return this.toUserView(savedUser);
    } catch (error) {
      throw new Error(`Unable to create agent: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    await this.usersRepository.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM auth.users WHERE id = $1', [id]);
    });
  }

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const rows = await this.usersRepository.manager.query(
      `
        SELECT
          u.id,
          u.full_name,
          u.role AS public_role,
          au.email,
          au.encrypted_password,
          au.raw_user_meta_data
        FROM public.users u
        INNER JOIN auth.users au ON au.id = u.id
        WHERE au.email = $1
           OR u.contract_number::text = $1
           OR u.full_name ILIKE $2
        LIMIT 1
      `,
      [identifier, `%${identifier}%`],
    );

    const user = rows?.[0];

    if (!user) {
      throw new UnauthorizedException('Identifiant invalide');
    }

    const passwordCheck = await this.usersRepository.manager.query(
      `SELECT crypt($1, $2) = $2 AS is_valid`,
      [password, user.encrypted_password],
    );

    if (!passwordCheck?.[0]?.is_valid) {
      throw new UnauthorizedException('Mot de passe invalide');
    }

    const metadataRole = user.raw_user_meta_data?.role;
    const role = (metadataRole || user.public_role || 'client') as LoginResponse['role'];

    return {
      role,
      user: {
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
      },
    };
  }
}