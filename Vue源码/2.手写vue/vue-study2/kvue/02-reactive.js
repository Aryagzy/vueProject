// 定义响应式数据

import { apply } from "core-js/fn/reflect";
import { onUpdated } from "vue";

// Vue.util.defineReactive(this,'current','/')
function defineReactive(obj,key,val){
    // 属性拦截
    Object.defineProperty(obj,key,{
        get(){
            console.log('get');
            return val
        },
        set(newVal){
            if(newVal !== val){
                console.log('set');
                val = newVal
                update()
                
            }
        }
    })
}
// 响应式处理
defineReactive(obj,'foo',' ') //get
obj.foo = new Date().toLocaleTimeString()//set

// 更新函数 描述了视图内容
// 1.更新函数不应该是自己写的，编译器将模版转换出来的
// 2.全量更新：更新函数能够精确定位具体dom元素，或者利用vdom，对比得到dom操作
function update(){ //更新到视图层
    app.innerText = obj.foo
}
setInterval(()=>{
    obj.foo = new Date().toLocaleTimeString() // set
},1000)