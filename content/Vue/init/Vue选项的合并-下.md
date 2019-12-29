# Vue选项的合并-上
经过上面的步骤，`Vue`的选项都已经进行了一定格式的规范话，之后就进入真正的合并操作。
```js
const options = {}
let key
for (key in parent) {
  mergeField(key)
}
for (key in child) {
  if (!hasOwn(parent, key)) {
    mergeField(key)
  }
}
function mergeField(key) {
  const strat = strats[key] || defaultStrat  // 
  options[key] = strat(parent[key], child[key], vm, key)
}
return options
```
上面已经说过，此时`parent`的参数如下
```js
Vue.options = {
  components: {
		KeepAlive
		Transition,
    	TransitionGroup
	},
	directives:{
	    model,
        show
	},
	filters: Object.create(null),
	_base: Vue
}
```
而`child`的值是我们传递进来的对象。上面先是遍历`parent`调用对应的策略函数。之后遍历`child`同样调用策略函数，只是在遍历`child`的时候增加了一层判断，`parent`上面是否存在，如果存在的话，上一个遍历已经执行过了，就不需要执行了。

此处出现了两个新的变量 `defaultStrat` 和 `strats` 。 `defaultStrat`的定义是在当前文件`core/util/options.js`下。
```js
const defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
}
```
上面的默认合并策略比较简单，子组件上存在就使用子组件，子组件不存在就使用父组件。
而 `strats` 的定义一开始是在 `core/config.js` 下面，为 `Object.create(null)`。但是在当前的文件`core/util/options.js`下面进行了赋值的操作。首先是对`el、propsData`赋值合并策略。

## el和propsData的合并策略
```js
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}
```
在开发环境下如果没有传递 `vm`的话抛出一个警告信息。即 `el、propsData`选项只能在通过 `new`关键字创建的实例上使用。同时使用默认的合并策略。这里我们知道`vm`就是当前`Vue`的实例。之后作为了`mergeOptions`的第三个参数传递下来的。

