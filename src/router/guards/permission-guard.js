/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:25:07
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

// 导入API接口
import api from '@/api'
// 导入状态管理store
import { useAuthStore, usePermissionStore, useUserStore } from '@/store'
// 导入获取权限和用户信息的辅助函数
import { getPermissions, getUserInfo } from '@/store/helper'

// 白名单路由：无需权限验证即可访问的路径
const WHITE_LIST = ['/login', '/404']
/**
 * 创建权限守卫
 * 在路由跳转前进行权限验证，控制用户访问权限
 * @param {Object} router - Vue Router实例
 */
export function createPermissionGuard(router) {
  // 注册全局前置守卫
  router.beforeEach(async (to) => {
    // 获取认证状态管理实例
    const authStore = useAuthStore()
    // 获取访问令牌
    const token = authStore.accessToken

    /** 未登录状态处理 */
    if (!token) {
      // 如果访问的是白名单路由，直接放行
      if (WHITE_LIST.includes(to.path))
        return true
      // 否则重定向到登录页，并保存原始访问路径用于登录后跳转
      return { path: 'login', query: { ...to.query, redirect: to.path } }
    }

    /** 已登录状态处理 */
    // 如果已登录用户访问登录页，重定向到首页
    if (to.path === '/login')
      return { path: '/' }
    // 白名单路由直接放行
    if (WHITE_LIST.includes(to.path))
      return true

    // 获取用户和权限状态管理实例
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    
    // 如果用户信息未加载，进行初始化
    if (!userStore.userInfo) {
      // 并行获取用户信息和权限数据，提高加载效率
      const [user, permissions] = await Promise.all([getUserInfo(), getPermissions()])
      
      // 保存用户信息到store
      userStore.setUser(user)
      console.log('permissions', permissions);
      
      // 设置权限数据，这里会生成菜单和可访问路由
      permissionStore.setPermissions(permissions)
      
      // 使用Vite的glob导入功能，动态导入所有Vue组件
      const routeComponents = import.meta.glob('@/views/**/*.vue')
      
      // 遍历可访问路由，动态注册到路由器中
      permissionStore.accessRoutes.forEach((route) => {
        // 为路由分配对应的组件
        route.component = routeComponents[route.component] || undefined
        // 如果路由不存在，则添加到路由器中
        !router.hasRoute(route.name) && router.addRoute(route)
      })
      
      // 重新导航到目标路由，确保新注册的路由生效
      return { ...to, replace: true }
    }

    // 检查目标路由是否已注册
    const routes = router.getRoutes()
    if (routes.find(route => route.name === to.name))
      return true

    // 路由不存在时，判断是权限不足还是页面不存在
    const { data: hasMenu } = await api.validateMenuPath(to.path)
    return hasMenu
      ? { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } }  // 有菜单但无权限访问
      : { name: '404', query: { path: to.fullPath } }  // 菜单不存在，页面不存在
  })
}
