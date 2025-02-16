import { InjectRedis } from '@liaoliaots/nestjs-redis'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { concat, isEmpty, uniq } from 'lodash'

import { In, IsNull, Like, Not, Repository } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { MenuEntity } from '~/modules/system/menu/menu.entity'

import { Route, deleteEmptyChildren, generatorMenu, generatorRouters } from '~/utils'

import { RoleService } from '../role/role.service'

import { MenuDto, MenuQueryDto, MenuType, MenuUpdateDto } from './menu.dto'

@Injectable()
export class MenuService {
  constructor(
    @InjectRedis() private redis: Redis,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    private roleService: RoleService,
  ) {}

  /**
   * 获取所有菜单以及权限
   */
  async list({
    name,
    path,
    permission,
    component,
    status,
  }: MenuQueryDto): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(component && { component: Like(`%${component}%`) }),
        ...(status && { status }),
      },
      order: { orderNo: 'ASC' },
    })
    const menuList = generatorMenu(menus)

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return menuList
    }
    // 如果生产树形结构为空，则返回原始菜单列表
    return menus
  }

  async create(menu: MenuDto): Promise<void> {
    await this.menuRepository.save(menu)
  }

  async update(id: number, menu: MenuUpdateDto): Promise<void> {
    await this.menuRepository.update(id, menu)
  }

  /**
   * 根据角色获取所有菜单
   */
  async getMenus(uid: number): Promise<Route[]> {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let menus: MenuEntity[] = []

    if (isEmpty(roleIds)) return []

    if (this.roleService.hasAdminRole(roleIds)) {
      menus = await this.menuRepository.find({ order: { orderNo: 'ASC' } })
    }
    else {
      // menus = await this.menuRepository
      //   .createQueryBuilder('menu')
      //   .innerJoinAndSelect('menu.roles', 'role')
      //   .andWhere('role.id IN (:...roleIds)', { roleIds })
      //   .orderBy('menu.order_no', 'ASC')
      //   .getMany()
      menus = await this.menuRepository.find({
        where: {
          roles: {
            id: In(roleIds),
          },
        },
        order: {
          orderNo: 'ASC',
        },
        relations: {
          roles: true,
        }
      })
    }

    const menuList = generatorRouters(menus)
    return menuList
  }

  /**
   * 检查菜单创建规则是否符合
   */
  async check(dto: Partial<MenuDto>): Promise<void | never> {
    if (dto.type === MenuType.PERMISSION && !dto.parent) {
      // 权限必须有parent
      throw new BusinessException(ErrorEnum.PERMISSION_REQUIRES_PARENT)
    }
    if (dto.type === MenuType.MENU && dto.parent) {
      const parent = await this.getMenuItemInfo(dto.parent)
      if (isEmpty(parent))
        throw new BusinessException(ErrorEnum.PARENT_MENU_NOT_FOUND)

      if (parent.type === MenuType.MENU) {
        // 当前新增为菜单但父节点也为菜单时为非法操作
        throw new BusinessException(
          ErrorEnum.ILLEGAL_OPERATION_DIRECTORY_PARENT,
        )
      }
    }
  }

  /**
   * 查找当前菜单下的子菜单，目录以及菜单
   */
  async findChildMenuIds(mid: number): Promise<number[]> {
    const allMenuIds: number[] = []
    // 找到当前mid下的所有子目录
    const childMenus = await this.menuRepository.findBy({ parent: mid })
    // if (_.isEmpty(menus)) {
    //   return allMenus;
    // }
    // const childMenus: any = [];
    for (const childMenu of childMenus) {
      if (childMenu.type !== 2) {
        // 子目录下是菜单或目录，继续往下级查找
        const c = await this.findChildMenuIds(childMenu.id)
        allMenuIds.push(...c)
      }
      allMenuIds.push(childMenu.id)
    }
    return allMenuIds
  }

  /**
   * 获取某个菜单的信息
   * @param mid menu id
   */
  async getMenuItemInfo(mid: number): Promise<MenuEntity> {
    const menu = await this.menuRepository.findOneBy({ id: mid })
    return menu
  }

  /**
   * 获取某个菜单以及关联的父菜单的信息
   */
  async getMenuItemAndParentInfo(mid: number) {
    const menu = await this.menuRepository.findOneBy({ id: mid })
    let parentMenu: MenuEntity | undefined
    if (menu && menu.parent)
      parentMenu = await this.menuRepository.findOneBy({ id: menu.parent })

    return { menu, parentMenu }
  }

  /**
   * 查找节点路由是否存在
   */
  async findRouterExist(path: string): Promise<boolean> {
    const menus = await this.menuRepository.findOneBy({ path })
    return !isEmpty(menus)
  }

  /**
   * 获取当前用户的所有权限
   */
  async getPermissions(uid: number): Promise<string[]> {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let permission: string[] = []
    let result: MenuEntity[] = null
    if (this.roleService.hasAdminRole(roleIds)) {
      result = await this.menuRepository.findBy({
        permission: Not(IsNull()),
        type: In([MenuType.MENU, MenuType.PERMISSION]),
      })
    }
    else {
      if (isEmpty(roleIds))
        return permission

      // result = await this.menuRepository
      //   .createQueryBuilder('menu')
      //   .innerJoinAndSelect('menu.roles', 'role')
      //   .andWhere('role.id IN (:...roleIds)', { roleIds })
      //   .andWhere('menu.type IN (1,2)')
      //   .andWhere('menu.permission IS NOT NULL')
      //   .getMany()

      result = await this.menuRepository.find({
        where: {
          type: In([MenuType.MENU, MenuType.PERMISSION]),
          roles: {
            id: In(roleIds),
          },
          permission: Not(IsNull()),
        },
        // relations: {
        //   roles: true,
        // }
      })
    }

    result.forEach((e) => {
      if (e.permission)
        permission = concat(permission, e.permission.split(','))
    })
    permission = uniq(permission)

    return permission
  }

  /**
   * 删除多项菜单
   */
  async deleteMenuItem(mids: number[]): Promise<void> {
    await this.menuRepository.delete(mids)
  }

  /**
   * 刷新指定用户ID的权限
   */
  async refreshPerms(uid: number): Promise<void> {
    const perms = await this.getPermissions(uid)
    const online = await this.redis.get(`admin:token:${uid}`)
    if (online) {
      // 判断是否在线
      await this.redis.set(`admin:perms:${uid}`, JSON.stringify(perms))
    }
  }

  /**
   * 刷新所有在线用户的权限
   */
  async refreshOnlineUserPerms(): Promise<void> {
    const onlineUserIds: string[] = await this.redis.keys('admin:token:*')
    if (onlineUserIds) {
      onlineUserIds
        .map(i => i.split('admin:token:')[1])
        .filter(Boolean)
        .forEach(async (uid) => {
          const perms = await this.getPermissions(Number.parseInt(uid))
          await this.redis.set(`admin:perms:${uid}`, JSON.stringify(perms))
        })
    }
  }

  /**
   * 根据菜单ID查找是否有关联角色
   */
  async checkRoleByMenuId(id: number): Promise<boolean> {
    const menu = await this.menuRepository.findOne({
      where: {
        id,
      },
      relations: ['roles']
    })
    return !!menu.roles?.length
  }
}
