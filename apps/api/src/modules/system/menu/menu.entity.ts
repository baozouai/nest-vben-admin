import { Column, Entity, ManyToMany, Relation } from 'typeorm'

import { AbstractEntity } from '~/common/entity/abstract.entity'

import { RoleEntity } from '../role/role.entity'
import { MenuType } from './menu.dto'
import { CommonFlag } from '~/common/type'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

@Entity({ name: 'sys_menu' })
export class MenuEntity extends AbstractEntity {
  @Column({ nullable: true })
  @ApiProperty({ description: '父级菜单', type: 'number' })
  parent: number

  @Column()
  @ApiProperty({ description: '菜单名称', type: 'string' })
  name: string

  @Column({ nullable: true })
  @ApiProperty({ description: '菜单路径', type: 'string' })
  path: string

  @Column({ nullable: true })
  @ApiProperty({ description: '菜单权限', type: 'string' })
  permission: string

  @Column({ type: 'tinyint', default: MenuType.DIRECTORY, enum: MenuType, enumName: 'MenuType' })
  @ApiProperty({ description: '菜单类型', type: 'enum', enum: MenuType, enumName: 'MenuType' })
  @IsEnum(MenuType)
  type: MenuType

  @Column({ nullable: true, default: '' })
  @ApiProperty({ description: '菜单图标', type: 'string' })
  icon: string

  @Column({ name: 'order_no', type: 'int', nullable: true, default: 0 })
  @ApiProperty({ description: '排序', type: 'number' })
  orderNo: number

  @Column({ name: 'component', nullable: true })
  @ApiProperty({ description: '组件', type: 'string' })
  component: string

  @Column({ type: 'tinyint', default: CommonFlag.FALSE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ description: '是否外链', type: 'enum', enum: CommonFlag, enumName: 'CommonFlag' })
  @IsEnum(CommonFlag)
  external: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ description: '是否持久缓存', type: 'enum', enum: CommonFlag, enumName: 'CommonFlag' })
  @IsEnum(CommonFlag)
  keepalive: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ description: '是否展示', type: 'enum', enum: CommonFlag, enumName: 'CommonFlag' })
  @IsEnum(CommonFlag)
  show: CommonFlag

  @Column({ type: 'tinyint', default: CommonFlag.TRUE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ title: '状态', type: 'enum', enum: CommonFlag })
  @IsEnum(CommonFlag)
  status: CommonFlag

  @ManyToMany(() => RoleEntity, role => role.menus)
  roles: Relation<RoleEntity[]>
}
