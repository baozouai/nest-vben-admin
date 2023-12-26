import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'

export class LoginLogQueryDto extends PagerDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsOptional()
  username: string

  @ApiProperty({ description: '登录IP' })
  @IsOptional()
  @IsString()
  ip?: string

  @ApiProperty({ description: '登录地点' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ description: '登录时间' })
  @IsOptional()
  time?: string[]
}

enum TaskLogStatus {
  Fail,
  Success
}

export class TaskLogQueryDto extends PagerDto {
  @ApiProperty({ description: '任务名' })
  @IsOptional()
  @IsString()
  name: string

  @ApiProperty({ description: '任务日志信息' })
  @IsString()
  @IsOptional()
  detail: string

  @ApiProperty({ description: '执行时间' })
  @IsOptional()
  time?: [string, string]

  @ApiProperty({ description: '任务状态：0失败，1成功', enum: TaskLogStatus, enumName: 'TaskLogStatus' })
  @IsEnum(TaskLogStatus)
  @IsOptional()
  status?: TaskLogStatus
}

export class CaptchaLogQueryDto extends PagerDto {
  @ApiProperty({ description: '用户名' })
  @IsOptional()
  @IsString()
  username: string

  @ApiProperty({ description: '验证码' })
  @IsString()
  @IsOptional()
  code?: string

  @ApiProperty({ description: '发送时间' })
  @IsOptional()
  time?: string[]
}
