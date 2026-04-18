import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

type UserView = User & { name: string };

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private toUserView(user: User): UserView {
    return { ...user, name: user.full_name ?? '' };
  }

  async findAll(): Promise<UserView[]> {
    const users = await this.usersRepository.find({ order: { created_at: 'ASC' } });
    return users.map((u) => this.toUserView(u));
  }

  async findByRole(role: string): Promise<UserView[]> {
    const users = await this.usersRepository.find({ where: { role }, order: { created_at: 'ASC' } });
    return users.map((u) => this.toUserView(u));
  }

  async findOne(id: string): Promise<UserView | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) return null;
      return this.toUserView(user);
    } catch (error) {
      this.logger.error(`Error finding user: ${(error as Error).message}`);
      return null;
    }
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    const userId = dto.id || uuidv4();

    const existing = await this.usersRepository.findOne({ where: { id: userId } });
    if (existing) return this.toUserView(existing);

    const newUser = this.usersRepository.create();
    newUser.id = userId;
    newUser.role = dto.role || 'client';
    newUser.full_name = dto.full_name || dto.name || null;
    newUser.phone = dto.phone || null;
    newUser.contract_number = dto.contract_number ? parseInt(dto.contract_number, 10) : null;
    const saved = await this.usersRepository.save(newUser);

    this.logger.log(`User created: ${userId}`);
    return this.toUserView(saved);
  }

  async update(id: string, updates: Partial<User>): Promise<UserView> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const patch: Partial<User> = {};
    if (updates.full_name !== undefined) patch.full_name = updates.full_name;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.contract_number !== undefined) patch.contract_number = updates.contract_number;

    await this.usersRepository.update(id, patch);
    const updated = await this.usersRepository.findOne({ where: { id } });
    if (!updated) throw new NotFoundException(`User #${id} not found after update`);
    return this.toUserView(updated);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    await this.usersRepository.delete(id);
    this.logger.log(`User deleted: ${id}`);
  }
}
