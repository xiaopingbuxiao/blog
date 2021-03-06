
# 前后端都用得上的cors设置

关于前端如何处理跨域问题，推荐大家看这一篇文章[九种跨域方式实现原理（完整版）](https://github.com/ljianshu/Blog/issues/55)，覆盖了多种跨域解决方法。

此篇文章主要针对中间的一点，如何通过`cors`来实现。以及出现的各种跨域报错的信息如何处理。文中所有代码基于`node`实现，同样适合于`java、php`以及`nginx`等。

最近配合服务端同学处理了两次线上跨域问题。在配合服务端同学解决的过程中并不是很顺利，踩到了一些坑，因此痛定思痛，将其整理出来。


## 简单请求和预检请求(复杂请求)

类型        | 定义
------------|--------------------------
简单请求     |1、使用`GET、HEAD、POST`三种方法之一 <br/> 2、不得人为设置该集合之外的其他首部字段。该集合为`Accept、Accept-Language、Content-Language、Content-Type（需要注意额外的限制） 、DPR、Downlink、Save-Data、Viewport-Width、Width`<br/> 3、`Content-Type` 的值仅限于下列三者之一。`text/plain、multipart/form-data、application/x-www-form-urlencoded`<br/>4、请求中的任意XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用 [XMLHttpRequest.upload](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/upload) 属性访问。<br/> 5、请求中没有使用 [ReadableStream](https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream) 对象。
预检请求     |1、使用`PUT、DELETE、CONNECT、OPTIONS、TRACE、PATCH` <br/> 2、使用了 简单请求中 第二条之外的字段 <br/>3、`Content-Type`的值不是下列三者之一。`text/plain、multipart/form-data、application/x-www-form-urlencoded`。最常见是`application/json`<br/>4、请求中的XMLHttpRequestUpload 对象注册了任意多个事件监听器。<br/> 5、请求中使用了[ReadableStream](https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream) 对象。

预检请求 和简单请求的区别在于。预检请求 要求必须首先使用 `OPTIONS` 方法发起一个预检请求到服务器，以获知服务器是否允许该实际请求。"预检请求“的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响.

以上整理自 MDN [HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)。


## 具体场景及代码实现
在具体代码实现之前，先来看一下关于跨域问题的响应首部字段含义:

<div style="width:360px"></div> |   含义
---------------|------------------
`Access-Control-Allow-Origin: <origin> | *`   | origin 参数的值指定了允许访问该资源的外域 URI。表示允许来自所有域的请求
`Access-Control-Expose-Headers: X-My-Custom-Header, X-Another-Custom-Header`               |在跨域访问时，前端通过getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。不常用
`Access-Control-Max-Age: <delta-seconds>`     |Access-Control-Max-Age 头指定了preflight请求的结果能够被缓存多久
`Access-Control-Allow-Credentials: true`      |指定了当浏览器的credentials设置为true时是否允许浏览器读取response的内容。注意：简单 GET 请求不会被预检；如果对此类请求的响应中不包含该字段，这个响应将被忽略掉，并且浏览器也不会将相应内容返回给网页
`Access-Control-Allow-Methods: <method>[, <method>]*`|指明了实际请求所允许使用的 HTTP 方法
`Access-Control-Allow-Headers: <field-name>[, <field-name>]*`|指明了实际请求中允许携带的首部字段。


### 简单请求
对于简单请求，其实只需要设置 `Access-Control-Allow-Origin` 为`*`或者指定的域名即可处理。
```js vue.js
export default {
  name: "app",
  methods: {
    /* 简单请求 */
    simpleGet() {
      axios({
        url: "http://localhost:3000/simple-get",
        method: "get",
        params: { message: "此请求为get请求" }
      }).then(res => {
        console.log(res);
      });
    },
    simplePost() {
      const data = new URLSearchParams();
      data.append("message", "此时是post的简单请求");
      axios({
        url: "http://localhost:3000/simple-post",
        method: "post",
        data: data
      }).then(res => {
        console.log(res);
      });
    }
  }
};
```
```js app.js
const http = require('http')
const { URLSearchParams, URL } = require('url')
const querystring = require('querystring');
const serve = http.createServer()
const resloveData = req => {
  let data = "";
  const { method, url } = req
  const { pathname, search } = new URL(url, 'http://localhost:300')
  return new Promise(reslove => {
    switch (method) {
      case "GET":
        data = querystring.parse(search.slice(1))
        reslove({ pathname: pathname, method: method, data: data })
        break;

      case "POST":
        req.on('data', chunk => {
          data += chunk
        })
        req.on('end', () => {
          data = decodeURIComponent(data)
          try {
            data = JSON.parse(data)
          } catch (error) {
            data = querystring.parse(data)
          }
          reslove({ pathname: pathname, method: method, data: data })
        })
        break;

      default:
        reslove({ pathname: pathname, method: method })
    }
  })
}

serve.on('request', async (req, res) => {
  const { pathname, data, method } = await resloveData(req)
  if (pathname === '/simple-get') {
    res.setHeader('Access-Control-Allow-Origin', '*') //设置允许跨域的请求头
    res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
    res.end(JSON.stringify(data))
    return
  }
  if (pathname === '/simple-post') {
    res.setHeader('Access-Control-Allow-Origin', '*') //设置允许跨域的请求头
    res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
    res.end(JSON.stringify(data))
  }
})

serve.listen('3000', function () {
  console.log('🍎 serve is runing......')
})
```
### 预检请求
下面是一个预检请求的例子，我们知道只要使用了`content-type`中除了`text/plain、multipart/form-data、application/x-www-form-urlencoded`之外的定义，那么就是一个复杂请求。`axios`中`post`请求的`Content-Type`默认为`application/json`，即为预检请求。
 
新增代码如下:
```js app.vue
export default{
  methods:{
    /* 新增 */
    preflightPost() {
      const data = {
        message: "此时是一个post的复杂请求会发送预检请求"
      };
      axios({
        url: "http://localhost:3000/preflight-post",
        method: "post",
        data: data
      }).then(res => {
        console.log(res);
      });
    }
  }
}
```
```js app.js
if (pathname == '/preflight-post') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(data))
}
```
此时会出现报错信息如下：
::: danger
Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response
:::
这是因为我们更改了`Content-Type`服务端未进行响应处理。

如果我们自定义了其他的请求头字段(如 `Authorization`) 也会报同样的错误。只需要将对应的字段加入到 `Access-Control-Allow-Headers` 或者设置为`*`或者包含相应的请求头。

服务端应该更改为:
```js
if (pathname == '/preflight-post') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'})
  res.end(JSON.stringify(data))
}
```
其实按照上面的配置之后对于 `options` 请求，服务器默认帮我们处理为返回成功(`options`成功之后才能继续发送复杂请求)，因此不需要显式声明返回所有的`options`请求成功`。可以添加下面的测试代码：
```js
if (pathname == '/preflight-post') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (method === 'OPTIONS') {
    res.status = 200
    res.end('hello world')
  }
  res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' })
  res.end(JSON.stringify(data))
}
```
可以更改`res.end()`接受任何的信息，并不会影响跨域的设置，当然`options`请求的返回值虽然会在浏览器显示，但获取不到。

### 简单请求(携带cookie)
上面的例子中我们都不需要携带`cookie`。而对于跨域请求如果需要携带`cookie`。需要前端声明`withCredentials:true`。新增代码如下
```js vue.js
simpleGetWithCookie() {
  axios({
    url: "http://localhost:3000/simple-with-cookie",
    method: "get",
    params: { message: "此请求为携带cookie的get请求" },
    withCredentials: true
  }).then(res => {
    console.log(res);
  });
},
simplePostWithCookie() {
  const data = new URLSearchParams();
  data.append("message", "此时是post的简单请求");
  axios({
    url: "http://localhost:3000/simple-with-cookie",
    method: "post",
    data: data,
    withCredentials: true
  }).then(res => {
    console.log(res);
  });
},
```
```js app.js
if (pathname === '/simple-with-cookie') {
  res.setHeader('Access-Control-Allow-Origin', '*') //设置允许跨域的请求头
  res.end(JSON.stringify(data))
}
```
:::danger
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'. The credentials mode of requests initiated by the XMLHttpRequest is controlled by the withCredentials attribute
:::
这是因为当我们显式声明跨域携带`cookie`时。服务端响应头`Access-Control-Allow-Origin`不能为`*`,同时服务端也需要显式声明接受`cookie`。更改服务端代码如下即可解决：
```js
if (pathname === '/simple-with-cookie') {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080') //设置允许跨域的请求头
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.end(JSON.stringify(data))
}
```
### 预检请求(携带cookie)
新增代码如下:
```js app.vue
preflightPostWithCookie() {
  const data = {
    message: "此时是一个写到cookie的post的预检请求"
  };
  axios({
    url: "http://localhost:3000/preflight-post-with-cookie",
    method: "post",
    data: data,
    withCredentials:true
  }).then(res => {
    console.log(res);
  });
}
```
```js app.js
if (pathname === '/preflight-post-with-cookie') {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080') //设置允许跨域的请求头
  res.setHeader('Access-Control-Allow-Credentials', true) //  设置携带cookie
  if(res.method==='OPTIONS'){
    res.status = 200
    res.end()
  }
  res.end(JSON.stringify(data))
}
```
::: warning
此处需要注意。携带`cookie`的预检请求在设置时如果将`Access-Control-Allow-Headers`设为`*`是不起作用的，只能显式指定才能生效
:::


## 统一处理和nginx中配置

上面的代码中为了理解方便，在每一个接口中进行跨域的处理。实际上更多的是在接口前进行统一的处理。如下：
```js app.js
serve.on('request', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader('Access-Control-Allow-Credentials', true) //  设置携带cookie
  const { pathname, data, method } = await resloveData(req)
  if (pathname === '/preflight-post-with-cookie') {
    res.end(JSON.stringify(data))
  }
})
```
通常情况下，也不会将跨域设置的写死在后端的代码中，而是通过 `nginx`进行配置。此时的设置和代码中一样。如下:

**注意在`nginx`的配置上必须要添加`always`**。因为`nginx`默认对于`401、500`之类的状态是不添加配置的跨域信息的。因此会导致前端在接口`401、500`之类时获取不到状态码，不能做出正确的判断。
```js
server {
  //... some code
    location / {
      add_header 'Access-Control-Allow-Origin' 'http://localhost:8080' always;
      add_header 'Access-Control-Allow-Credentials' true always;
      add_header 'Access-Control-Allow-Headers' Content-Type always;
      //...some code
    }
}
```


## 源码地址
  以上所有代码[cross-domain](https://github.com/xiaopingbuxiao/demo/tree/master/cross-domain)

<Gitalk></Gitalk>





























