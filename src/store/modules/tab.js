/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:25:52
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

import { defineStore } from 'pinia'
import { useRouterStore } from './router'

// 定义标签页状态管理store
export const useTabStore = defineStore('tab', {
  state: () => ({
    tabs: [],         // 存储所有标签页
    activeTab: '',    // 当前激活的标签页路径
    reloading: false, // 是否正在重新加载
  }),
  
  getters: {
    // 获取当前激活标签页的索引
    activeIndex() {
      return this.tabs.findIndex(item => item.path === this.activeTab)
    },
  },
  
  actions: {
    // 设置当前激活的标签页
    async setActiveTab(path) {
      await nextTick() // 等待DOM更新完成再设置激活状态
      this.activeTab = path
    },
    
    // 设置标签页列表
    setTabs(tabs) {
      this.tabs = tabs
    },
    
    // 添加标签页
    addTab(tab = {}) {
      const findIndex = this.tabs.findIndex(item => item.path === tab.path)
      if (findIndex !== -1) {
        // 如果标签页已存在则更新
        this.tabs.splice(findIndex, 1, tab)
      } else {
        // 否则添加新标签页
        this.setTabs([...this.tabs, tab])
      }
      this.setActiveTab(tab.path)
    },
    
    // 重新加载标签页
    async reloadTab(path, keepAlive) {
      const findItem = this.tabs.find(item => item.path === path)
      if (!findItem) return
      
      // 更新key使keepAlive失效
      if (keepAlive) findItem.keepAlive = false
      
      $loadingBar.start()  // 显示加载进度条
      this.reloading = true // 设置重新加载状态
      await nextTick()
      this.reloading = false
      findItem.keepAlive = !!keepAlive
      
      // 滚动到顶部并完成加载
      setTimeout(() => {
        document.documentElement.scrollTo({ left: 0, top: 0 })
        $loadingBar.finish()
      }, 100)
    },
    
    // 移除指定标签页
    async removeTab(path) {
      this.setTabs(this.tabs.filter(tab => tab.path !== path))
      if (path === this.activeTab) {
        // 如果移除的是当前激活标签页，则跳转到最后一个标签页
        useRouterStore().router?.push(this.tabs[this.tabs.length - 1].path)
      }
    },
    
    // 移除其他标签页（保留当前）
    removeOther(curPath = this.activeTab) {
      this.setTabs(this.tabs.filter(tab => tab.path === curPath))
      if (curPath !== this.activeTab) {
        useRouterStore().router?.push(this.tabs[this.tabs.length - 1].path)
      }
    },
    
    // 移除左侧标签页
    removeLeft(curPath) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index >= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.find(item => item.path === this.activeTab)) {
        useRouterStore().router?.push(filterTabs[filterTabs.length - 1].path)
      }
    },
    
    // 移除右侧标签页
    removeRight(curPath) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index <= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.find(item => item.path === this.activeTab.value)) {
        useRouterStore().router?.push(filterTabs[filterTabs.length - 1].path)
      }
    },
    
    // 重置标签页状态
    resetTabs() {
      this.$reset()
    },
  },
  
  // 持久化配置
  persist: {
    pick: ['tabs'],  // 只持久化tabs状态
    storage: sessionStorage,  // 使用sessionStorage存储
  },
})
