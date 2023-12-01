import { Module } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerOptions } from 'typeorm'

import { EntityExistConstraint } from './constraints/entity-exist.constraint'
import { UniqueConstraint } from './constraints/unique.constraint'
import { TypeORMLogger } from './typeorm-logger'

import { IDatabaseConfig } from '@/config'
import { env } from '@/global/env'

const providers = [EntityExistConstraint, UniqueConstraint]

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        let loggerOptions: LoggerOptions = env('DB_LOGGING') as 'all'

        try {
          // 解析成 js 数组 ['error']
          loggerOptions = JSON.parse(loggerOptions)
        }
        catch {
          // ignore
        }

        return {
          ...configService.get<IDatabaseConfig>('database'),
          autoLoadEntities: true,
          logging: loggerOptions,
          logger: new TypeORMLogger(loggerOptions),
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers,
  exports: providers,
})
export class DatabaseModule {}
