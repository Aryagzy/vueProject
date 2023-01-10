## Vue中的数据响应式

![image-20221219093356596](/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221219093356596.png)

MVVM框架的三要素：数据响应式  模版引擎 渲染

数据响应式：监听数据变化并在视图中更新

* Object.defineProperty()

    ```js
    function defineReactive(obj,key,val){
        //递归
        observe(val)
    
        // 只要调用一次defineReactive就会有一个Dep
        const dep = new Dep()
    
        // 属性拦截
        Object.defineProperty(obj,key,{
            get(){
                console.log('get');
                // 依赖收集
                // 向deps中添加wwatcher实例
                Dep.target && dep.addDep(Dep.target)
                return val
            },
            set(newVal){
                if(newVal !== val){
                    console.log('set');
                    //对赋值是对象处理
                    observe(newVal)
                    val = newVal
    
                    // 通知更新
                    // 数据修改时
                    dep.notify()
                }
            }
        })
    }
    ```

* Proxy

  ```js
  function proxy(vm){
      // 把vm.$data中的内容代理到vm上去
      Object.keys(vm.$data).forEach((key)=>[
          Object.defineProperty(vm,key,{
              get(){
                  return vm.$data[key]
              },
              set(v){
                  vm.$data[key] = v;
              }
          })
      ])
  }
  ```

模版引擎：提供描述视图的模版语法

* 插值 {{}}
* 指令 v-bind v-on  v-model v-for v-if

渲染：如何将模版转换为html

* 模版 => Odom => dom

### 数据响应式原理

数据变更能够响应在视图中，就是数据响应式，vue2中利用Object.defineProperty()实现变更检测

![image-20221219094608602](/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221219094608602.png)

## 编译Compile

编译模版中vue模版特殊语法，初始化视图，更新视图

![image-20221219162751262](/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221219162751262.png)

#### 分析

1. `new Vue` 首先执行初始化，对**data执行响应化处理** ，这个过程发生在Observer中
2. 同时对模版执行编译，找到其中动态绑定的数据，从data中获取，并且初始化视图，这个过程发生在Compile中
3. 同时定义一个更新函数和watcher，将来对应数据变化时watcher会调用更新函数
4. 由于data的某个Key在一个视图中可能出现多次，所以每一个Key都需要一个管家Dep来管理多个watcher
5. 将来data中数据一旦发生变化，首先会找到对应的Dep，通知所有的watcher执行更新函数

#### 涉及类型及介绍

* KVue：框架构造函数

  ```js
  lass KVue {
      constructor(){
          // 0.保存选型
          this.$options = options
          this.$data = options.data 
  
          // 1.响应式：递归遍历data中的对象，做响应式处理
          observe(this.$data)
  
          //1.5代理
          proxy(this)
          // 2。编译模版
          // 两个参数 #app 和 new KVue
          new compile(options.el,this)
      }
  }
  ```

* Observer：执行数据响应化，分辨数据是对象还是数组

  ```js
  // 遍历传入obj的所有属性，执行响应式操作
  function observe(obj){
      // 递归obj里面的对象属性
      // 判断obj是不是对象
      if(typeof obj !== 'object' || obj == null){
          return obj
      }
      Object.keys(obj).forEach(key => defineReactive(obj,key,obj[key]))
  }
  ```

