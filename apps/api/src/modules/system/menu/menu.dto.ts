import { ApiProperty, PartialType } from '@nestjs/swagger'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  IsEnum,
} from 'class-validator'
export enum MenuType {
  /** 目录 */
  DIRECTORY,
  /** 菜单 */
  MENU,
  /** 权限 */
  PERMISSION,
}
export class MenuDto {
  // @ApiProperty({ description: '菜单类型' })
  // @IsIn([0, 1, 2])
  // type: number

  @ApiProperty({ description: '菜单类型', enum: MenuType, enumName: 'MenuType' })
  @IsEnum(MenuType, {
    message: `type必须是${MenuType.DIRECTORY}、${MenuType.MENU}、${MenuType.PERMISSION}其中之一`,
  })
  type: MenuType

  @ApiProperty({ description: '父级菜单' })
  @IsOptional()
  parent: number

  @ApiProperty({ description: '菜单或权限名称' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ description: '排序' })
  @IsInt()
  @Min(0)
  orderNo: number

  @ApiProperty({ description: '前端路由地址' })
  // @Matches(/^[/]$/)
  @ValidateIf(o => o.type !== 2)
  path: string

  @ApiProperty({ description: '是否外链', default: 1 })
  @ValidateIf(o => o.type !== 2)
  @IsIn([0, 1])
  external: number

  @ApiProperty({ description: '菜单是否显示', default: 1 })
  @ValidateIf(o => o.type !== 2)
  @IsIn([0, 1])
  show: number

  @ApiProperty({ description: '开启页面缓存', default: 1 })
  @ValidateIf(o => o.type === 1)
  @IsIn([0, 1])
  keepalive: number

  @ApiProperty({ description: '状态', default: 1 })
  @IsIn([0, 1])
  status: number

  @ApiProperty({ description: '菜单图标' })
  @IsOptional()
  @ValidateIf(o => o.type !== 2)
  @IsString()
  icon?: string

  @ApiProperty({ description: '对应权限' })
  @ValidateIf(o => o.type === 2)
  @IsString()
  @IsOptional()
  permission: string

  @ApiProperty({ description: '菜单路由路径或外链' })
  @ValidateIf(o => o.type !== 2)
  @IsString()
  @IsOptional()
  component?: string
}

export class MenuUpdateDto extends PartialType(MenuDto) {}

export class MenuQueryDto extends PartialType(MenuDto) {}