而我们已经看了[Vue.extend继承的实现](/Vue/init/extend.html#vue-extend继承的实现)。在**第5步**的操作中调用`mergeOptions`时只传入两个参数。
```js
Sub.options = mergeOptions(
  Super.options,
  extendOptions
)
```
所以此处也就是说只用通过`Vue.extend`生成的子类的时候，选项的合并操作是拿不到`vm`的。就是说`Vue.extend`时传入`el、el、propsData`是会报错的。

## data的合并策略
```js
strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )
      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }
  return mergeDataOrFn(parentVal, childVal, vm)
}
```
如果在函数存在 `vm` 直接使用 `mergeDataOrFn` 。在开发环境中，存在 `vm`但是  `childVal` 不是一个函数的时候就抛出警告同时返回`parentVal`，存在 `vm`同时`childVal`是一个函数时，返回`mergeDataOrFn`执行结果。也就是是`data`的合并都是调用的`mergeDataOrFn`函数，只是传入的参数不一样(后者少传入一个`vm`)。来看`mergeDataOrFn`的代码如下：

```js
export function mergeDataOrFn(
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    return function mergedDataFn() {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn() {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}
```
这个函数整体分为两部分，是否存在 `vm`。如果不存在`vm`。看是否存在 `childVal` 不存在 `childVal`就返回`parentVal`。如果存在`childVal`但是不存在`parentVal`就返回`childVal`。如果`childVal、parentVal`都存在就返回一个函数 `mergedDataFn`。返回的函数调用时会执行 `mergeData`函数作为返回值。

上面的函数整体分为两部分：
* 不存在`vm`，即通过`Vue.extend`生成的组件
  * 子组件不存在`data`，返回合并的父组件的`data`
  * 子组件存在`data`，父组件不存在`data`，返回子组件的`data`
  * 父子组件都存在`data`，返回函数`mergedDataFn`。执行后返回的值为`mergeData`的值
* 存在`vm`，直接返回`mergedInstanceDataFn`函数。`mergedInstanceDataFn`的代码如下
  ```js
  const instanceData = typeof childVal === 'function'
    ? childVal.call(vm, vm)
    : childVal
  const defaultData = typeof parentVal === 'function'
    ? parentVal.call(vm, vm)
    : parentVal
  if (instanceData) {
    return mergeData(instanceData, defaultData)
  } else {
    return defaultData
  }
  ```

通过上面的处理之后，`data`返回的一定是一个函数，为什么呢？如下：

  1. 通过`new`调用，返回的是`mergedInstanceDataFn`函数，保证了是一个函数
  2. 通过`Vue.extend`调用。如果子组件不存在则返回父，即：
    ```js
    Vue.extend({})
    ```
此时就是子不存在的情况，返回父为`Vue.options.data`。而在`Vue.options`上面压根是不存在`data`的，也就是说，上面的调用`mergeField`根本就不会去调用的到`data`。
```js
for (key in parent) {
  mergeField(key)
}
for (key in child) {
  if (!hasOwn(parent, key)) {
    mergeField(key)
  }
}
```
而通过`Vue.extend`传入`data`的值，如果不是一个函数，上面已经经过了验证。如下不是函数已经抛出错误了。
```js
if (!vm) {
  if (childVal && typeof childVal !== 'function') {
    console.log(childVal,'sssssss')
    process.env.NODE_ENV !== 'production' && warn(
      'The "data" option should be a function ' +
      'that returns a per-instance value in component ' +
      'definitions.',
      vm
    )
    return parentVal
  }
  return mergeDataOrFn(parentVal, childVal)
}
```
所以经过这个步骤之后，保证了`data`返回的一定是一个函数。


## 生命周期钩子的合并策略
在之后是声明周期的合并,依然是当前文件下。
```js
/**
 * Hooks and props are merged as arrays.
 */
function mergeHook(
  parentVal,
  childVal
) {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})
```
```js
/* shared/constants.js */
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
```

所有的声明周期都使用同样的合并策略`mergeHook`函数。先定义一个常量 `res` 由一个较长的三木运算符来处理。整理如下，可以能更容易理解一点。
```js
let res;
if(childVal){
  if(parentVal){
    res = parentVal.concat(childVal)
  }else{
    if(Array.isArray(childVal)){
      res = childVal
    }else{
      res = [childVal]
    }
  }
}else{
  res = parentVal
}
```
这里有一点比较令人疑惑的就是 `res = parentVal.concat(childVal)`，这句代码意味这如果`parentVal`存在一定是一个数组。这是为什么呢。来看之前的例子。
```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  created: function () {
    console.log('created')
  }
})
```
第一次调用时，它是和 `Vue.options`来进行一个合并。上面我们已经知道`Vue.options`上面是不存在任何一个生命周期的，因此第一次之后一定是一个数组，再之后的操作也就顺其自然的一定是一个数组了。即`Vue`的生命周期在经过合并之后是变成了一个数组,并且声明周期可以是一个数组，如下的调用完全是可以的，只是`Vue`文档中没有暴露此方法。
```js
new Vue({
  el: '#app1',
  mounted: [
    function fn() {
      console.log(1)
    },
    function fn2() {
      console.log(2)
    }
  ]
})
```
## component、directive、filter的合并
```js
function mergeAssets(
  parentVal,
  childVal,
  vm,
  key
) {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})
```
```js
/* shared/constants.js */
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
```
`component、directive、filter`三个的合并策略也是一样的，同样都是通过`mergeAssets`函数。首先通过 `parentVal||null`为原型来创建一个对象。如果存在 `childVal`的话在开发环境还要调用一个`assertObjectType`函数（只是一个校验函数，开发环境抛出警告），之后通过 `extend` 将 `childVal` 混入到`res`上。如果不存在`childVal`直接返回 `res`。所有其实`component、directive、filter`的合并就是一个将`parentVal`作为`childVal`的`__proto__`
```js
new Vue({
  el:'#app',
  components:{
    child:child
  }
})
```
此时合并完之后就是下面的样子
```js
{
  child,
  __proto__:{
    KeepAlive,
    Transition,
    TransitionGroup
  }
}
```



## watch合并策略

```js
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined  //这里只是为了除了firefox原生的watch函数
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = {}
  //将parentVal的属性混合到 ret上面
  extend(ret, parentVal)
  //遍历childVal
  for (const key in childVal) {
    let parent = ret[key]
    //遍历child的同时 如果父上面是不是一个数组就转为数组。
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    // 之后就行一个数组的concat
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}
```
```js
/* core/util/env.js */
export const nativeWatch = ({}).watch
```
如果不存在 `childVal`直接返回 以`parentVal || null`为原型创建的对象。之后如果不存在 `parentVal`直接返回`childVal`。继续向下的话就代表这`childVal、parentVal`上面都存在。那么就需要进行一个合并操作。上面的代码还是笔记好理解的。通过上面的合并。同一个属性的`watch`可能会变成一个数组。



## props、methods、inject、computed合并策略
` props、methods、inject、computed`的合并策略相同，都是同一个函数。
```js
strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && process.env.NODE_ENV !== 'production') {
      assertObjectType(key, childVal, vm)
    }
    //如果不存在 parentVal 直接返回 childVal
    if (!parentVal) return childVal
    //否则的话就将创建一个空对象，将 parentVal childVal进行一个合并。
    const ret = Object.create(null)
    extend(ret, parentVal)
    if (childVal) extend(ret, childVal)
    return ret
  }
```
`props、methods、inject、computed`的合并策略。总体就是如果`parentVal`不存在，直接返回`childVal`。如果`parentVal`存在`childVal` 也存在就将`parentVal、childVal`进行合并操作。**`extend(ret, childVal)`**操作之后会，如果`childVal`父覆盖掉`parentVal`上同名的属性。

## provide合并策略

```js
strats.provide = mergeDataOrFn
```
直接使用`mergeDataOrFn`函数，和`data`的合并策略一致。


## extends、mixins 的合并
```js
if (child.extends) {
  parent = mergeOptions(parent, child.extends, vm)
}
if (child.mixins) {
  for (let i = 0, l = child.mixins.length; i < l; i++) {
    parent = mergeOptions(parent, child.mixins[i], vm)
  }
}
```
之前对于` extends、mixins`的操作，是直接跳过了。看完整个`mergeOptions`再来看。这两个都是为了解决`Vue`中的代码复用问题。对于`mixins`是一个数组，因此进行遍历合并。而`extends`比较简单，只能是一个对象，直接进行合并而无需遍历。









