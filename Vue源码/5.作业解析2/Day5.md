# 知识点

* 实现数组的响应式

  * 找到数组的原型
  * 覆盖那些能够修改数组的更新方法，使其可以通知更新
  * 将得到的新的原型设置到数组实例原型上

  ```js
  // 数组响应式
  // 1.替换数组原型中的7个方法
     const orginalProto = Array.proto
     // 备份一份，修改备份
     const arrayProto = Object.create(orginalProto)
     ['push','pop','shift','unshift'].forEach(method => {
       arrayProto[method] = function(){
         // 原始操作
         orginalProto[method].apply(this,arguments)
         // 覆盖操作，通知更新
         console.log（'数组执行',+method）
       }
     })
  ```

  ```js
  function observe(obj){
    // 判断传入obj类型
    if(Array.isArray(value)){
      //覆盖原型，替换7个变更操作
      obj._protp_=arrayProto
      // 对数组内部元素执行响应化
      const keys = object.keys(obj)
      for(let i =0;i<obj.length;i++){
        observe(obj[i])
      }
    }else{
      Object.keys(obj).forEach(key => {
        defineReactive(obj,key,obj[key])
      })
    }
  }
  ```

* 完成k-model  @xxx

  * @xx

    ```html
    <p @click="onClick">{{counter}}</p>
    <script>
      methods:{
        onClick(){
          this.counter++
        }
      }
    </script>
    ```

    ```js
    complie.js
    class Compile{
      //事件处理
      // @click
      if(this.isEvnet(attrName))
      // @click="onClick"
      const dir = attrName.substring(1)//click
      // 事件监听
      // exp onClick
      this.eventHandler(node,exp,dir)
    }
    isEvent(dir){
      //开头是@就返回true
      return dir.indexOf('@')==0
    }
    eventHandler(node,exp,dir){
      // method:{onClick:function(){}}
      const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp]
      node.addEvnetListener(dir,fn.bind(this.$vm))
    }
    ```

  * K-model:双向数据绑定，语法糖，value设定，事件监听

    ```js
    class Compile{
      // k-mode='xxx'
      model(node,exp){
        // update方法只完成赋值和更新
        this.update(node,exp,'model')
        // 事件监听
        // 更新vue中的value
        node.addEventlistener('input',e => {
          // 新的值赋值给数据即可
          this.$vm[exp]=e.target.value
        })
      }
      modelUpdater(node,value){
        // 更新视图中value
        node.value = value
      }
    }
    ```

    

