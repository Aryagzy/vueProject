import { forEach } from "core-js/core/array";
import { options } from "less";
import { compile } from "vue/types/umd";

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
// 遍历传入obj的所有属性，执行响应式操作
function observe(obj){
    // 递归obj里面的对象属性
    // 判断obj是不是对象
    if(typeof obj !== 'object' || obj == null){
        return obj
    }
    Object.keys(obj).forEach(key => defineReactive(obj,key,obj[key]))
}
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

class KVue {
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

// 遍历模版树，解析其中的动态部分，初始化并获取更新函数
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