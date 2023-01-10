# 学习目标

* 理解vue批量异步更新策略
* 掌握虚拟DOM和Diff算法

## 异步更新队列

vue高效的秘诀就是一套批量异步更新策略

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221222131112552.png" alt="image-20221222131112552" style="zoom:50%;" />

1. 事件循环EventLoop: 浏览器为了协调事件处理，脚本执行，网络请求和渲染任务而制定的工作机制
2. 宏任务Task: 代表一个个离散的，独立的工作单元，**浏览器完成一个宏任务，会在下一个宏任务执行开始之前，会对页面进行重新渲染**，主要包括创建文档，解析html，执行主线js 代码，以及各种事件如页面加载，输入，网络事件和定时器等
3. 微任务：微任务是更小的任务，是在当前宏任务执行结束后立刻执行的任务，如果存在微任务，浏览器会清空微任务以后再重新渲染，微任务的例子有Promise回调函数，DOM变化等

```js
console.log('script start')
setTimeout(function(){
  console.log('setTimeout')
},0)
Promise.resolve().then(function(){
                       console.log('promise1')
                       }).then(function(){
                        console.log('promise2')
                       })
console.log('scropt end')

//输出的结果，宏任务 微任务
script start
script end
promise1
promise2
setTimeout
```

## vue中具体实现

<img src="/Users/guozhenyi/Library/Application Support/typora-user-images/image-20221222132602255.png" alt="image-20221222132602255" style="zoom:50%;" />

* 异步：只要侦听到数据变化，Vue将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更
* 批量：如果对于同一个watcher被多次触发，只会被推入到队列中一次，去重对于避免不必要的计算和DOM操作是非常重要的，然后，在下一个的事件循环"tick"中，Vue刷新队列执行实际工作
* 异步策略：vue在内部对异步队列尝试使用原生`promise.then`和`mutationObserver`或`set immediate`,如果环境都不支持，会采用`setTimeourt`代替

`src/core/observer/index.js`

Set

dep.notify() //变更通知

`src/core/observer/watcher.js`

Watcher.update()

```js
update() {
    /* istanbul ignore else */
    // computed
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      // 正常情况走这里
      // watcher入队
      queueWatcher(this)
    }
  }
```

`src/core/observer/scheduler.js`

queueWatcher(this)

```js
// 尝试将watcher实例入队
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id
  // 去重
  if (has[id] != null) {
    return
  }

  if (watcher === Dep.target && watcher.noRecurse) {
    return
  }

  has[id] = true
  if (!flushing) {
    // 入队
    queue.push(watcher)
  } else {
    // if already flushing, splice the watcher based on its id
    // if already past its id, it will be run next immediately.
    let i = queue.length - 1
    while (i > index && queue[i].id > watcher.id) {
      i--
    }
    queue.splice(i + 1, 0, watcher)
  }
  // queue the flush
  if (!waiting) {
    waiting = true

    if (__DEV__ && !config.async) {
      flushSchedulerQueue()
      return
    }
    //异步起动队列冲刷任务
    // 此处的nextTick就是我们平时使用的那个
    // 启动一个异步任务，在未来的某个时刻执行flushSchedulerQueue
    nextTick(flushSchedulerQueue)
  }
}
```

`src/core/util/next-tick.js`

nextTick(flushSchedulerQueue)