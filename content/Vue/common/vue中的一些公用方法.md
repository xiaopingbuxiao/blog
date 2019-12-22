


### camelizeRE
将中划线的命名改为驼峰命名，位置`shared/util.js`中
```js
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
```


### isPlainObject
检验是否是一个对象，不能是 `null` 或者 `Array`。位置`shared/util.js`中
```js
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}
```
### extend
将一个`_from`对象的属性复制到 `to`上。位置`shared/util.js`中
```js
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
```
### hasOwn
检查对象自身是否含有某个属性
```js
/**
 * Check whether an object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn{
  return hasOwnProperty.call(obj, key)
}
```








