/**********************************
 * @Description: 入口文件
 * @FilePath: main.js
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/04 22:41:32
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

// 导入Vue 3的createApp函数，用于创建应用实例
import { createApp } from 'vue'
// 导入根组件
import App from './App.vue'
// 导入自定义指令设置函数
import { setupDirectives } from './directives'

// 导入路由设置函数
import { setupRouter } from './router'
// 导入状态管理设置函数（Pinia）
import { setupStore } from './store'
// 导入Naive UI离散式API设置函数
import { setupNaiveDiscreteApi } from './utils'
// 导入CSS重置样式
import '@/styles/reset.css'
// 导入全局CSS样式
import '@/styles/global.css'
// 导入UnoCSS样式（原子化CSS框架）
import 'uno.css'

/**
 * 应用启动函数
 * 按顺序初始化各个模块并启动Vue应用
 */
async function bootstrap() {
  // 创建Vue应用实例
  const app = createApp(App)
  
  // 设置状态管理（Pinia store）
  setupStore(app)
  
  // 设置自定义指令
  setupDirectives(app)
  
  // 设置路由（异步操作，等待路由守卫配置完成）
  await setupRouter(app)
  
  // 将应用挂载到DOM元素#app上
  app.mount('#app')
  
  // 设置Naive UI的离散式API（如消息提示、对话框等）
  setupNaiveDiscreteApi()
}

// 启动应用
bootstrap()
