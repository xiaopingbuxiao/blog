
# Vue.extend

## Vue.extend的使用
`Vue.extend`是挂载在`Vue`上面的一个方法，它直接返回一个子类，子类继承了`Vue`的功能。
官网对于  `Vue.extend`的介绍。
> 使用基础 Vue 构造器，创建一个“子类”。参数是一个包含组件选项的对象。
[具体的使用](https://cn.vuejs.org/v2/api/#Vue-extend)

## Vue.extend的源码
`Vue.extend`在具体代码在`core/global-api/extend.js`下面，如下：
```js
export function initExtend () {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    const Sub = function VueComponent (options) {
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
```
## Vue.extend的缓存
先来看下面这段代码：
```js
Vue.extend = function (extendOptions) {
  extendOptions = extendOptions || {}
  const Super = this
  const SuperId = Super.cid
  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }
  //...
  // cache constructor
  cachedCtors[SuperId] = Sub
  return Sub
}
```
首先是为了性能的考虑，进行了缓存的处理。反复调用`Vue.extend`其实会返回同一个函数。使用父类的`cid`作为缓存的`key`直接将结果缓存在传入对象的`_Ctor`上面。如下
```js
const obj = {
  template: '<h1>你好</h1>'
}
const sub1 = Vue.extend(obj)
const sub2 = Vue.extend(obj)
console.log(sub1 === sub2)  // true

```
之后如果是在开发环境会对传入`name`进行了验证处理。如果不符合命名规范或者使用了`Vue`的内置标签（如`slot,template`）或者使用了原生的标签名，会抛出对应的警告。
```js
const name = extendOptions.name || Super.options.name
if (process.env.NODE_ENV !== 'production' && name) {
  validateComponentName(name)
}
```
## Vue.extend继承的实现。

```js
//1、定义一个子类
const Sub = function VueComponent (options) {
  this._init(options)
}
//2、以父类的原型构造对象并指向子类的prototype
Sub.prototype = Object.create(Super.prototype)
//3、修正子类的constructor指向自己
Sub.prototype.constructor = Sub
//4、子类同样增加一个自增的cid
Sub.cid = cid++
//5、将父类的options和传入的extendOptions进行mergeOptions操作之后继承给子类
Sub.options = mergeOptions(
  Super.options,
  extendOptions
)
//6、子类上增加一个对父类的引用Sub.super 只有子类特有的属性
Sub['super'] = Super

// For props and computed properties, we define the proxy getters on
// the Vue instances at extension time, on the extended prototype. This
// avoids Object.defineProperty calls for each instance created.
//7、之后如果传入的props进行一个初始化操作
if (Sub.options.props) {
  initProps(Sub)
}
//8、对computed进行初始化操作
if (Sub.options.computed) {
  initComputed(Sub)
}

// allow further extension/mixin/plugin usage
Sub.extend = Super.extend
Sub.mixin = Super.mixin
Sub.use = Super.use

// create asset registers, so extended classes
// can have their private assets too.
ASSET_TYPES.forEach(function (type) {
  Sub[type] = Super[type]
})
// enable recursive self-lookup
if (name) {
  Sub.options.components[name] = Sub
}

// keep a reference to the super options at extension time.
// later at instantiation we can check if Super's options have
// been updated.
Sub.superOptions = Super.options
Sub.extendOptions = extendOptions
Sub.sealedOptions = extend({}, Sub.options)
```
如果对`JavaScript`的继承比较熟悉，上面的代码很容易理解。
```js
if (Sub.options.props) {
  initProps(Sub)
}
if (Sub.options.computed) {
  initComputed(Sub)
}
```
上面的第 6 和 7 步进行了初始化的操作。
```js
/* core/global/extend.js */
function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}
/* core/instance/state.js */
export function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```
`initprops`的操作其实就是将`props`中的属性获取进行了代理。如获取`vm.a`实际上是访问的`vm.__proto__._props.name`也就是`Sub.prototype._props.name`。

之后是进行`initComputed`操作,代码如下
```js
/* core/global/extend.js */
function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
/* core/instance/state.js */
export function defineComputed (
  target,
  key,
  userDef
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
```
其实就是循环遍历对用户的`computed`中的每一项就行一个定义。这里可以配合[vue中computed的实现](/vue/observer/computed的实现.html)查看。

接下来是对父类中的`extend、mixin、use、component、directive、filter`进行一个复制
```js
Sub.extend = Super.extend
Sub.mixin = Super.mixin
Sub.use = Super.use

// create asset registers, so extended classes
// can have their private assets too.
ASSET_TYPES.forEach(function (type) {
  Sub[type] = Super[type]
})
if (name) {
  Sub.options.components[name] = Sub
}
```
之后将自己注册到全局的`Sub.options.components`上。
```js
Sub.superOptions = Super.options
Sub.extendOptions = extendOptions
Sub.sealedOptions = extend({}, Sub.options)
```
之后就是在子类自身增加了`superOptions、extendOptions、sealedOptions`。

`Vue.extend`整体就是其实就是创建了一个`Vue`的子类，同时增加了自己一些子类才会有的属性。










