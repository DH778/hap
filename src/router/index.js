/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:25:23
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

// 导入Vue Router的核心函数：创建路由器、Hash模式历史记录、HTML5模式历史记录
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
// 导入基础路由配置
import { basicRoutes } from './basic-routes'
// 导入路由守卫设置函数
import { setupRouterGuards } from './guards'

// 创建并导出路由器实例
export const router = createRouter({
  // 根据环境变量决定使用Hash模式还是HTML5 History模式
  history:
    import.meta.env.VITE_USE_HASH === 'true'
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH || '/') // Hash模式：URL带#号
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),    // HTML5模式：干净的URL
  
  // 路由配置数组
  routes: basicRoutes,
  
  // 滚动行为：每次路由切换时滚动到页面顶部
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

/**
 * 设置路由器
 * 将路由器安装到Vue应用实例并配置路由守卫
 * @param {Object} app - Vue应用实例
 */
export async function setupRouter(app) {
  // 将路由器安装到Vue应用实例
  app.use(router)
  // 设置路由守卫（如权限验证、登录检查等）
  setupRouterGuards(router)
}
