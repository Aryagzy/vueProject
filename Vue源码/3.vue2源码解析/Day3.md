# Vue源码剖析

## 目标

* 环境搭建
* 掌握源码的学习方法
* vue初始化过程解析
* 深入理解响应式数据

## 知识点

### 获取vue

`git clone https://github.com/vuejs/vue.git`

### 文件结构

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220134828048.png" alt="image-20221220134828048" style="zoom:50%;" />

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220134853248.png" alt="image-20221220134853248" style="zoom:50%;" />

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220134932646.png" alt="image-20221220134932646" style="zoom:50%;" />

### 调试环境搭建

* 安装依赖 `npm i`

* 安装rollup `npm i -g rollup`

* 修改dev版本，添加--sourcemap 

  ```js
  package.json
  "dev": "rollup -w -c scripts/config.js --sourcemap --environment TARGET:full-dev"
  ```

* `npm run dev`

### 术语解释

* Runtime:仅包含运行时，不包含编译器
* common：cjs规范，用于webpack1 用于服务端
* esm：ES模块，用于webpack2+
* umd：universal module definition ,兼容cjs和and,用于浏览器

### 入口

dev脚本中`-c scripts/config.js`指明配置文件所在位置

参数`TARGET:full-dev"`知名输出文件的配置项

`config.js`

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220140736434.png" alt="image-20221220140736434" style="zoom:50%;" />

`alias.js`

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220140927714.png" alt="image-20221220140927714" style="zoom:50%;" />

#### 补充

```js
// 创建实例
<script>
  // render > template >el
  // 有render执行render，没有render执行templage 没有template执行el
  const app = new Vue({
    el:'#demo',
    template:'<div>template</div>'
    render(h){
     return h('render')
    }
   data:{
     foo:'foo'
   }
  })
</script>
```

### 关联文件

`entry-runtime-with-compiler.js`

1. 打包的入口文件
2. 处理template或者el选项，处理编译这件事

`src/platforms/web/runtime/index.ts`

1. 安装patch函数（更新函数）：vdom->dom

   ```js
   // 1.安装补丁函数patch（更新函数）：vdom->dom
   Vue.prototype.__patch__ = inBrowser ? patch : noop
   ```

2. 实现$mount:  vdom->dom =>append 虚拟dom变成真dom追加到宿主对象上

   **问题：$mount做了什么？**

   **答案：生成dom挂载到宿主对象上**

   ```js
   // public mount method
   //2.实现$mount方法，调用mountComponent
   Vue.prototype.$mount = function (
     el?: string | Element,
     hydrating?: boolean
   ): Component {
     el = el && inBrowser ? query(el) : undefined
     return mountComponent(this, el, hydrating)
   }
   ```

`src/core/index.js`

* 初始化全局API

  ```js
  //1.初始化全局静态API： Vue.set/delete/component/use/...
  initGlobalAPI(Vue)
  ```

`src/core/instane/index.js`

1. 构造函数声明

   ```js
   //构造函数声明
   function Vue(options) {
     if (__DEV__ && !(this instanceof Vue)) {
       warn('Vue is a constructor and should be called with the `new` keyword')
     }
     // 初始化
     this._init(options)
   }
   ```

2. 各种实例属性和方法的声明

   ```js
   // 初始化实例方法和属性
   //@ts-expect-error Vue has function type
   initMixin(Vue)
   //@ts-expect-error Vue has function type
   stateMixin(Vue)
   //@ts-expect-error Vue has function type
   eventsMixin(Vue)
   //@ts-expect-error Vue has function type
   lifecycleMixin(Vue)
   //@ts-expect-error Vue has function type
   renderMixin(Vue)
   ```

`src/core/instance/init.js`

**问题：new Vue都做了哪些事情？**

**答案：初始化的目的是为了得到根实例，接下来会执行挂载，挂载的内部会执行render函数，执行render函数会得到一个虚拟dom，patch转Vnode成真实dom，append追加到真正的宿主元素#demo中去**

1. 选项合并：用户选项和系统默认选项需要合并

      ```js
      // merge option
      // 1.选项合并：用户选项和系统默认选项需要合并
          if (options && options._isComponent) {
            // optimize internal component instantiation
            // since dynamic options merging is pretty slow, and none of the
            // internal component options needs special treatment.
            initInternalComponent(vm, options as any)
          } else {
            vm.$options = mergeOptions(
              resolveConstructorOptions(vm.constructor as any),
              options || {},
              vm
            )
          }
      ```

  2.初始化

```js
  // 2.初始化
    vm._self = vm
    initLifecycle(vm) // 生命周期相关的属性初始化$parent
    initEvents(vm) // 自定义组件事件监听
    initRender(vm) // 插槽处理，$createElm === render(h)
    // 调用生命周期的钩子函数
    callHook(vm, 'beforeCreate', undefined, false /* setContext */)
    // provide/inject--隔代传参
    // 组件数据和状态初始化
    initInjections(vm) // resolve injections before data/props
    initState(vm)// data props methods computed watch
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
```

3.设置了el选项组件，会自动挂载

```js
//设置了el选项组件，会自动挂载
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
  }
```

上面这段代码解释了为什么不用`.$mount('#app')`也可以挂载，在new Vue中有el

```js
<script>
  // 问题：？
**初始化 =》 根实例 =〉挂载 =》执行render =〉vdom =》patch(vdom) =>dom =〉 append(挂载到宿主对象上)**
  const app = new Vue({
    el:'#demo',
   data:{
     foo:'foo'
   }
  })
</script>
```

