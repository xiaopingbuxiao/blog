<template>
  <div class="gitalk-container">
    <div id="gitalk-container"></div>
  </div>
</template>
<script>
export default {
  name: 'Gitalk',
  data() {
    return {};
  },
  mounted() {
    let body = document.querySelector('.gitalk-container');
    let script = document.createElement('script');
    let css = document.createElement('link')
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/gitalk/dist/gitalk.css'
    script.src = 'https://unpkg.com/gitalk/dist/gitalk.min.js';
    
    body.appendChild(script);
    script.onload = () => {
      const commentConfig = {
        clientID: '0da8ef2d41db2259826c',
        clientSecret: 'cf3476251e791c5244db5d18575203e39739c5b9',
        repo: 'blog',
        owner: 'xiaopingbuxiao',
        // 这里接受一个数组，可以添加多个管理员
        admin: 'xiaopingbuxiao',
        // id 用于当前页面的唯一标识，一般来讲 pathname 足够了，
        // 但是如果你的 pathname 超过 50 个字符，GitHub 将不会成功创建 issue，此情况可以考虑给每个页面生成 hash 值的方法.
        id: (location.pathname).split('/')[0].slice(0,49),
        distractionFreeMode: false,
      };
      const gitalk = new Gitalk(commentConfig);
      gitalk.render('gitalk-container');
    };
  },
};
</script>
