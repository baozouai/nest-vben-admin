import { Column, Entity, ManyToMany, Relation } from 'typeorm'

import { AbstractEntity } from '~/common/entity/abstract.entity'

import { RoleEntity } from '../role/role.entity'
import { MenuType } from './menu.dto'
import { CommonFlag } from '~/common/type'

@Entity({ name: 'sys_menu' })
export class MenuEntity extends AbstractEntity {
  @Column({ nullable: true })
  parent: number

  @Column()
  name: string

  @Column({ nullable: true })
  path: string

  @Column({ nullable: true })
  permission: string

  @Column({ type: 'tinyint', default: MenuType.DIRECTORY, enum: MenuType, enumName: 'MenuType' })
  type: MenuType

  @Column({ nullable: true, default: '' })
  icon: string

  @Column({ name: 'order_no', type: 'int', nullable: true, default: 0 })
  orderNo: number

  @Column({ name: 'component', nullable: true })
  component: string

  @Column({ type: 'tinyint', default: CommonFlag.FALSE, enum: CommonFlag, enumName: 'CommonFlag' })
  external: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  keepalive: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  show: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  status: CommonFlag

  @ManyToMany(() => RoleEntity, role => role.menus)
  roles: Relation<RoleEntity[]>
}
