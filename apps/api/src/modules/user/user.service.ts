import { InjectRedis } from '@liaoliaots/nestjs-redis'
import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { isEmpty, isNil, isUndefined } from 'lodash'

import { EntityManager, In, Like, Repository } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { SYS_USER_INITPASSWORD } from '~/constants/system.constant'

import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { AccountUpdateDto } from '~/modules/auth/dto/account.dto'
import { RegisterDto } from '~/modules/auth/dto/auth.dto'
import { QQService } from '~/shared/helper/qq.service'

import { md5, randomValue } from '~/utils'

import { DictService } from '../system/dict/dict.service'
import { RoleEntity } from '../system/role/role.entity'

import { UserStatus } from './constant'
import { PasswordUpdateDto } from './dto/password.dto'
import { UserDto, UserQueryDto, UserStatusDto, UserUpdateDto } from './dto/user.dto'
import { UserEntity } from './entities/user.entity'
import { AccountInfo } from './user.model'
import { DeptService } from '../system/dept/dept.service'

@Injectable()
export class UserService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly dictService: DictService,
    private readonly qqService: QQService,
    private readonly configService: ConfigService,
    private readonly deptService: DeptService
  ) {}

  async findUserById(id: number): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        id,
        status: UserStatus.Enabled,
      })
      .getOne()
  }

  async findUserByUserName(username: string): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        username,
        status: UserStatus.Enabled,
      })
      .getOne()
  }

  /**
   * 获取用户信息
   * @param uid user id
   */
  async getAccountInfo(uid: number): Promise<AccountInfo> {
    // const user: UserEntity = await this.userRepository
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect('user.roles', 'role')
    //   .where(`user.id = :uid`, { uid })
    //   .getOne()
    const user = await this.userRepository.findOne({
      where: {
        id: uid,
      },
      relations: {
        roles: true
      }
    })
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    // delete user?.psalt

    return user
  }

  /**
   * 更新个人信息
   */
  async updateAccountInfo(uid: number, info: AccountUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    const data = {
      ...(info.nickname ? { nickname: info.nickname } : null),
      ...(info.avatar ? { avatar: info.avatar } : null),
      ...(info.email ? { email: info.email } : null),
      ...(info.phone ? { phone: info.phone } : null),
      ...(info.qq ? { qq: info.qq } : null),
      ...(info.remark ? { remark: info.remark } : null),
    }

    if (!info.avatar && info.qq) {
      // 如果qq不等于原qq，则更新qq头像
      if (info.qq !== user.qq)
        data.avatar = await this.qqService.getAvater(info.qq)
    }

    await this.userRepository.update(uid, data)
  }

  /**
   * 更改密码
   */
  async updatePassword(uid: number, dto: PasswordUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    const comparePassword = md5(`${dto.oldPassword}${user.psalt}`)
    // 原密码不一致，不允许更改
    if (user.password !== comparePassword)
      throw new BusinessException(ErrorEnum.PASSWORD_MISMATCH)

    const password = md5(`${dto.newPassword}${user.psalt}`)
    await this.userRepository.update({ id: uid }, { password })
    await this.upgradePasswordV(user.id)
  }

  /**
   * 直接更改密码
   */
  async forceUpdatePassword(uid: number, password: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })

    const newPassword = md5(`${password}${user.psalt}`)
    await this.userRepository.update({ id: uid }, { password: newPassword })
    await this.upgradePasswordV(user.id)
  }

  /**
   * 增加系统用户，如果返回false则表示已存在该用户
   */
  async create({
    username,
    password,
    roleIds: roles,
    ...data
  }: UserDto): Promise<void> {
    const exists = await this.userRepository.findOneBy({
      username,
    })
    if (!isEmpty(exists))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    await this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)

      if (!password) {
        const initPassword = await this.dictService.findValueByKey(
          SYS_USER_INITPASSWORD,
        )
        password = md5(`${initPassword ?? '123456'}${salt}`)
      }
      else {
        password = md5(`${password ?? '123456'}${salt}`)
      }

      const u = manager.create(UserEntity, {
        username,
        password,
        ...data,
        psalt: salt,
        roles: await this.roleRepository.findBy({ id: In(roles) } ),
      })

      const newUser = await manager.save(u)
      return newUser
    })
  }

  /**
   * 更新用户信息
   */
  async update(
    id: number,
    { password, deptId, roleIds, status, ...data }: UserUpdateDto,
  ): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      if (password) await this.forceUpdatePassword(id, password)

      await manager.update(UserEntity, id, {
        ...data,
        status,
      })

      // const user = await this.userRepository
      //   .createQueryBuilder('user')
      //   .leftJoinAndSelect('user.roles', 'roles')
      //   .leftJoinAndSelect('user.dept', 'dept')
      //   .where('user.id = :id', { id })
      //   .getOne()
      const user = await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['roles', 'dept']
      })
      await manager
        .createQueryBuilder()
        .relation(UserEntity, 'roles')
        .of(id)
        .addAndRemove(roleIds, user.roles)

      await manager
        .createQueryBuilder()
        .relation(UserEntity, 'dept')
        .of(id)
        .set(deptId)

      if (status === UserStatus.Disable) {
        // 禁用状态
        await this.multiForbidden(id)
      }
    })
  }

  /**
   * 查找用户信息
   * @param id 用户id
   */
  async info(id: number): Promise<UserEntity> {
    // const user = await this.userRepository
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect('user.roles', 'roles')
    //   .leftJoinAndSelect('user.dept', 'dept')
    //   .where('user.id = :id', { id })
    //   .getOne()
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: ['roles', 'dept']
    })
    // delete user.password
    // delete user.psalt

    return user
  }

  /**
   * 根据ID列表删除用户
   */
  async delete(userIds: number[]): Promise<void | never> {
    const rootUserId = await this.findRootUserId()
    if (userIds.includes(rootUserId))
      throw new BadRequestException('不能删除root用户!')

    await this.userRepository.delete(userIds)
  }

  /**
   * 查找超管的用户ID
   */
  async findRootUserId(): Promise<number> {
    const user = await this.userRepository.findOneBy({
      roles: { id: 1 },
    })
    return user.id
  }

  /**
   * 查询用户列表
   */
  async list({
    page,
    pageSize,
    username,
    nickname,
    deptId,
    email,
    status,
  }: UserQueryDto): Promise<Pagination<UserEntity>> {

    // const queryBuilder = this.userRepository
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect('user.dept', 'dept')
    //   .leftJoinAndSelect('user.roles', 'role')
    //   // .where('user.id NOT IN (:...ids)', { ids: [rootUserId, uid] })
    //   .where({
    //     ...(username ? { username: Like(`%${username}%`) } : null),
    //     ...(nickname ? { nickname: Like(`%${nickname}%`) } : null),
    //     ...(email ? { email: Like(`%${email}%`) } : null),
    //     ...(status ? { status } : null),
    //   })

    //   if (deptId) {
    //    const allIds = await this.deptService.getDeptIds(deptId)
    //     queryBuilder.where({
    //       dept: {
    //         id: In(allIds)
    //       }
    //     })
    //   }


    // return paginate<UserEntity>(queryBuilder, {
    //   page,
    //   pageSize,
    // })
    return paginate<UserEntity>(this.userRepository, {
      page,
      pageSize,
    }, {
      where: {
        ...(username ? { username: Like(`%${username}%`) } : null),
        ...(nickname ? { nickname: Like(`%${nickname}%`) } : null),
        ...(email ? { email: Like(`%${email}%`) } : null),
        ...(isUndefined(status) ? null: { status }),
        ...(deptId ? { dept: { id: In(await this.deptService.getDeptIds(deptId)) } } : null),
      },
      relations: ['dept', 'roles']
    })
  }

  /**
   * 禁用用户
   */
  async forbidden(uid: number, { status }: UserStatusDto): Promise<void> {
    await this.userRepository.update(uid, { status })
    await this.multiForbidden(uid)
  }

  /**
   * 禁用多个用户
   */
  async multiForbidden(uids: number | number[]): Promise<void> {
    if (uids) {
      if (!Array.isArray(uids)) uids = [uids]
      const pvs: string[] = []
      const ts: string[] = []
      const ps: string[] = []
      uids.forEach((e) => {
        pvs.push(`admin:passwordVersion:${e}`)
        ts.push(`admin:token:${e}`)
        ps.push(`admin:perms:${e}`)
      })
      await this.redis.del(pvs)
      await this.redis.del(ts)
      await this.redis.del(ps)
    }
  }

  /**
   * 升级用户版本密码
   */
  async upgradePasswordV(id: number): Promise<void> {
    // admin:passwordVersion:${param.id}
    const v = await this.redis.get(`admin:passwordVersion:${id}`)
    if (!isEmpty(v))
      await this.redis.set(`admin:passwordVersion:${id}`, Number.parseInt(v) + 1)
  }

  /**
   * 判断用户名是否存在
   */
  async exist(username: string) {
    const user = await this.userRepository.findOneBy({ username })
    if (isNil(user))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    return true
  }

  /**
   * 注册
   */
  async register({ username, ...data }: RegisterDto): Promise<void> {
    const exists = await this.userRepository.findOneBy({
      username,
    })
    if (!isEmpty(exists))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    await this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)

      const password = md5(`${data.password ?? 'a123456'}${salt}`)

      const u = manager.create(UserEntity, {
        username,
        password,
        status: 1,
        psalt: salt,
      })

      const user = await manager.save(u)

      return user
    })
  }
}
