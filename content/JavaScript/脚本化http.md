
# 脚本化http
## ajax
在ajax出现以前，页面的只能通过表单提交数据，服务器接受请求拼接html并返回。浏览器接收到html，渲染新的内容。这种交互的方式缺陷显而易见。就是任何的和服务器的交互都需要刷新页面。用户的体验非常差。ajax的出现解决了这个问题。可以实现将网页应用的增量迅速的呈现给用户，而不需要重载页面。
ajax通过浏览器的XMLHttpRequest来实现，X代表XML。但是由于JSON更加的轻量而且作为JavaScript的一部分，因此JSON的使用比XML更加的普遍。
### 原生ajax的用法
下面时一个XMLHttpRequest实现一个get请求的伪代码。
```javascript
function get(url, callback) {
  var request = new XMLHttpRequest()
  request.send('get', url)
  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status === 200) {
      var type = request.getResponseHeader('COnten-Type')
      if (type.indexOf('xml') !== -1 && request.responseXML) {
        callback(request.responseXML) //Document对象相应
      } else if (type === 'application/json') {
        callback(JSON.parse(request.responseText)) //JSON响应
      } else {
        callback(request.responseText) //字符串响应
      }
    }
  }
  request.send(null)
}
```
**XMLHttpRequest对象常用的函数、属性和事件**

