import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UserModule } from '../../user/user.module'
import { RoleModule } from '../role/role.module'

import { DeptController } from './dept.controller'
import { DeptEntity } from './dept.entity'
import { DeptService } from './dept.service'
import { UserEntity } from '~/modules/user/entities/user.entity'

const services = [DeptService]

@Module({
  imports: [TypeOrmModule.forFeature([DeptEntity, UserEntity]), forwardRef(() => UserModule),RoleModule],
  controllers: [DeptController],
  providers: [...services],
  exports: [...services],
})
export class DeptModule {}
