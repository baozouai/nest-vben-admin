import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinTable, ManyToMany, Relation } from 'typeorm'

import { AbstractEntity } from '~/common/entity/abstract.entity'

import { UserEntity } from '../../user/entities/user.entity'
import { MenuEntity } from '../menu/menu.entity'
import { CommonFlag } from '~/common/type'

@Entity({ name: 'sys_role' })
export class RoleEntity extends AbstractEntity {
  @Column({ length: 50, unique: true })
  @ApiProperty({ description: '角色名' })
  name: string

  @Column({ unique: true })
  @ApiProperty({ description: '角色标识' })
  value: string

  @Column({ nullable: true })
  @ApiProperty({ description: '角色描述' })
  remark: string

  @Column({ type: 'tinyint', nullable: true, default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ type: 'enum', description: '状态：1启用，0禁用', enum: CommonFlag, enumName: 'CommonFlag' })
  status: CommonFlag

  @Column({ nullable: true, default: false })
  @ApiProperty({ description: '是否默认用户' })
  default: boolean

  @ManyToMany(() => UserEntity, user => user.roles)
  users: Relation<UserEntity[]>

  @ManyToMany(() => MenuEntity, menu => menu.roles, {})
  @JoinTable({
    name: 'sys_role_menus',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: Relation<MenuEntity[]>
}
