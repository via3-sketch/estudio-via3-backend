import { Injectable } from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import * as crypto from "crypto";

import * as bcrypt from "bcrypt";

import { PasswordResetToken } from "../entities/password-reset-token.entity";

import { Users } from "../../users/entities/user.entity";

import { EmailService } from "../../notifications/channels/email/email.service";

@Injectable()
export class ForgotPasswordService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,

    @InjectRepository(PasswordResetToken)
    private resetRepository: Repository<PasswordResetToken>,

    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(email: string) {
    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await this.userRepository.findOne({
        where: {
          email: normalizedEmail,
        },
      });

    /**
     * No revelar si el email existe
     */
    if (!user) {
      return {
        message:
          "Si el correo existe, recibirás un enlace de recuperación.",
      };
    }

    /**
     * Invalidar tokens anteriores
     */
    await this.resetRepository.update(
      {
        userId: user.id,
        used: false,
      },
      {
        used: true,
      },
    );

    /**
     * Generar token
     */
    const token = crypto.randomUUID();

    /**
     * Expira en 15 minutos
     */
    const expiresAt =
      new Date(Date.now() + 1000 * 60 * 15);

    /**
     * Guardar token
     */
    await this.resetRepository.save({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    /**
     * URL frontend
     */
    const resetUrl =
      `${process.env.FRONTEND_URL}/reseteo-contrasenia?token=${token}`;

    /**
     * Enviar email
     */
    await this.emailService.sendPasswordRecoveryEmail(
      user.email,
      user.name,
      resetUrl,
    );

    return {
      message:
        "Si el correo existe, recibirás un enlace de recuperación.",
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const resetToken =
      await this.resetRepository.findOne({
        where: {
          token,
        },
        relations: {
          user: true,
        },
      });

    if (!resetToken) {
      throw new Error(
        "El enlace de recuperación no es válido.",
      );
    }

    if (resetToken.used) {
      throw new Error(
        "El enlace de recuperación ya fue utilizado.",
      );
    }

    if (
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      throw new Error(
        "El enlace de recuperación expiró.",
      );
    }

    /**
     * Hashear contraseña
     */
    const hashedPassword =
      await bcrypt.hash(password, 10);

    /**
     * Actualizar usuario
     */
    resetToken.user.password =
      hashedPassword;

    await this.userRepository.save(
      resetToken.user,
    );

    /**
     * Marcar token usado
     */
    resetToken.used = true;

    await this.resetRepository.save(
      resetToken,
    );

    return {
      message:
        "Contraseña actualizada correctamente.",
    };
  }
}