<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/16 18:49:42
 - @Email: zclzone@outlook.com
 - Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 --------------------------------->

<template>
  <!-- 
    根组件配置：
    - 使用 n-config-provider 提供全局配置
    - wh-full 类设置宽高为100%
    - 配置中文语言包
    - 根据 isDark 状态切换暗黑主题
    - 应用自定义主题覆盖
  -->
  <n-config-provider class="wh-full" :locale="zhCN" :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined" :theme-overrides="appStore.naiveThemeOverrides">
    <!-- 
      路由视图：
      - 仅在Layout组件存在时渲染
      - 使用具名插槽获取当前路由组件和路由信息
    -->
    <router-view v-if="Layout" v-slot="{ Component, route: curRoute }">
      <!-- 动态渲染当前布局组件 -->
      <component :is="Layout">
        <!-- 
          页面切换过渡效果：
          - fade-slide: 淡入淡出+滑动效果
          - mode="out-in": 当前元素先消失，新元素再出现
          - appear: 初次渲染时也应用过渡效果
        -->
        <transition name="fade-slide" mode="out-in" appear>
          <!-- 
            缓存路由组件：
            - 仅缓存 keepAliveNames 中指定的组件
            - 当 tabStore.reloading 为 true 时不渲染组件(用于页面刷新)
            - 使用路由完整路径作为 key，确保路由参数变化时重新渲染
          -->
          <KeepAlive :include="keepAliveNames">
            <component :is="Component" v-if="!tabStore.reloading" :key="curRoute.fullPath" />
          </KeepAlive>
        </transition>
      </component>

      <!-- 布局设置面板，固定在右侧中间位置，仅在 layoutSettingVisible 为 true 时显示 -->
      <LayoutSetting v-if="layoutSettingVisible" class="fixed right-12 top-1/2 z-999" />
    </router-view>
  </n-config-provider>
</template>

<script setup>
// 导入 Naive UI 相关组件和中文语言包
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
// 导入布局设置组件
import { LayoutSetting } from '@/components'
// 导入应用状态和标签页状态管理
import { useAppStore, useTabStore } from '@/store'
// 导入布局设置可见性配置
import { layoutSettingVisible } from './settings'

/**
 * 布局组件缓存管理
 * 使用 Map 缓存已加载的布局组件，避免重复加载导致页面闪烁
 */
const layouts = new Map()
/**
 * 获取布局组件
 * @param {string} name - 布局名称
 * @returns {Component} 布局组件
 */
function getLayout(name) {
  // 如果布局已缓存，直接返回缓存的组件
  if (layouts.get(name))
    return layouts.get(name)
  // 异步加载布局组件并使用 markRaw 标记不需要响应式处理
  console.log("layoutName: " + name);
  
  const layout = markRaw(defineAsyncComponent(() => import(`@/layouts/${name}/index.vue`)))
  // 将加载的布局组件缓存
  layouts.set(name, layout)
  return layout
}

// 获取当前路由实例
const route = useRoute()
// 获取应用全局状态
const appStore = useAppStore()
// 如果布局为 'default'，重置为空字符串
if (appStore.layout === 'default')
  appStore.setLayout('')
/**
 * 计算当前应该使用的布局组件
 * 优先使用路由元信息中指定的布局，其次使用应用全局布局
 */
const Layout = computed(() => {
  // 如果路由没有匹配项，返回 null
  if (!route.matched?.length)
    return null
  // 获取布局组件：优先使用路由元信息中的布局，其次使用全局布局
  return getLayout(route.meta?.layout || appStore.layout)
})

// 获取标签页状态管理
const tabStore = useTabStore()
/**
 * 计算需要缓存的组件名称列表
 * 从标签页列表中筛选出需要缓存的组件
 */
const keepAliveNames = computed(() => {
  return tabStore.tabs.filter(item => item.keepAlive).map(item => item.name)
})

/**
 * 监听主题色变化
 * 当主题色或暗黑模式状态变化时，更新应用主题色
 */
watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
})
</script>
