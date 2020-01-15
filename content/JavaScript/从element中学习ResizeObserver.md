
# 从element中学习ResizeObserver

相信大家或多或少都碰到过自定义滚动条的需求，但是迄今为止只有谷歌浏览器提供了更改滚动条样式的方法。而对于其他的浏览器，我们除了自己实现一个滚动条之外别无他法。而在`element-ui`中其实是有一个`el-scrollbar`组件的，只是不知道因为什么原因，没有对外进行暴露。

## el-scrollbar 的实现思路
`el-scrollbar`实现的总体思路并不难：
1. 创建一个包裹区 `wrap`，在`wrap`中进行滚动。
2. 创建一个真正的视图区`view`，超出`wrap`，真正的内容显示需要的区域。
3. 创建模拟的滚动条，js 计算模拟的滚动条长度以及需要滚动的位置。

如果你想知道每一步的实现步骤的话，可以[点击这里](https://github.com/ElemeFE/element/blob/dev/packages/scrollbar/src/main.js)

但是此时有一个问题。如果真正的内容展示区`view`在用户触发了某一个事件的时候会进行大小的改变，那我们的模拟的滚动长度以及滚动条所在位置就需要进行调整。

针对这个问题，首先想到的解决方法可能就是，我们在用户触发`view`区大小改变的时候，从新进行一次滚动条的处理。这种方法虽然能够解决问题，但是在使用的时候需要关注引起`view`区大小改变的事件来进行手动的处理。如果页面中有很多引起`view`变化的事件，我们就需要调用很多次，这显然是不够优雅的。

那么有没有一种类似于`window.onresize`的方法，可以直接对`view`区来进行一个监听处理，当`view`去变化的时候自动调用呢? 答案是肯定的。就是下面我们要说到的`ResizeObserver`。

## ResizeObserver
MDN上对于`ResizeObserver`的介绍：

`ResizeObserver` 接口可以监听到 `Element` 的内容区域或`SVGElement`的边界框改变。内容区域则需要减去内边距padding。更多的信息[ResizeObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver)。

`ResizeObserver`虽然是一个实验中的 API ，浏览器对他的兼容性并不好，但是已经有了`ployfill`，`https://www.npmjs.com/package/resize-observer-polyfill`。因此我们可以放心的使用。

**`ResizeObserver`包含三个方法**

1. ResizeObserver.disconnect() 取消和结束目标对象上所有对 Element或 SVGElement 观察。
2. ResizeObserver.observe() 开始观察指定的 Element或 SVGElement。
3. ResizeObserver.unobserve() 结束观察指定的Element或 SVGElement。


可以点击[在线demo进行验证](https://codesandbox.io/s/vigilant-bush-124tz) 。也可将下面的代码复制到编辑器。
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>
    <style>
      * {
        margin: 0;
        padding: 0;
      }
      .box {
        width: 100px;
        height: 100px;
        border: 2px solid red;
        font-size: 40px;
        user-select: none;
      }
      button {
        width: 100px;
        height: 40px;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <div class="box1 box">box1</div>

    <div class="box2 box">box2</div>
    <button class="btn1">取消box1的监听</button>
    <button class="btn2">取消所有的监听</button>
    <script>
      const resizeObserver = new ResizeObserver((entries, b) => {
        for (let entry of entries) {
          console.log(entries, b === resizeObserver);
        }
      });
      const elbox1 = document.querySelector(".box1");
      const elbox2 = document.querySelector(".box2");
      resizeObserver.observe(elbox1);
      resizeObserver.observe(elbox2);

      elbox2.onclick = elbox1.onclick = function(e) {
        e.target.style.width = e.target.offsetWidth + 10 + "px";
      };
      const elbtn1 = document.querySelector(".btn1");
      const elbtn2 = document.querySelector(".btn2");
      elbtn1.onclick = function() {
        resizeObserver.unobserve(elbox1);
      };
      elbtn2.onclick = function() {
        resizeObserver.disconnect();
      };
    </script>
  </body>
</html>
```
每次dom 变化时都会触发监听函数，同时传递两个参数，第一个参数`entries`为数组，包含当前监听的发生变化的 dom 的 `ResizeObserverEntry object`。数组中的每一项上面又包含`target`和`contentRect(同el.getClientRects返回值一样)`，第二个参数为当前的 `ResizeObserver`实例。

## el-scroll的使用
从 `el-scroll`而来，最后当然要回到`el-scrollbar`去，下面奉上`el-scrollbar`的使用文档:



参数           | 说明          |      类型        |  默认值
--------------|---------------|------------------|---------
native       |是否使用原生滚动条| boolean         | false
wrapStyle     | wrap的自定义样式 | [{width:xx},{height:xx}]或者/string|-
wrapClass   | wrap的自定义class| object/string/array [vue的class绑定](https://cn.vuejs.org/v2/guide/class-and-style.html) |-
viewStyle | 同 wrapStyle    | 同 wrapStyle | -
viewClass | 同 wrapClass    | 同 wrapClass | -
noresize | 是否关闭监听 view区的变化（如果 view 区尺寸不会发生变化，最好设置它可以优化性能） | boolean | false
tag |  view 区的包裹标签    | string  | div


<Gitalk></Gitalk>





