import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Pagination } from '@/helper/paginate/pagination';

import { ApiResult } from '@/decorators';
import { LogDisabled } from '@/decorators/log-disabled.decorator';
import { ApiSecurityAuth } from '@/decorators/swagger.decorator';

import { LoginLogInfo, TaskLogInfo } from './log.modal';
import { CaptchaLogService } from './services/captcha-log.service';
import { CaptchaLogEntity } from './entities/captcha-log.entity';
import { LoginLogService } from './services/login-log.service';
import { TaskLogService } from './services/task-log.service';
import {
  CaptchaLogQueryDto,
  LoginLogQueryDto,
  TaskLogQueryDto,
} from './dtos/log.dto';

@ApiSecurityAuth()
@ApiTags('System - 日志模块')
@Controller('log')
export class LogController {
  constructor(
    private loginLogService: LoginLogService,
    private taskService: TaskLogService,
    private captchaLogService: CaptchaLogService,
  ) {}

  @ApiOperation({ summary: '分页查询登录日志' })
  @ApiResult({ type: [LoginLogInfo], isPage: true })
  @LogDisabled()
  @Get('login/page')
  async loginLogPage(
    @Query() dto: LoginLogQueryDto,
  ): Promise<Pagination<LoginLogInfo>> {
    return this.loginLogService.paginate(dto);
  }

  @ApiOperation({ summary: '分页查询任务日志' })
  @ApiResult({ type: [TaskLogInfo], isPage: true })
  @LogDisabled()
  @Get('task/page')
  async taskPage(
    @Query() dto: TaskLogQueryDto,
  ): Promise<Pagination<TaskLogInfo>> {
    return this.taskService.paginate(dto);
  }

  @ApiOperation({ summary: '分页查询验证码日志' })
  @ApiResult({ type: [CaptchaLogEntity], isPage: true })
  @LogDisabled()
  @Get('captcha/page')
  async captchaPage(
    @Query() dto: CaptchaLogQueryDto,
  ): Promise<Pagination<CaptchaLogEntity>> {
    return this.captchaLogService.paginate(dto);
  }
}