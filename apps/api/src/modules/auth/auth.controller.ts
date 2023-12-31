import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { Ip } from '~/common/decorators/http.decorator'

import { UserService } from '../user/user.service'

import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { LocalGuard } from './guards/local.guard'
import { LoginToken } from './models/auth.model'
import { FastifyRequest } from 'fastify'

@ApiTags('Auth - 认证模块')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginToken })
  @ApiBody({ type: LoginDto })
  async login(
    @Req() req: FastifyRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ): Promise<LoginToken> {
    // await this.loginService.checkImgCaptcha(dto.captchaId, dto.verifyCode);
    const token = await this.authService.login(
      // dto.username,
      // dto.password,
      req.user,
      ip,
      ua,
    )
    return { token }
  }

  @Post('register')
  @ApiOperation({ summary: '注册' })
  async register(@Body() dto: RegisterDto): Promise<void> {
    await this.userService.register(dto)
  }
}
