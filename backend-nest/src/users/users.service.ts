// users/users.service.ts
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

  async findOne(id: string): Promise<UserView | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User #${id} not found`);
        return null;
      }
      return this.toUserView(user);
    } catch (error) {
      this.logger.error(`Error finding user: ${error.message}`);
      return null;
    }
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    try {
      this.logger.log(`🔍 Creating user: ${dto.email}`);

      const userId = dto.id || uuidv4();

      // Check if user already exists (for login scenario)
      const existingUser = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (existingUser) {
        this.logger.log(`✅ User already exists: ${userId}`);
        return this.toUserView(existingUser);
      }

      // Create new user object
      const userPayload = {
        id: userId,
        email: dto.email,
        role: dto.role || 'client',
        full_name: dto.full_name || dto.name || null,
        contract_number: dto.contract_number || null,
        phone: dto.phone || null,
      };

      const savedUser = await this.usersRepository.save(userPayload as any);

      this.logger.log(`✅ User created: ${(savedUser as any).id}`);
      return this.toUserView(savedUser as any);
    } catch (error) {
      this.logger.error(`❌ Error creating user: ${error.message}`);
      throw new Error(
        `Unable to create user: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<UserView> {
    try {
      this.logger.log(`🔍 Updating user: ${id}`);

      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.error(`User #${id} not found`);
        throw new NotFoundException(`User #${id} not found`);
      }

      // Update only provided fields
      const updateData: any = {};
      if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.contract_number !== undefined) updateData.contract_number = updates.contract_number;

      await this.usersRepository.update(id, updateData);
      const updatedUser = await this.usersRepository.findOne({ where: { id } });

      if (!updatedUser) {
        throw new NotFoundException(`User #${id} not found after update`);
      }

      this.logger.log(`✅ User updated: ${id}`);
      return this.toUserView(updatedUser);
    } catch (error) {
      this.logger.error(`❌ Error updating user: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`User #${id} not found`);

      await this.usersRepository.manager.transaction(async (manager) => {
        await manager.query('DELETE FROM auth.users WHERE id = $1', [id]);
      });

      this.logger.log(`✅ User deleted: ${id}`);
    } catch (error) {
      this.logger.error(`❌ Error deleting user: ${error.message}`);
      throw error;
    }
  }
}
