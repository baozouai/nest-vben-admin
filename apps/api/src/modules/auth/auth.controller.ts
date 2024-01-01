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
import { AuthUser } from './decorators/auth-user.decorator'

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
    // 调用login之前已经通过localGuard的strategy validate了，所以这里能拿到user
    @AuthUser() user: IAuthUser,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ): Promise<LoginToken> {
    // await this.loginService.checkImgCaptcha(dto.captchaId, dto.verifyCode);
    const token = await this.authService.login(
      // dto.username,
      // dto.password,
      user,
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
