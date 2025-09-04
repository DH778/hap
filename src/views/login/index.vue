<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/05 21:28:36
 - @Email: zclzone@outlook.com
 - Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 --------------------------------->

<template>
  <!-- 登录页面主容器，使用背景图片 -->
  <div class="wh-full flex-col bg-[url(@/assets/images/login_bg.webp)] bg-cover">
    <!-- 登录卡片容器 -->
    <div class="m-auto max-w-700 min-w-345 f-c-c rounded-8 auto-bg bg-opacity-20 bg-cover p-12 card-shadow">
      <!-- 左侧装饰图片，在中等屏幕以上显示 -->
      <div class="hidden w-380 px-20 py-35 md:block">
        <img src="@/assets/images/login_banner.webp" class="w-full" alt="login_banner">
      </div>

      <!-- 右侧登录表单区域 -->
      <div class="w-320 flex-col px-20 py-32">
        <!-- 应用标题和Logo -->
        <h2 class="f-c-c text-24 text-#6a6a6a font-normal">
          <img src="@/assets/images/logo.png" class="mr-12 h-50">
          {{ title }}
        </h2>
        <n-input v-model:value="loginInfo.username" autofocus class="mt-32 h-40 items-center" placeholder="请输入用户名"
          :maxlength="20">
          <template #prefix>
            <i class="i-fe:user mr-12 opacity-20" />
          </template>
        </n-input>
        <n-input v-model:value="loginInfo.password" class="mt-20 h-40 items-center" type="password"
          show-password-on="mousedown" placeholder="请输入密码" :maxlength="20" @keydown.enter="handleLogin()">
          <template #prefix>
            <i class="i-fe:lock mr-12 opacity-20" />
          </template>
        </n-input>

        <div class="mt-20 flex items-center">
          <n-input v-model:value="loginInfo.captcha" class="h-40 items-center" palceholder="请输入验证码" :maxlength="4"
            @keydown.enter="handleLogin()">
            <template #prefix>
              <i class="i-fe:key mr-12 opacity-20" />
            </template>
          </n-input>
          <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" height="40" class="ml-12 w-80 cursor-pointer"
            @click="initCaptcha">
        </div>

        <n-checkbox class="mt-20" :checked="isRemember" label="记住我" :on-update:checked="(val) => (isRemember = val)" />

        <div class="mt-20 flex items-center">
          <n-button class="h-40 flex-1 rounded-5 text-16" type="primary" ghost @click="quickLogin()">
            一键体验
          </n-button>

          <n-button class="ml-32 h-40 flex-1 rounded-5 text-16" type="primary" :loading="loading"
            @click="handleLogin()">
            登录
          </n-button>
        </div>
      </div>
    </div>

    <TheFooter class="py-12" />
  </div>
</template>

<script setup>
// 导入VueUse的本地存储组合式函数
import { useStorage } from '@vueuse/core'
// 导入认证状态管理
import { useAuthStore } from '@/store'
// 导入本地存储工具和节流函数
import { lStorage, throttle } from '@/utils'
// 导入登录相关API
import api from './api'

// 获取认证状态管理实例
const authStore = useAuthStore()
// 获取路由相关实例
const router = useRouter()
const route = useRoute()
// 从环境变量获取应用标题
const title = import.meta.env.VITE_TITLE

// 登录表单信息响应式数据
const loginInfo = ref({
  username: '',
  password: '',
})

// 验证码图片URL
const captchaUrl = ref('')
// 初始化验证码函数，使用节流防止频繁请求
const initCaptcha = throttle(() => {
  captchaUrl.value = `${import.meta.env.VITE_AXIOS_BASE_URL}/auth/captcha?${Date.now()}`
}, 500)

// 从本地存储获取登录信息并填充表单
const localLoginInfo = lStorage.get('loginInfo')
if (localLoginInfo) {
  loginInfo.value.username = localLoginInfo.username || ''
  loginInfo.value.password = localLoginInfo.password || ''
}
// 页面加载时初始化验证码
initCaptcha()

/**
 * 一键体验登录函数
 * 使用默认的管理员账号快速登录
 */
function quickLogin() {
  loginInfo.value.username = 'admin'
  loginInfo.value.password = '123456'
  handleLogin(true)
}

// 记住我选项，使用VueUse的useStorage持久化存储
const isRemember = useStorage('isRemember', true)
// 登录加载状态
const loading = ref(false)
/**
 * 处理登录逻辑
 * @param {boolean} isQuick - 是否为快速登录（一键体验）
 */
async function handleLogin(isQuick) {
  const { username, password, captcha } = loginInfo.value
  
  // 表单验证
  if (!username || !password)
    return $message.warning('请输入用户名和密码')
  if (!isQuick && !captcha)
    return $message.warning('请输入验证码')
    
  try {
    // 设置加载状态和提示信息
    loading.value = true
    $message.loading('正在验证，请稍后...', { key: 'login' })
    
    // 调用登录API
    const { data } = await api.login({ username, password: password.toString(), captcha, isQuick })
    console.log("登录API",data)
    // 根据"记住我"选项处理本地存储
    if (isRemember.value) {
      lStorage.set('loginInfo', { username, password })
    }
    else {
      lStorage.remove('loginInfo')
    }
    
    // 登录成功后的处理
    onLoginSuccess(data)
  }
  catch (error) {
    // 10003为验证码错误专属业务码
    if (error?.code === 10003) {
      // 为防止爆破，验证码错误则刷新验证码
      initCaptcha()
    }
    $message.destroy('login')
    console.error(error)
  }
  loading.value = false
}

/**
 * 登录成功后的处理函数
 * @param {Object} data - 登录成功返回的数据（包含token等信息）
 */
async function onLoginSuccess(data = {}) {
  // 将token等认证信息保存到状态管理中
  authStore.setToken(data)
  $message.loading('登录中...', { key: 'login' })
  
  try {
    $message.success('登录成功', { key: 'login' })
    
    // 处理登录后的页面跳转
    if (route.query.redirect) {
      // 如果有重定向参数，跳转到原来要访问的页面
      const path = route.query.redirect
      delete route.query.redirect
      router.push({ path, query: route.query })
    }
    else {
      // 否则跳转到首页
      router.push('/')
    }
  }
  catch (error) {
    console.error(error)
    $message.destroy('login')
  }
}
</script>
