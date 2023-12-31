import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MenuModule } from '../menu/menu.module'

import { RoleController } from './role.controller'
import { RoleEntity } from './role.entity'
import { RoleService } from './role.service'
import { MenuEntity } from '../menu/menu.entity'

const providers = [RoleService]

@Module({
  imports: [
    forwardRef(() => MenuModule),
    TypeOrmModule.forFeature([RoleEntity, MenuEntity]),
  ],
  controllers: [RoleController],
  providers: [...providers],
  exports: [...providers],
})
export class RoleModule {}