`src/core/instane/lifecycle.js`

### 数据响应式

数据响应式是MVVM框架一大特点，通过某种策略可以感知数据的变化，Vue中利用js语言特性Object.defineProperty(),通过定义对象属性getter/setter拦截对象属性的访问

具体实现是在Vue初始化时，会调用initState,他会初始化data，props等，

`src/core/instance/init.js`

```js
initState(vm)// data props methods computed watch
```

```js
 // observe data
  // 遍历响应式处理 
  const ob = observe(data)
```

`src/core/observer/index.js`

```js
export function observe(
  value: any,
  shallow?: boolean,
  ssrMockReactivity?: boolean
  // Observer作用？ ob===Observer实例
  // 1.将传入的vlaue做响应式处理
): Observer | void {
  // 如果已经做过响应式处理，则直接返回ob
  if (value && hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    return value.__ob__
  }
  if (
    shouldObserve &&
    (ssrMockReactivity || !isServerRendering()) &&
    (isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value.__v_skip /* ReactiveFlags.SKIP */ &&
    !isRef(value) &&
    !(value instanceof VNode)
  ) {
    // 初始化传入需要响应式的对象
    return new Observer(value, shallow, ssrMockReactivity)
  }
}
```

`Observer类`

```js
export class Observer {
  dep: Dep
  vmCount: number // number of vms that have this object as root $data

  constructor(public value: any, public shallow = false, public mock = false) {
    // this.value = value
    // 2，此处dep？ 使用Vue.set/delete添加或者删除属性，负责通知更新
    // 动态的set/delete属性的时候，defineReactive是没有办法通知更新的
    // 这时就用到了obsrver里面的dep。负责通知更新
    this.dep = mock ? mockDep : new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    // 1.分辨传入对象类型，是数组还是对象
    if (isArray(value)) {
      if (!mock) {
        if (hasProto) {
          /* eslint-disable no-proto */
          ;(value as any).__proto__ = arrayMethods
          /* eslint-enable no-proto */
        } else {
          for (let i = 0, l = arrayKeys.length; i < l; i++) {
            const key = arrayKeys[i]
            def(value, key, arrayMethods[key])
          }
        }
      }
      if (!shallow) {
        this.observeArray(value)
      }
    } else {
      /**
       * Walk through all properties and convert them into
       * getter/setters. This method should only be called when
       * value type is Object.
       */
      const keys = Object.keys(value)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        defineReactive(value, key, NO_INITIAL_VALUE, undefined, shallow, mock)
      }
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray(value: any[]) {
    for (let i = 0, l = value.length; i < l; i++) {
      observe(value[i], false, this.mock)
    }
  }
}
```

`defineReactive类`

```js
export function defineReactive(
  obj: object,
  key: string,
  val?: any,
  customSetter?: Function | null,
  shallow?: boolean,
  mock?: boolean
) {
  // 创建Kep一一对应的Dep
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if (
    (!getter || setter) &&
    (val === NO_INITIAL_VALUE || arguments.length === 2)
  ) {
    val = obj[key]
  }
  
  //递归遍历
  let childOb = !shallow && observe(val, false, mock)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
     // 如果存在说明此次调用触发者是一个watcher实例
      if (Dep.target) {
        if (__DEV__) {
          dep.depend({
            target: obj,
            type: TrackOpTypes.GET,
            key
          })
        } else {
          //建立dep和Dep.target(watcher)之间的依赖关系
          dep.depend()
        }
        if (childOb) {
          // 建立ob内部dep和Dep.target（watcher）之间的依赖关系
          // 监听Vue.set/delete这种添加或者删除 defineReactive无法监听
          childOb.dep.depend()
          if (isArray(value)) {
            // 如果是数组，数组内部所有项都要做相同处理
            dependArray(value)
          }
        }
      }
      return isRef(value) && !shallow ? value.value : value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      if (!hasChanged(value, newVal)) {
        return
      }
      if (__DEV__ && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else if (getter) {
        // #7981: for accessor properties without setter
        return
      } else if (!shallow && isRef(value) && !isRef(newVal)) {
        value.value = newVal
        return
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal, false, mock)
      if (__DEV__) {
        dep.notify({
          type: TriggerOpTypes.SET,
          target: obj,
          key,
          newValue: newVal,
          oldValue: value
        })
      } else {
        dep.notify()
      }
    }
  })

  return dep
}
```

`src/core/observer/watcher.js`

```js
 addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      // watcher添加他和dep关系
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        // 反过来，dep添加和watcher关系
        dep.addSub(this)
      }
    }
  }
```

**Dep:Watcher=n:n**

```js
<script>
  const app = new Vue({
    el:'#app',
    data:{
      foo:'foo',
      bar:'bar'
    }
  })
</script>
```

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221221124749306.png" alt="image-20221221124749306" style="zoom:50%;" />

**Observer  Dep Watcher之间的关系**

![image-20221221124857436](/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221221124857436.png)

```js
<script>
  // 创建实例
  // 会有几个Observer? Dep? Watcher?
  // 
  const app = new Vue({
    el:'#app',
    data:{//ob+dep
      obj:{//ob + dep  // key:dep
        foo:'foo'   // key:dep
      }
    },
    mounted(){
      setTimeout(()=>{
        this.obj={ //重新给对象赋值了
          bar:'bar'
        }
        this.obj.foo = 'foooo' // 调用就是ob+dep
        this.$set(this.obj,'bar','bar')
      },1000)
    }
  })
</script>
```

