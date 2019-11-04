
# vue中computed的实现

## computed的使用
vue官方文档中对于computed的使用举例如下；
```javascript
var vm = new Vue({
  data: { a: 1 },
  computed: {
    // 仅读取
    aDouble: function () {
      return this.a * 2
    },
    // 读取和设置
    aPlus: {
      get: function () {
        return this.a + 1
      },
      set: function (v) {
        this.a = v - 1
      }
    }
  }
})
vm.aPlus   // => 2
vm.aPlus = 3
vm.a       // => 2
vm.aDouble // => 4
```
**计算属性最大的好处就是可以代替template中的表达式。** 如果我们在template中放入大量逻辑比较复杂的计算时，会是template中的逻辑过重。会对页面的可维护性造成很大的影响。computed实际的初衷就是为了结局这种问题。同时computed中有很多其他的优势，具体如下

**computed的优势**
* 减少template中的逻辑，增加页面可维护性
* computed的数据会被缓存
* computed的中的数据只有在使用时才会被调用执行计算


那么computed中的是如果实现的，已经是如何被缓存的呢？ 下面是我自己的理解。如果有不正确的地方，欢迎支持🙏。

## computed的初始化
如果你对于vue数据的响应式变化如果还不理解，可以看我的前两篇文章 [如何实现对对象变化的监听](https://xiaopingbuxiao.com/vue/object.html),[如何实现对数组变化的监听](https://xiaopingbuxiao.com/vue/array.html)。

言归正传，回到computed上面来，先来看computed数据的初始化：
```javascript
/* core/instance/state.js */
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    //调用initData 变为响应式
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  //如果有computed 触发computed数据处理
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
在上面的源码中看到，Vue 在 initState 时触发了 initComputed 进行对 computed 数据处理，再来看 initComputed 函数。
```javascript
const computedWatcherOptions = { lazy: true }
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()
  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }
    //  vm._computedWatchers 上面存放了所有的computed的watcher  将用户computed的每一个属性进行一个观察者的实例化
    // 分别传入 vm实例  getter函数 以及一个空函数 和options常量 { lazy: true } / {computed:true}
    if (!isSSR) {
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }
    /**
     * 如果是已经定义在props中或者data中的数据 开发环境进行提醒
     * 如果是正常数据  就进行一个 defineComputed 的操作
     * 所以整个流程调用了之后就做到了 当computed中的值被使用的时候才会去触发获取值的操作 
     * 同时将 dirty置为false
     */
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```
上面的代码逻辑并不复杂，可以看到，通过 initComputed 函数之后。进行了一个遍历操作，遍历的过程中如果computed中key 已经在props 或者data中定义过，在开发环境下就进行一个提醒。否则的话就进行 defineComputed 的操作。

**注意：vm._computedWatchers 上面收集了所有的computed 中数据的 watcher。并且此时的 watcher 接受的最后一个参数为 { lazy: true }**
再来看一下 Watcher 类

```javascript

export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 如果是computed的数据  进行惰性求值 先不进行调用 
    this.value = this.lazy
      ? undefined
      : this.get()
  }
  update () {
    /* istanbul ignore else */
    /**
     * 如果是 lazy是computed的时候传入的值 同时 lazy 第一次也是取得lazy的值
     * 获取了computed中key的value之后  会将dirty的值置为false 证明已经进行一个获取值的操作
     * 此后将dirty重新置为true 开关作用
     */ 
    if (this.lazy) {  
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }
}
```
无用的代码已经删掉，现在只关心 computed的逻辑。**如果是computed的值，是没有在 constructor 中进行一个求值的过程的。只是置为了 undefined。**

再来看defineComputed 的作用。
```javascript
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache  //只分析不是服务端渲染    设置key的get
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    /**
     * 下面的三目运算 
     */
    // if(userDef.get){
    //   if(shouldCache && userDef.cache!==false){
    //    sharedPropertyDefinition.get = createComputedGetter(key)
    //   }else{
    //     createGetterInvoker(userDef.get)
    //   }
    // }else{
    //   sharedPropertyDefinition.get = noop
    // }
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {  
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}
```
注意，此时 createComputedGetter 返回的是一个函数，将这个函数设置为了 computed 中每一个属性key 的get。


## computed是如何实现缓存的
第一次获取computed中的属性是 watcher.dirty 为true。因此调用了 watcher.evaluate() 函数。
```javascript
evaluate () {
  this.value = this.get()
  this.dirty = false
}
```
此时才会进行一次求值的操作。这也就是 为什么 **computed的中的数据只有在使用时才会被调用执行计算**。
上面的代码中同时执行了 this.dirty = false。

回到最初的起点，computed的使用
```javascript
computed: {
  // 仅读取
  aDouble: function () {
    return this.a * 2
  }
}
```
aDouble 中使用到了 a 这个数据，因此a的 dep中会收集到 aDouble 这个watcher 的。因此当数据a 发生变化时，通知 watcher 进行 update的操作将 **this.dirty = true** 。下次获取computed的值的时候才会进行一个计算。如果 a 的值一直没有变化。那么 aDouble 这个watcher中的dirty 一直为false，永远不会触发 watcher.evaluate() 函数。**这就是我们所说的computed的数据会被缓存**

看到这里，如果再碰到面试官问你 computed中的数据是如何实现缓存的 或者 computed和watcher的区别时，我想你已经知道该怎么吹牛皮了～

以上只是属于我个人的理解整理，如果有不正确的地方，欢迎指出，谢谢🙏

<Gitalk></Gitalk>








