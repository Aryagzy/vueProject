# Vue全家桶原理

## vue-router

安装: `vue add router`

核心步骤:

1.使用vue-router插件，router.js 

```js
import Router from 'vue-router'
Vue.use(Router)
```

2.创建Router实例，router.js

```js
export default new Router({})
```

3.在根组件上面添加该实例 main.js

```js
import router from './router'
new Vue({
  router
}).$mount('#app')
```

4.添加路由视图 App.vue 

```html
<router-view> </router-view>
```

5.导航

```html
<router-link to="/">Home</router-link>
<router-link to="/about">About</router-link>
```

```js
this.$router.push('/')
this.$router.push('/about')
```

### vue-router源码实现

单页面应用程序中，url发生变化时候，不能刷新，显示对应视图内容

#### 需求分析

- span页面不能刷新  
  1. Hash #about
  2. History api /about
- 根据url显示对应的内容
  1. router-view
  2. 数据响应式：current变量持有URL地址，一旦变化，动态重新执行render

#### 任务

实现一个插件

* 实现VueRouter类
  1. 处理路由选择
  2. 监控URL变化，hashchange
  3. 相应这个变化 
* 实现install方法
  1. $router注册   beforeCreate时创建一次
  2. 两个全局组件  router-link router-view

## Vuex

Vuex**集中式**存储管理应用所有组件的状态，并且以相应的规则保证状态以**可预测**的方式发生变化

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221218134758395.png" alt="image-20221218134758395" style="zoom:50%;" />

### 核心概念

* state状态，数据
* mutations更改状态的函数
* actions异步操作
* store 包含以上概念的容器
* commit dispatch

