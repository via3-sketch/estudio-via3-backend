import { BadRequestException, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Users } from 'src/users/entities/user.entity';

import { InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto, LoginUserDto } from 'src/users/dto/create-user.dto';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { Role } from 'src/users/enums/roles.enum';

import { EmailService } from 'src/notifications/channels/email/email.service';

import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    private readonly jwtService: JwtService,

    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email.toLowerCase().trim();

    const foundUser = await this.usersRepository.findOneBy({
      email: normalizedEmail,
    });

    if (foundUser?.googleId) {
      throw new BadRequestException(
        'Este correo ya fue registrado mediante Google. Continúa con Google.',
      );
    }

    if (foundUser) {
      throw new BadRequestException(
        'Este correo ya está registrado. Por favor, inicia sesión.',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const { confirmPassword, ...userData } = createUserDto;

    const newUser = this.usersRepository.create({
      ...userData,

      email: normalizedEmail,

      password: hashedPassword,

      role: Role.User,

      profileCompleted: true,
    });

    const savedUser = await this.usersRepository.save(newUser);

    try {
      await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.name);

      console.log('WELCOME EMAIL ENVIADO');
    } catch (error) {
      console.error('ERROR MAIL:', error);
    }

    return savedUser;
  }

  async signIn(credentials: LoginUserDto) {
    const normalizedEmail = credentials.email.toLowerCase().trim();

    const foundUser = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', {
        email: normalizedEmail,
      })
      .getOne();

    if (!foundUser) {
      throw new BadRequestException('Credenciales inválidas');
    }

    if (foundUser.googleId) {
      throw new BadRequestException(
        'Esta cuenta fue registrada mediante Google. Continúa con Google.',
      );
    }

    const matchingPassword = await bcrypt.compare(
      credentials.password,
      foundUser.password,
    );

    if (!matchingPassword) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const payload = {
      id: foundUser.id,

      email: foundUser.email,

      role: foundUser.role,

      profileCompleted: foundUser.profileCompleted,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    return {
      id: foundUser.id,

      role: foundUser.role,

      login: true,

      access_token: token,
    };
  }

  async findOrCreateGoogleUser(
    googleUser: {
      email: string;

      name: string;

      googleId: string;
    },

    mode: 'signin' | 'signup',
  ) {
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    const adminEmails = ['colmenares8093@gmail.com', 'admin.viacore@gmail.com'];

    const isAdmin = adminEmails.includes(normalizedEmail);

    let user = await this.usersRepository.findOneBy({
      email: normalizedEmail,
    });

    if (user) {
      if (!user.googleId) {
        throw new BadRequestException(
          'Este correo ya está registrado con email y contraseña.',
        );
      }

      if (user.googleId !== googleUser.googleId) {
        throw new BadRequestException(
          'Este correo ya está vinculado a otra cuenta Google.',
        );
      }

      if (mode === 'signup') {
        throw new BadRequestException(
          'Esta cuenta Google ya existe. Inicia sesión.',
        );
      }
    } else {
      if (mode === 'signin') {
        throw new BadRequestException(
          'No existe una cuenta registrada con Google para este correo.',
        );
      }

      user = this.usersRepository.create({
        email: normalizedEmail,

        name: googleUser.name,

        googleId: googleUser.googleId,

        role: isAdmin ? Role.Admin : Role.User,

        profileCompleted: isAdmin ? true : false,
      });

      user = await this.usersRepository.save(user);
    }

    if (!user) {
      throw new BadRequestException('No se pudo autenticar el usuario Google.');
    }

    if (isAdmin) {
      user.role = Role.Admin;

      user.profileCompleted = true;

      user = await this.usersRepository.save(user);
    }

    const payload = {
      id: user.id,

      email: user.email,

      role: user.role,

      profileCompleted: user.profileCompleted,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    return {
      id: user.id,

      role: user.role,

      login: true,

      access_token: token,
    };
  }
}
