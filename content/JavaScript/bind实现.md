# bind 模拟实现
## 第一版
先实现bind 的最重要功能 this 的绑定，如下：
```js
var obj = { value: 'hello' }
function fn() {
  console.log(this.value)
}
const fn1 = fn.bind(obj)
fn1()     //hello
```
代码实现如下：
```javascript
Function.prototype.bind2 = function (oThis) {
  if (typeof this !== 'function') {
    throw new Error('调用者不是一个函数')
  }
  var that = this
  return function () {
    return that.apply(oThis)
  }
}
```
## 第二版
实现一个传递参数的bind
```javascript
var obj = { value: 'hello' }
function fn(name, age) {
  console.log(this.value)   
  console.log(name)
  console.log(age)
}
//hello
const fn1 = fn.bind(obj)  //xiaopingbxiao
fn1('xiaopingbxiao', 18)  //18
```
代码实现
```javascript
Function.prototype.bind2 = function (oThis) {
  if (typeof this !== 'function') {
    throw new Error('调用者不是一个函数')
  }
  var that = this
  return function () {
    return that.apply(oThis, Array.prototype.slice.call(arguments))
  }
}
```
## 第三版
上面已经实现了一个简单的参数传递：但是在像下面的使用时是存在问题的：
```javascript
const fn11 = fn.bind(obj, 'xiaopingbxiao')
fn11(18)
```
```javascript
Function.prototype.bind2 = function (oThis) {
  if (typeof this !== 'function') {
    throw new Error('调用者不是一个函数')
  }
  var aArgs = Array.prototype.slice.call(arguments, 1)
  var that = this
  return function fn() {
    return that.apply(oThis, aArgs.concat(Array.prototype.slice.call(arguments)))
  }
}
```
## 第四版（最终版)
当使用bind生成的函数进行new 操作时，需要修正this 和 原型链：
```javascript
Function.prototype.bind2 = function (oThis) {
  if (typeof this !== 'function') {
    throw new Error('调用者不是一个函数')
  }
  var aArgs = Array.prototype.slice.call(arguments, 1)
  var that = this
  var loop = function () { }	// 空函数
  var fn = function () {
    oThis = this instanceof fn ? this : oThis				//修正this 新增
    return that.apply(oThis, aArgs.concat(Array.prototype.slice.call(arguments)))
  }

  if (this.prototype) {
    loop.prototype = this.prototype
  }
  fn.prototype = new loop()
  return fn
}
```