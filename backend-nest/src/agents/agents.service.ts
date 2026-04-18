import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { v4 as uuidv4 } from 'uuid';

export interface AgentResponse {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialty?: string | null;
  status: string;
  assignedCases: number;
  created_at: Date;
  lastActive?: string;
}

type AuthUserRow = {
  email?: string;
  raw_user_meta_data?: {
    specialty?: string | null;
    status?: string | null;
  };
  last_sign_in_at?: string | null;
  updated_at?: string | null;
};

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Récupérer tous les agents
   */
  async findAll(): Promise<AgentResponse[]> {
    const agents = await this.usersRepository.find({
      where: { role: 'agent' },
      order: { created_at: 'DESC' },
    });

    // Récupérer les metadata depuis auth.users
    const agentsWithEmail = await Promise.all(
      agents.map(async (agent) => {
        const authUser = await this.usersRepository.manager.query(
          'SELECT email, raw_user_meta_data, last_sign_in_at, updated_at FROM auth.users WHERE id = $1',
          [agent.id],
        );
        return { agent, authUser: authUser[0] };
      }),
    );

    return agentsWithEmail.map(({ agent, authUser }) => {
      const authRow = authUser as AuthUserRow | undefined;
      const metadata = authRow?.raw_user_meta_data || {};
      return {
        id: agent.id,
        full_name: agent.full_name || '',
        email: authRow?.email || '',
        phone: agent.phone ?? undefined,
        specialty: metadata.specialty || undefined,
        status: metadata.status || 'Actif',
        assignedCases: 0,
        created_at: agent.created_at,
        lastActive: this.formatLastActive(authRow?.last_sign_in_at || authRow?.updated_at),
      };
    });
  }

  /**
   * Récupérer un agent par ID
   */
  async findById(id: string): Promise<AgentResponse> {
    const agent = await this.usersRepository.findOne({
      where: { id, role: 'agent' },
    });

    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }

    const authUser = await this.usersRepository.manager.query(
      'SELECT email, raw_user_meta_data, last_sign_in_at, updated_at FROM auth.users WHERE id = $1',
      [id],
    );

    const authRow = authUser[0] as AuthUserRow | undefined;
    const metadata = authRow?.raw_user_meta_data || {};

    return {
      id: agent.id,
      full_name: agent.full_name || '',
      email: authRow?.email || '',
      phone: agent.phone ?? undefined,
      specialty: metadata.specialty || undefined,
      status: metadata.status || 'Actif',
      assignedCases: 0,
      created_at: agent.created_at,
      lastActive: this.formatLastActive(authRow?.last_sign_in_at || authRow?.updated_at),
    };
  }

  /**
   * Créer un nouvel agent
   */
  async create(dto: CreateAgentDto): Promise<AgentResponse> {
    try {
      const savedAgent = await this.usersRepository.manager.transaction(
        async (manager) => {
          const id = uuidv4();

          // Créer l'utilisateur dans auth.users
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
                name: dto.full_name,
                full_name: dto.full_name,
                role: 'agent',
                status: 'Actif',
                specialty: dto.specialty || null,
              }),
            ],
          );

          // Créer l'enregistrement dans la table public.users
          return manager.getRepository(User).save({
            id,
            role: 'agent',
            full_name: dto.full_name,
            phone: dto.phone ?? '',
          });
        },
      );

      return this.formatAgent(savedAgent);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          throw new BadRequestException('Cet email existe déjà');
        }
        throw new BadRequestException(
          `Erreur lors de la création de l'agent: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Mettre à jour un agent
   */
  async update(id: string, dto: UpdateAgentDto): Promise<AgentResponse> {
    const agent = await this.usersRepository.findOne({
      where: { id, role: 'agent' },
    });

    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }

    // Mettre à jour public.users
    if (dto.full_name) {
      agent.full_name = dto.full_name;
    }
    if (dto.phone) {
      agent.phone = dto.phone;
    }

    const updatedAgent = await this.usersRepository.save(agent);

    // Mettre à jour auth.users avec les metadata
    const metadata: any = {
      name: dto.full_name || agent.full_name,
      full_name: dto.full_name || agent.full_name,
      role: 'agent',
      status: dto.status || 'Actif',
      specialty: dto.specialty || null,
    };

    // Mettre à jour l'email dans auth.users si fourni
    if (dto.email) {
      await this.usersRepository.manager.query(
        `UPDATE auth.users SET email = $1 WHERE id = $2`,
        [dto.email, id],
      );
    }

    await this.usersRepository.manager.query(
      `UPDATE auth.users SET raw_user_meta_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(metadata), id],
    );

    return this.formatAgent(updatedAgent);
  }

  /**
   * Supprimer un agent
   */
  async remove(id: string): Promise<{ message: string }> {
    const agent = await this.usersRepository.findOne({
      where: { id, role: 'agent' },
    });

    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }

    await this.usersRepository.manager.transaction(async (manager) => {
      // Supprimer dans auth.users
      await manager.query('DELETE FROM auth.users WHERE id = $1', [id]);
      // Supprimer dans public.users
      await manager.getRepository(User).delete(id);
    });

    return { message: `Agent #${id} has been deleted` };
  }

  /**
   * Changer le statut d'un agent
   */
  async changeStatus(
    id: string,
    status: 'Actif' | 'En attente' | 'Suspendu',
  ): Promise<AgentResponse> {
    const agent = await this.usersRepository.findOne({
      where: { id, role: 'agent' },
    });

    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }

    // Mettre à jour le statut dans les metadata
    await this.usersRepository.manager.query(
      `
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{status}', $1::jsonb)
      WHERE id = $2
    `,
      [JSON.stringify(status), id],
    );

    return this.findById(id);
  }

  /**
   * Convertir un User en AgentResponse
   */
  private formatAgent(user: User): AgentResponse {
    return {
      id: user.id,
      full_name: user.full_name || '',
      email: user.phone || '', // Placeholder - email devrait venir de auth.users
      phone: user.phone ?? undefined,
      specialty: undefined,
      status: 'Actif',
      assignedCases: 0,
      created_at: user.created_at,
    };
  }

  private formatLastActive(value?: string | null): string {
    if (!value) {
      return 'Jamais connecté';
    }

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return 'Jamais connecté';
    }

    const elapsedMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (elapsedMinutes < 1) {
      return 'À l\'instant';
    }
    if (elapsedMinutes < 60) {
      return `Il y a ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `Il y a ${elapsedHours} h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) {
      return `Il y a ${elapsedDays} j`;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }
}
