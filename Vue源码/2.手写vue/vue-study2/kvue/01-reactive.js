// 定义响应式数据

// Vue.util.defineReactive(this,'current','/')
function defineReactive(obj,key,val){
    //递归
    observe(val)

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
// 动态新增一个属性
// Vue.set(obj,key,val)
function set(obj,key,val){
    defineReactive(obj,key,val)
}

// 用户不能手动设置所有属性，递归响应式处理
const obj ={
    foo:'foo',
    bar:'bar',
    baz:{
        a:1
    }
}
observe(obj)
obj.foo //get
obj.foo = 'hhhh' //set

// 没有办法检测到
//obj.dong = 'dong' 
set (obj,'dong',dong)
obj.dong

// 我们没有对赋值操作是对象做处理
obj.baz = {
    a:10
}


// 2.数组 支持不了
// 解决方案是：要拦截数组的7个变更方法。覆盖他们，让他们做数组操作的同时。进行变更通知
