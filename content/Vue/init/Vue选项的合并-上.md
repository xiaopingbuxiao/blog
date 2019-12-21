# Vue选项的合并-上
## new一个Vue的时候发生了什么
如果对`Vue.extend`不熟悉的话，建议先看[Vue.extend](’/vue/init/extend.html‘)
当我们使用`vue`的时候如下，官网简单的例子
```html
<div id="app">
  {{ message }}
</div>
```
```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
```
现在来看一下`Vue`在调用的过程中到底是做了哪些事情。Vue的最初定义实在 `core/instance/index` 下面。
```js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
``` 
可以看到第一步是直接调用了 `this.init` 函数，并且传入了一个参数`options`。这里的 `options`就是我们在一开始`new Vue`传入的参数，如下:
```js
options = {
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
}
```
现在再来找一下 `init` 函数的定义，在文件 `core/instance/init.js` 下面的`initMixin`函数中.
```js
Vue.prototype._init = function (options) {
  const vm = this
  // a uid
  vm._uid = uid++
  debugger
  let startTag, endTag
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
  }

  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    /* 如果当前Vue实例不是组件 mergeOptions */
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  // expose real self
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false)
    mark(endTag)
    measure(`vue ${vm._name} init`, startTag, endTag)
  }

  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
首先是定义了一个 `vm` ，并且在 `vm` 身上加了一个一直自增的 `uid`。这里的 `vm` 赋值为`this`。其实就是保存的当前 `Vue` 实例。再之后定义了一个 `startTag` 和 `endTag` 两个变量。
```js
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
  startTag = `vue-perf-start:${vm._uid}`
  endTag = `vue-perf-end:${vm._uid}`
  mark(startTag)
}
 /* istanbul ignore if */
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
  vm._name = formatComponentName(vm, false)
  mark(endTag)
  measure(`vue ${vm._name} init`, startTag, endTag)
}
```
这两个变量只会在这里使用，其实这里是 `Vue` 关于性能追踪的代码。在开发环境可以通过 `Vue.config.performance = true`来开启，具体可以看[performance](https://cn.vuejs.org/v2/api/#performance)，这里不做关注。继续向下分析，首先是在 `Vue`的实例 `vm` 上增加了一个属性 `_isVue` 为 true。目的就是为了表示一个对象是 `Vue` 实例。再之后进入一个 `if` 判断.
```js
if (options && options._isComponent) {
  // optimize internal component instantiation
  // since dynamic options merging is pretty slow, and none of the
  // internal component options needs special treatment.
  initInternalComponent(vm, options)
} else {
  /* 如果当前Vue实例不是组件 mergeOptions */
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
}
```
上面我们知道，传入的 `options` 其实就是在 `new Vue`的时候传入的参数。是不存在 `options._isComponent`的，因此这个判断一定是走的 `else` 逻辑。
即给 vm 的实例上增加了 `vm.$options`。[官网$options的介绍](https://cn.vuejs.org/v2/api/#vm-options)。这里插一句在 element-ui 中大量的使用到了 `$options` 属性，通过在组件内部定义一个自定义属性来判断当前的组件是什么。如[radio-group中的 componentName](https://github.com/ElemeFE/element/blob/dev/packages/radio/src/radio-group.vue)和 [emitter的配合使用](https://github.com/ElemeFE/element/blob/dev/src/mixins/emitter.js)


## mergeOptions的参数-进入正题
根据引用关系，可以找到 `mergeOptions` 的函数定义在 `coe/unit/options.js`中。看 `mergeOptions` 之前先来看一下 `mergeOptions` 函数的三个参数 。
```js
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
)
```
第一个参数是 `resolveConstructorOptions` 函数调用的返回值，第二个参数是 传入的 `options`。最后一个是当前的 `Vue`实例`vm`。继续查找可以找到 `resolveConstructorOptions` 的函数定义就在当前的 `core/instance/init.js`中。
```js
export function resolveConstructorOptions(Ctor) {
  let options = Ctor.options
  /** 
   * 如果有super属性的话 是使用 Vue.extend 来生成的  先用关注具体实现，只需要关注返回值 options
   * vm.constructor  就是Vue的构造函数 
   * 因此此时的options就是去获取Vue类上的静态属性 Vue.options 
   * 继续去关注 何时挂载上的   
   *  根据Vue的导入文件一直查找到 runtime/index.js
   */
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
```
函数的最开始直接定义一个变量 `let options = Ctor.options` 而 Ctor 参数是传入的 `vm.constructor`。此时也就是 Vue 的构造函数，因此 `Ctor.options` 其实就是
`Vue.options`。再之后进入一个 if 判断。来判断 `Ctor.super` 。而 `Ctor.super` 在这里是不存在的（之前看了`Vue.extend`，我们知道通过`Vue.extend`来生成一个子类的时候才会存在`super`属性，这里先不做关注）。这里最终都是用来返回当前实例的构造函数上的 `options` 的。

现在来看一下`Vue.options`是什么。全局搜索，很容易找到。在`core/global-api/index.js`上
```js
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
Vue.options = Object.create(null)
ASSET_TYPES.forEach(type => {
  Vue.options[type + 's'] = Object.create(null)
})
Vue.options._base = Vue
extend(Vue.options.components, builtInComponents)
```
之后在`web/runtime/index.js`中出现。
```js
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
```
经过上面两个文件js之后，`Vue.options`如下：
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
让我们回到主线，此时的`vm.$options`相当于：
```js
vm.$options = mergeOptions(
  {
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
  },
  {
    el: '#app',
    data: {
      message: 'Hello Vue!'
    }
  },
  vm
)
```
现在来看 `mergeOptions` 函数的具体实现，他是在 `core/util/options.js`中定义：
```js
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions(
  parent,
  child,
  vm
) {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }
  if (typeof child === 'function') {
    child = child.options
  }
  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)
  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

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
}
```
一步步的来看 `mergeOptions` 的操作。首先
```js
if (process.env.NODE_ENV !== 'production') {
  checkComponents(child)
}
```
如果是在开发环境的话，会先调用 `checkComponents` 并且将第二个参数，也就是我们`new Vue`是传入的参数来进行一个校验。
校验函数就在当前的`core/util/options.js`文件中
```js
function checkComponents(options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}
export function validateComponentName(name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}
```
他会去遍历 `options.components` 判断名字是否符合规范，如果不符合直接抛出警告。这里的校验只要是两点；
* 名字符合正则表达式 `new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`)`
* 名字不能是 Vue 保留标签(如slot和template) 或者 html 和 svg 的内置标签