![XMLHttpRequest对象常用的函数、属性和事件](https://user-gold-cdn.xitu.io/2019/5/12/16aaa06f423a4f28?w=2604&h=994&f=jpeg&s=213139)


**MLHttpRequest对象常用的函数**

函数  | 用法  | 解释
------|------|-----
open  | xhr.open(method,url,async)  | method为请求方式<br> url:请求地址<br/>aysnc布尔值，代表是否异步请求。默认为true(异步)
send  | xhr.send(data)  | 当请求方式为get时，所有参数会拼接在url中，send(null)<br/> 请求方式为post时，数据会在请求体中，即send(data)
abort | xhr.abort() | 用来终止一个ajax请求，调用此方法后readyState将被设置为0，终结请求。
setRequestHeader  | xhr.setRequestHeader(header,value)  | 用来这是HTTP的请求头，必须在open()和send()之间调用
getResponseHeader | xhr.getResponseHeader(header) | 用来获取http返回头，如果返回头中有多个一样名称，返回的值中会用逗号和空格将值分割成字符串，会自动过滤掉cookie
getAllResponseHeaders | xhr.getAllResponseHeaders() | 用来获取所有的请求头，同getResponseHeader一样，会自动过滤掉cookie
 overrideMimeType | xhr. overrideMimeType(MIME类型) | XHR2定义了overideMimeType()方法，并且大多数的浏览器已经实现，若果你比浏览器更了解资源的MIME类型，可以在send()之前把类型传递给overideMimeAType()，这将使XMLHttpRequest忽略"Content-Type"头而使用指定的类型

**XMLHttpRequest对象常用的属性**

属性         | 解释
------------  |-----
readyState    | 0代表open()尚未调用，1代表open()已经被调用,2代表接受到头信息<br/>,3代表接收到响应主体，4代表响应完成。每次的改变会触发readstatechange事件。
status        | http的请求状态码
statusText    | 只读属性，状态对应的文本信息
responseType  | 响应的数据类型，允许我们手动设置。默认text类型（实际上是 DOMString）。 <br/> arraybuffer:response 是一个包含二进制数据的 JavaScriptArrayBuffer<br/>blob:response是一个包含二进制数据的 Blob 对象<br/>document:response 是一个 HTMLDocument或 XMLXMLDocument，这取决于接收到的数据的 MIME 类型。<br/>json:response是包含在 DOMString对象中的文本。
response   |  响应的正文，返回的类型由responseType来决定
timeout     | 超时时间，默认0，没有超时。单位毫秒
responseText  | 包含对文本的请求的响应，如果请求不成功或尚未发送，则返回null。如果 XMLHttpRequest.responseType 的值不是 text 或者空字符串，届时访问 XMLHttpRequest.responseType 将抛出 InvalidStateError 异常。
withCredentials | cookie的设置，默认为true，携带cookie，跨域时，默认为false，不携带。
upload    | xhr2规范，返回一个XMLHttpRequestUpload对象，用来表示上传的进度。可以绑定的事件：<br/>onloadstart获取开始，onprogress数据传输进行中。onabort获取操作终止。onerror失败<br/>onload获取成功 ontimeout获取操作在用户规定的时间内未完成 onloadend获取完成（不论成功与否）

### post请求

POST请求包含一个请求体，默认情况下，表单数据是通过POST发送服务器。将编码的数据表单数据作为请求主体。表单的编码相对简单。使用十六进制转义码替换特殊字符
```javascript
a=1&b=2&c=3
```
表单的编码格式有一个正式的MIME类型： 传递此种序列化的数据时，必须使用下面的这种'Content-type'
```javascript
application/x-www-form-urlencoded
```
**用于post请求的编码对象：**
```javascript
function encodeFormData(data){
  if(!data){
    return ''
  }
  var pairs = []
  for(var name in data){
    if(!data.hasOwnProperty(name)){
      continue
    }
    if(typeof data[name]==='function'){
      continue
    }
    var value = data[name].toString()
    name = encode(name)
    value = encode(value)
    pairs.push(name + '=' + value)
  }
  return pairs.join('&')
}
function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}
function postData(url, data, callback) {
  var request = new XMLHttpRequest()
  request.open('POST', url)
  request.onreadystatechange = function() {
    if (request.readyState === 4 && callback) {
      callback(request)
    }
  }
  request.setRequestHeader('Content-Type', 'application/x-www/urlencoded')
  request.send(encodeFormData(data))
}
```
**JSON编码的请求:**
```javascript
function postJSON(url, data, callback) {
  var request = new XMLHttpRequest()
  request.open('POST', url)
  request.onreadystatechange = function() {
    if (request.readyState === 4 && callback) {
      callback(request)
    }
  }
  request.setRequestHeader('Content-Type', 'application/json')
  request.send(JSON.stringify(data))
}
```
**post文件上传**
xhr2规范中允许send()方法来接受一个file对象来实现文件的上传，同时
```javascript
//查找有data-uploadto属性的全部input type=file元素
//并这册onchange事件处理程序
//这样任何选择的文件都会自动通过post方法发送到指定的uploadto的url
//忽略服务器的响应
(function() {
 var elts = document.getElementsByTagName('input')
 for (var i = 0; i < elts.length; i++) {
   var input = elts[i]
   if(input.type!=='file') continue;
   var url = input.getAttribute('data-uploadto') //获取文件上传的url
   if(!url) continue;
   input.addEventListener('change',function(){
     var file = this.files[0]      //假设单个文件的上传
     if(!file) return;
     var xhr = new XMLHttpRequest();
     xhr.open('POST',url)
     xhr.send(file)
   },false)
 }
}())

```
**multipart/form-data请求**
当HTML表单同时包含文件上传元素和其他元素时，浏览器不能使用普通的表单编码而必须使用multipart/form-data的特殊Content-Type来用POST方法提交表单。这种编码包括使用长"边界"字符串把请求主体分离成多个部分。XHR2 定义了新的FormData的API，它容易实现多部分请求主体。
```javascript
function postFormData(url, data, callback) {
  if (typeof FormData === 'undefined') {
    throw new Error('FromData is not implemented')
  }
  var request = new XMLHttpRequest()
  request.open('POST', url)
  request.onreadystatechange = function() {
    if (request.readyState === 4 && callback) {
      callback(request)
    }
  }
  var formdata = new FormData()
  for (var name in data) {
    if (!data.hasOwnProperty(name)) continue; //如果时继承来的属性，跳过
    var value = data[name]
    if (typeof value === 'function') continue;
    formdata.append(name, data[name]) //没个请求变成主体的一部分
  }
  // 在multipart/form-data请求主体中发送名。值对
  //每对都是请求的一个部分
  request.send(formdata)
}
```

### get和post的区别(面试常问)


**w3cschools上的标准答案**
* GET请求在浏览器的回退时时无害的，而POST会再次的提交请求
* GET产生的URL地址可以被Bookmark，而POST不会
* GET请求会被浏览器主动cache，而POST不会，除非手动设置
* GET请求只能通过url编码，而POST支持多种编码方式
* GET请求参数会被完整的保留在浏览器的历史记录中，而POST请求的参数是不会被保留的
* GET请求在URL中传送的参数是有长度限制的(大多数浏览器限制2k，但是大多数服务器最多处理64k的url)，POST请求的没有
* 对参数的数据类型GET值接受ASCII字符，而POST没有限制
* POST请求更安全，因为GET请求的参数直接暴露在URL中，所以不能传递敏感信息
* GET参数通过URL传递，POST放在Requestbody中

到这里已经差不多了，但是我要说的是其实GET和POST本质上是没有区别的！

GET和POST是HTTP协议中的两种发送请求方式，而HTTP是基于TCP/IP的关于数据如何在万维网中通信的协议。也就是说GET/POST都是TCP连接，所以本质上来说GET和POST请求能做的事情是一样的。

GET可以加上requestbody，同样POST也可以加上url参数，技术上完全是行的通的。但是对于服务器来说，不同的服务器处理方式不同，有些服务器会帮你获取GET中的requestbody，有些服务器则会直接忽略。因此虽然可以实现，但是不保证一定会被接收。

最后GET和POST还有一个重大的区别，就是GET只会产生一个TCP数据包，而POST产生两个TCP数据包。

对于GET请求方式，浏览器会把http header和一块发送出去，而对于POST请求，浏览器会发送header，服务器响应100 continue，浏览器再发送data，服务器响应返回数据。因此POST请求消耗的事件更多一点，看起来GET比POST更高效。实际上环境好的情况下，发送一次TCP数据包和发送两次数据包消耗的时间差是可以忽略的。但是在网络环境差的情况下，两次TCP在验证数据包的完整性上，是有非常大的优点的。同时并不是所有的浏览器POST都会发送两次数据包，FireFox就只发送一次。