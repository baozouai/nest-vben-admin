import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { isEmpty } from 'lodash';

import { ListDTO } from '@/common/dto/list.dto';
import { IsUnique } from '@/database/constraints/unique.constraint';
import { UserEntity } from '@/modules/system/user/entities/user.entity';

export class UserCreateDto {
  @ApiProperty({ description: '登录账号', example: 'kz-admin' })
  @IsString()
  @Matches(/^[a-z0-9A-Z\W_]+$/)
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @ApiProperty({ description: '登录密码', example: 'a123456' })
  @IsOptional()
  @Matches(/^\S*(?=\S{6,})(?=\S*\d)(?=\S*[A-Za-z])\S*$/, {
    message: '密码必须包含数字、字母，长度为6-16',
  })
  password: string;

  @ApiProperty({ description: '归属角色', type: [Number] })
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roleIds: number[];

  @ApiProperty({ description: '归属大区', type: Number })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  deptId?: number;

  @ApiProperty({ description: '呢称', example: 'kz-admin' })
  @IsOptional()
  @IsString()
  nickName: string;

  @ApiProperty({ description: '邮箱', example: 'hi@kuizuo.cn' })
  @IsUnique(UserEntity, { message: '邮箱已被注册' })
  @IsEmail()
  @ValidateIf((o) => !isEmpty(o.email))
  email: string;

  @ApiProperty({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'QQ' })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]{4,10}$/)
  @MinLength(5)
  @MaxLength(11)
  qq?: string;

  @ApiProperty({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '状态' })
  @IsIn([0, 1])
  status: number;
}

export class UserUpdateDto extends PartialType(UserCreateDto) {
  @IsInt()
  @Min(1)
  id!: number;
}

export class UserListDto extends ListDTO<UserCreateDto> {}