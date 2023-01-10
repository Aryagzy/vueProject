### Vue3项目实战
#### 一、项目创建
```cmd
vue create project #选择vue3项目
```
#### 二、项目搭建
```cmd
cnpm i element-plus axios less@3 less-loader@7 vue-router@4 font-awesome echarts@4  -S
```
#### 三、项目配置
```js
// vue.config.js
module.exports = {
    devServer: {
        open: true // 自动打开浏览器
    }
}
```
```js
// router/index.js
// import { createRouter, createWebHashHistory } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    }
]
const router = createRouter({
    // history: createWebHashHistory(),
    history: createWebHistory(),
    routes
})

export default router
```
```js
// main.js
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import locale from 'element-plus/es/locale/lang/zh-cn'
import axios from 'axios'
import router from './router'

// createApp(App).use(ElementPlus, {local}).mount('#app')
const app = createApp(App)
app.config.globalProperties.$http = axios
app.use(router).use(ElementPlus, {locale}).mount('#app')
```
在App.vue页面给路由出口,在Home页面使用router-link to进行路由跳转

把reset.css文件复制过来,在App.vue引入
```css
@import url('./assets/reset.css');
html,body {
  width: 100%;
  height: 100%;
}
#app {
  width: 100%;
  height: 100%;
}
```

#### 四、登录页功能实现
首先把原先Vue2项目中的登录页复制过来,然后配置对应的路由,封装axios,直接复制之前的文件过来即可。把service、utils、assets、common、vue.config.js复制过来即可。