* Compile：编译模版，初始化视图，收集依赖(更新函数，watcher创建)

  ```js
  / 遍历模版树，解析其中的动态部分，初始化并获取更新函数
  // 动态部分指的就是 {{}} v-bing 指令
  class Compile{
      constructor(el,vm){
          // 保存实例
          this.$vm = vm
          // 获取宿主dom
          const dom = document.querySelector(el)
  
          // 编译他
          this.compile(dom)
      }
      compile(el){
          // 遍历el
          const childNodes = el.childNodes
          childNodes.forEach(node =>{
              // 循环每一个node,判断是元素还是插值绑定的表达式
              if(this.isElement(node)){
                  // 元素：解析动态的指令 属性绑定 事件
                  // console.log('编译元素'+node.nodeName);
                  const attrs = node.attributes
                  Array.from(attrs).forEach(attr => {
                      // 判断是否是一个动态属性
                      // 例如1.指令k-xxx="counter"
                      const attrName = attr.name 
                      const exp = attr.value
                      if(this.isDir(atttrName)){
                          const dir = attrName.substring(2)
                          // 看看是否是合法指令，如果是则执行处理函数
                          this[dir] && this[dir](node,exp)
                      }
                  })
  
                  //递归 
                  //元素中可能嵌套着元素或者插值
                  if(node.childNodes.length > 0){
                      this.compile(node);
                  }
  
                 } else if(this.isInter(node)){
                  //插值绑定表达式
                  // console.log("编译插值"+node.textContent);
                  this.compileText(node)            }
          })
      }
      // 处理所有动态绑定
      // dir指的就是指令名称
      update(node,exp,dir){
          // 1.初始化
          const fn = this[dir + 'Updater']
          fn && fn(node,this.$vm[exp])
          // 2.创建watcher实例，负责后续的更新
          new Watcher(this.$vm,exp,function(val){
              fn && fn(node,val)
          })
      }
  
      // k-text text是函数形式
      text(node,exp){
          // node中的值是 vm中exp的值
          //node.textContent = this.$vm[exp]
  
          this.update(node,exp,'text')
      }
      textUpdater(node,val){
          node.textContent = val
      }
  
      //k-html
      html(node,exp){
         // node.innerHTML = this.$vm[exp]
         this.update(node,exp,'html')
      }
      htmlUpdater(node,val){
          node.innerHTML = val
      }
  
      // 解析插值表达式中文本内容 {{}}
      compileText(node){
          this.update(node,RegExp.$1,'text') //textUpdater
          // 获取插值表达式的内容
          //node.textContent = this.$vm[RegExp.$1]
      }
  
      isElement(node){
          return node.nodeType === 1
      }
  
     //  {{xxxxx}}
      isInter(node){
          // 返回插值表达式和插值表达式里面的内容
          return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
      }
  
      isDir(attrName){
          return attrName.startsWith('k-')
      }
  }
  
  
  /** new Dep()
       收集依赖 
       Dep中notify更新是在defineReactive中进行的
   */
  function defineReactive(obj,key,val){
      //递归
      observe(val)
  
      // 只要调用一次defineReactive就会有一个Dep
      const dep = new Dep()
  
      // 属性拦截
      Object.defineProperty(obj,key,{
          get(){
              console.log('get');
              // 依赖收集
              // 向deps中添加wwatcher实例
              Dep.target && dep.addDep(Dep.target)
              return val
          },
          set(newVal){
              if(newVal !== val){
                  console.log('set');
                  //对赋值是对象处理
                  observe(newVal)
                  val = newVal
  
                  // 通知更新
                  // 数据修改时
                  dep.notify()
              }
          }
      })
  }
  ```

* watcher：执行更新函数（更新dom）

  ```js
  // 负责具体节点更新
  class Watcher{
      constructor(vm,key,updater){
          this.vm = vm
          this.key = key
          this.updater = updater
  
          // 读当前值，触发依赖收集
          Dep.target = this // Dep.target = new Watcher
          this.vm[this.key]  // get
          Dep.target = null
  
      }
      // Dep将来会调用upadat
      update(){
          const val = this.vm[this.key]
          this.updater.call(this.vm,val)
  
      }
  }
  ```

* Dep：管理多个watcher，批量更新

  ```js
  // Dep和具体响应式属性key之间有一一对应关系
  // 负责通知watcher更新
  class Dep{
      constructor(){
          this.deps=[]
      }
      addDep(dep){
          this.deps.push(dep)
      }
      notify(){
          this,deps,forEach(dep => dep.update())
      }
  }
  ```

### 依赖收集

视图中会用到data中某key，这称为依赖，同一个key可能出现多次，每次都需要收集出来用一个watcher来维护他们，此过程称为依赖收集

多个watcher需要一个Dep来管理，需要更新时由Dep统一通知

#### 案例

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221220095832458.png" alt="image-20221220095832458" style="zoom:50%;" />

#### 实现思路

1. defineReactive时为每一个key创建一个Dep实例
2. 初始化视图时读取某个key，例如name1，创建一个watcher
3. 由于触发name1的getter方法，便将watcher1添加到name1的Dep中
4. 当name1更新时，setter触发，便可以通知对应Dep通知其管理所有watcher更新

