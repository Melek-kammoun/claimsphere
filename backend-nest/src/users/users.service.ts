// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

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
  async findOne(id: string): Promise<UserView> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.toUserView(user);
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    try {
      const savedUser = await this.usersRepository.manager.transaction(
        async (manager) => {
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
        },
      );

      return this.toUserView(savedUser);
    } catch (error) {
      throw new Error(
        `Unable to create agent: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    await this.usersRepository.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM auth.users WHERE id = $1', [id]);
    });
  }
}
