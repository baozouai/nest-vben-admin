import { MenuType } from '~/modules/system/menu/menu.dto'
import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { isExternal } from '~/utils/is.util'

function createRoute(menu: MenuEntity) {
  if (isExternal(menu.path)) {
    return {
      id: menu.id,
      path: menu.path,
      component: 'IFrame',
      name: menu.name,
      meta: { title: menu.name, icon: menu.icon },
    }
  }

  // 目录
  if (menu.type === MenuType.DIRECTORY) {
    return {
      id: menu.id,
      path: menu.path,
      component: menu.component,
      show: true,
      name: menu.name,
      meta: { title: menu.name, icon: menu.icon },
    }
  }

  return {
    id: menu.id,
    path: menu.path,
    name: menu.name,
    component: menu.component,
    meta: {
      title: menu.name,
      icon: menu.icon,
      ...(menu.show ? null: { hideMenu: !menu.show }),
      ignoreKeepAlive: !menu.keepalive,
    },
  }
}

export type Route = ReturnType<typeof createRoute> & {
  redirect?: string
  children?: Route[]
}

function filterAsyncRoutes(menus: MenuEntity[], parentRoute: MenuEntity) {
  const res: Route[] = []

  menus.forEach((menu) => {
    // 如果是权限或禁用直接跳过
    if (menu.type === MenuType.PERMISSION || !menu.status) return
    // 根级别菜单渲染
    let realRoute: Route
    if (!parentRoute && !menu.parent && menu.type === MenuType.MENU) {
      // 根菜单
      realRoute = createRoute(menu)
    } else if (!parentRoute && !menu.parent && menu.type === MenuType.DIRECTORY) {
      // 目录
      const childRoutes = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu)
      if (childRoutes && childRoutes.length) {
        realRoute.redirect = childRoutes[0].path
        realRoute.children = childRoutes
      }
    } else if (
      parentRoute
      && parentRoute.id === menu.parent
      && menu.type === MenuType.MENU
    ) {
      // 子菜单
      realRoute = createRoute(menu)
    } else if (
      parentRoute
      && parentRoute.id === menu.parent
      && menu.type === MenuType.DIRECTORY
    ) {
      // 如果还是目录，继续递归
      const childRoute = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu)
      if (childRoute && childRoute.length) {
        realRoute.redirect = childRoute[0].path
        realRoute.children = childRoute
      }
    }
    // add curent route
    if (realRoute) res.push(realRoute)
  })
  return res
}

export function generatorRouters(menus: MenuEntity[]) {
  return filterAsyncRoutes(menus, null)
}

// 获取所有菜单以及权限
function filterMenuToTable(menus: MenuEntity[], parentMenu: MenuEntity) {
  const res = []
  menus.forEach((menu) => {
    // 根级别菜单渲染
    let realMenu
    if (!parentMenu && !menu.parent && menu.type === MenuType.MENU) {
      // 根菜单，查找该跟菜单下子菜单，因为可能会包含权限
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (!parentMenu && !menu.parent && menu.type === MenuType.DIRECTORY) {
      // 根目录
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parent && menu.type === MenuType.MENU) {
      // 子菜单下继续找是否有子菜单
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parent && menu.type === MenuType.DIRECTORY) {
      // 如果还是目录，继续递归
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parent && menu.type === MenuType.PERMISSION) {
      realMenu = { ...menu }
    }
    // add curent route
    if (realMenu) {
      realMenu.pid = menu.id
      res.push(realMenu)
    }
  })
  return res
}

export function generatorMenu(menu) {
  return filterMenuToTable(menu, null)
}
