import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { AbstractEntity } from '~/common/entity/abstract.entity'

export enum CaptchaLogProvider {
  SMS = 'sms',
  EMAIL = 'email',
}
@Entity({ name: 'sys_captcha_log' })
export class CaptchaLogEntity extends AbstractEntity {
  @Column({ name: 'user_id', nullable: true })
  @ApiProperty({ description: '用户ID' })
  userId: number

  @Column({ nullable: true })
  @ApiProperty({ description: '账号' })
  account: string

  @Column({ nullable: true })
  @ApiProperty({ description: '验证码' })
  code: string

  @Column({ nullable: true, enum: CaptchaLogProvider, enumName: 'CaptchaLogProvider' })
  @ApiProperty({ description: '验证码提供方', enum: CaptchaLogProvider, enumName: 'CaptchaLogProvider' })
  provider: CaptchaLogProvider
}
