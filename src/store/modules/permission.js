/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:25:47
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

// 导入VueUse工具函数：将驼峰命名转换为连字符命名
import { hyphenate } from '@vueuse/core'
// 导入Pinia状态管理库的defineStore函数
import { defineStore } from 'pinia'
// 导入工具函数：判断是否为外部链接
import { isExternal } from '@/utils'

// 定义权限管理的Pinia store
export const usePermissionStore = defineStore('permission', {
  // 状态定义
  state: () => ({
    accessRoutes: [],  // 可访问的路由列表
    permissions: [],   // 用户权限列表
    menus: [],        // 菜单列表
  }),
  // 动作定义
  actions: {
    /**
     * 设置用户权限并生成菜单
     * @param {Array} permissions - 权限数据数组
     */
    setPermissions(permissions) {
      // 保存权限数据
      this.permissions = permissions
      // 从权限数据中筛选出菜单类型的项目，生成菜单结构
      this.menus = this.permissions
        .filter(item => item.type === 'MENU')  // 只保留菜单类型
        .map(item => this.getMenuItem(item))   // 转换为菜单项格式
        .filter(item => !!item)               // 过滤掉空值
        .sort((a, b) => a.order - b.order)    // 按order字段排序
    },
    /**
     * 根据权限项生成菜单项
     * @param {Object} item - 权限项数据
     * @param {Object} parent - 父级菜单项
     * @returns {Object|null} - 菜单项对象或null
     */
    getMenuItem(item, parent) {
      // 生成路由配置
      const route = this.generateRoute(item, item.show ? null : parent?.key)
      
      // 如果项目启用且有路径且不是外部链接，则添加到可访问路由中
      if (item.enable && route.path && !route.path.startsWith('http'))
        this.accessRoutes.push(route)
      
      // 构建菜单项对象
      const menuItem = {
        label: route.meta.title,                                    // 菜单显示名称
        key: route.name,                                           // 菜单唯一标识
        path: route.path,                                          // 路由路径
        originPath: route.meta.originPath,                         // 原始路径（用于外部链接）
        icon: () => h('i', { class: `${route.meta.icon} text-16` }), // 图标渲染函数
        order: item.order ?? 0,                                    // 排序权重
      }
      
      // 处理子菜单
      const children = item.children?.filter(item => item.type === 'MENU') || []
      if (children.length) {
        // 递归生成子菜单项
        menuItem.children = children
          .map(child => this.getMenuItem(child, menuItem))  // 递归调用
          .filter(item => !!item)                          // 过滤空值
          .sort((a, b) => a.order - b.order)               // 排序
        
        // 如果没有有效的子菜单，删除children属性
        if (!menuItem.children.length)
          delete menuItem.children
      }
      
      // 如果设置为不显示，返回null
      if (!item.show)
        return null
      
      return menuItem
    },
    /**
     * 根据权限项生成路由配置
     * @param {Object} item - 权限项数据
     * @param {string} parentKey - 父级菜单的key
     * @returns {Object} - 路由配置对象
     */
    generateRoute(item, parentKey) {
      let originPath
      
      // 处理外部链接：如果是外部链接，使用iframe组件包装
      if (isExternal(item.path)) {
        originPath = item.path                                    // 保存原始外部链接
        item.component = '/src/views/iframe/index.vue'            // 使用iframe组件
        item.path = `/iframe/${hyphenate(item.code)}`             // 生成内部路径
      }
      
      // 返回Vue Router路由配置对象
      return {
        name: item.code,                    // 路由名称
        path: item.path,                    // 路由路径
        redirect: item.redirect,            // 重定向路径
        component: item.component,          // 组件路径
        meta: {                            // 路由元信息
          originPath,                      // 原始路径（外部链接时使用）
          icon: `${item.icon}?mask`,       // 图标（添加mask参数）
          title: item.name,                // 页面标题
          layout: item.layout,             // 布局类型
          keepAlive: !!item.keepAlive,     // 是否缓存组件
          parentKey,                       // 父级菜单key
          btns: item.children              // 按钮权限列表
            ?.filter(item => item.type === 'BUTTON')  // 筛选按钮类型
            .map(item => ({ code: item.code, name: item.name })), // 提取按钮信息
        },
      }
    },
    /**
     * 重置权限状态
     * 清空所有权限相关数据，恢复到初始状态
     */
    resetPermission() {
      this.$reset()  // Pinia提供的重置方法，将state恢复到初始值
    },
  },
})
