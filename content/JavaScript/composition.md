# 被忽略掉的composition event

最近在学习别人是如何使用`Vue`来造轮子，因此选择在`Vue`的 `UI`框架 `Element UI`。`el-input`中有这么一段代码
```js
 handleInput(event) { // input事件的触发  如果是IME事件的合成过程中是不触发input
  // should not emit input during composition
  // see: https://github.com/ElemeFE/element/issues/10516
  if (this.isComposing) return

  // hack for https://github.com/ElemeFE/element/issues/8548
  // should remove the following line when we don't support IE
  if (event.target.value === this.nativeInputValue) return

  this.$emit('input', event.target.value)

  // ensure native input value is controlled
  // see: https://github.com/ElemeFE/element/issues/12850
  this.$nextTick(this.setNativeInputValue)
},
```
`element`在处理输入框的`input`事件的时候，首先进行了一次判断，如果`this.isComposing`为`true`的时候是直接进行了`return`的。也就是说`input`事件并不是每次触发的时候都进行了向上的事件传递的。第一眼看到这里的时候有那么一点懵的。细看上面的注释`should not emit input during composition`。在`composition`触发的时候不应该触发`input`事件。

## composition是什么
`composition`之前好像是在哪里看到过，但印象并不是那么深刻.

`Composition Event`，中文译为复合事件，是 DOM 3 级事件中新添加的一类事件类型，用于处理 IME 的输入序列。IME（Input Method Editor，输入法编辑器）可以让用户输入在物理键盘上找不到的字符。复合事件就是针对检测和处理这种输入而设计的。比如在输入中文的时候，需要通过拼音来组合生成，并不是通过键盘直接选择每一次字符，此时就会用到`composition event`

**`composition event`包含三个事件**

 1. compositonstart 在IME的文本复合系统打开时触发。即开始输入拼音时候触发
 2. compositionupdate 在插入新字符时触发，同 input 事件触发一样，只是触发的时机早于 input
 3. compositionend 输入完成，即选中文字真正输入输入框之后

具体看下面的代码
```html
<body>
  <input type="text" name="" id="ipt">
  <script>
    const input = document.querySelector('#ipt')
    input.addEventListener('input',function(e){
      console.log('input事件触发',e.target.value)
    })
    input.addEventListener('compositionstart',function(){
      console.log('componsitionstart触发')
    })
    input.addEventListener('compositionupdate',function(){
      console.log('compositionupdate触发')
    })
    input.addEventListener('compositionend',function(){
      console.log('compositionend触发')
    })
  </script>
</body>
```
输入框中输入中文你好的时候，`componsitionstart`首先执行一次，之后是`compositionupdate`和`input`事件都执行 6 次（5 个字符和最后一次选中文字），最后触发一次`compositionend`事件。
```
componsitionstart触发
compositionupdate触发
input事件触发 n
compositionupdate触发
input事件触发 ni
compositionupdate触发
input事件触发 ni h
compositionupdate触发
input事件触发 ni ha
compositionupdate触发
input事件触发 ni hao
compositionupdate触发
input事件触发 你好
compositionend触发
```
## el-input中使用
在我查资料的时候正好看到了 饿了么前端团队的这一篇文章.[移动端 Web 开发踩坑之旅](https://zhuanlan.zhihu.com/p/26141351)。中间有介绍到 input 的 `compositionstart` 和 `compositionend` 事件.(不得不说，真是个良心团队啊！)。上面介绍到的配合`input`事件的使用方法和`Element UI`的使用方式一样。设置一个开关来判断当前是否是复合事件。具体实现可以继续查看饿了么的这篇文章[移动端 Web 开发踩坑之旅](https://zhuanlan.zhihu.com/p/26141351)。

反思上面各个事件的执行时机，由于`compositionend`是晚于最后一次`input`事件的执行的。因此最上面的代码中如果只是在`handleInput`中来向上传递事件的话`this.$emit('input', event.target.value)`，是不会执行的，因为最后一次触发`input`事件的时候开关`isComposing`还是为`true`。所以在`el-input`同时监听了`compositionend`事件。
```js
handleCompositionEnd(event) { // IME合成执行完毕之后将开关置为false同时触发input事件
  if (this.isComposing) {
    this.isComposing = false
    this.handleInput(event)
  }
},
```
除了`Element UI`中的使用，此时可以想到很多使用场景，如搜素输入框中，通过和`composition event`的配合，避免用户在输入中文拼音的时候就一直触发搜索事件的执行。
<Gitalk></Gitalk>
