```js
if (typeof child === 'function') {
  child = child.options
}
```
之后是上面的这段代码，如果 `child` 是一个函数的话（如果是使用的`Vue.extend`创建出来的子类就是一个函数），就去函数上面的静态属性`options`来作为新的 `child`。



## 选项的规范化

```js
normalizeProps(child, vm)
normalizeInject(child, vm)
normalizeDirectives(child)
```
继续向下来到函数三兄弟，规范化`props、inject、directives`。由于`Vue`提供了多种写法，如 `props`即可以是一个数组也可以是一个对象，用户可以有多种选择，但是在`Vue`的底层实现上需要统一的规范。

### props的规范化
先来看 `porps` 的规范化。函数的定义就在当前文件 `core/util/options.js`
```js
/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps(options, vm) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}
```

**props是一个数组**

这个函数并不复杂，如果不存在 `props` 直接返回，如果 `props` 是一个数组。
```js
props:['a','b']
```
即我们是通过上面的这种方式使用的。则进入一个 `while` 循环。
```js
if (typeof val === 'string') {
  name = camelize(val)
  res[name] = { type: null }
} else if (process.env.NODE_ENV !== 'production') {
  warn('props must be strings when using array syntax.')
}
```
如果数组中的每一项不是字符串时，抛出警告。即当`props`是一个数组的时候，中间的每一项必须是字符串。之后将`props`中已中划线命名的值改为驼峰命名。之后将`props`中的每一项规范化为一个对象`{ type: null }`.

**props是一个对象**
```js
for (const key in props) {
  val = props[key]
  name = camelize(key)
  res[name] = isPlainObject(val)
    ? val
    : { type: val }
}
```
当 `props`是一个对象时判断 `props`中的每一项。如果是对象就按原值返回，否则的话，也规范成一个对象，但是此时的对象中 `type` 为 每一项的值。即：
```js
props:{
  a: String,
  b: {
    type: String,
    default: ''
  }
}
```
规范化之后:
```js
props:{
  a: {
    type: String
  },
  b: {
    type: String,
    default: ''
  }
}
```
如果既不是数组也不是对象就在开发环境抛出警告。

### inject的规范化
`normalizeInject`函数同样是在当前的文件下`core/util/options.js`
```js
/**
 * Normalize all injections into Object-based format
 */
function normalizeInject(options, vm) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}
```
如果不存在直接返回。

**inject是一个数组**
```js
const normalized = options.inject = {}

if (Array.isArray(inject)) {
  for (let i = 0; i < inject.length; i++) {
    normalized[inject[i]] = { from: inject[i] }
  }
}
```
如果是一个数组如下
```js
inject:['a','b']
```
规范化之后
```js
inject:{
  a: { from: 'a' },
  b: { form: 'b' }
}
```

**inject是一个对象**
```js
for (const key in inject) {
  const val = inject[key]
  normalized[key] = isPlainObject(val)
    ? extend({ from: key }, val)
    : { from: val }
}
```
`inject`中的属性如果是一个对象的时候和`props`是不同的，依然需要进行一个规范化，如下
```js
inject: {
  a,
  b: 'bb',
  c: { default: 'someValue' }
}
```
规范化之后
```js
inject: {
  a: { from: 'a' },
  b: { from: 'bb' },
  c: { from: 'c', default: 'someValue' }
}
```
### directives的规范化
最后一个directives的规范化
```js
/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives(options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}
```
由于 `directives` 有多个钩子函数，`bind、inserted、update、componentUpdated、unbind`
因此如果 `directives` 中的每一项如果是一个函数时，默认处理为
```js
directives:{
  bind: fn,
  update: fn
}
```
到现在为止，`Vue`将用户传入的 `props、inject、directives`已经完成了规范化的处理。之后进入下一个`if`分支：
```js
if (!child._base) {
  if (child.extends) {
    parent = mergeOptions(parent, child.extends, vm)
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
}
```
这里我们很容易想到是对 `extends、mixins`的操作。如果 `child.extends` 存在的的话，递归调用 `mergeOptions` 函数，将 `parent` 和 `child.extends`进行合并的操作，同时将 返回的结果作为赋值给 `parent`。 之后检测 `child.mixins`是否存在，如果存在的话就遍历 `mixins` 以同样的方式进行递归调用。
在上面的例子中 `child`的值如下。
```js
{
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
},
```
因此先不考虑递归调用的情况。只看最简单的合并策略，即`parent`的参数如下
```js
{
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

上面虽然已经在`mergeOptions`函数中了，但是都是在做一些选项的规范化的操作。之后才是真正的合并策略。
