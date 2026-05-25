import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";

import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./forgot-password.dto";

import { ForgotPasswordService } from "./forgot-password.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly forgotPasswordService:
      ForgotPasswordService,
  ) {}

  @Post("forgot-password")
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.forgotPasswordService.forgotPassword(
      dto.email,
    );
  }

  @Post("reset-password")
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.forgotPasswordService.resetPassword(
      dto.token,
      dto.password,
    );
  }
}