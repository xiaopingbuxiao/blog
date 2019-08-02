module.exports = {
  title: "小平不小",
  description: "一个野路子前端的学习笔记",
  port: 3000,
  base: "",
  dest: "docs",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }]
  ],
  ga: "UA-139887373-1",
  serviceWorker: true,
  themeConfig: {
    sidebarDepth: 2,
    nav: [
      {
        text: "前端栈",
        items: [
          { text: "Vue", link: "/vue/object" },
          { text: "JavaScript", link: "/JavaScript/脚本化http" },
          { text: "nodeJS", link: "/nodeJS/" },
        ]
      },
      { text: "关于我们", link: "/about" },
      { text: "GitHub", link: "https://github.com/xiaopingbuxiao" }
    ],
    sidebar: {
      "/JavaScript/": [
        "脚本化http",
        "bind实现",
        "canvas 合成多张图片"
      ],
      "/vue/": [
        'object'
      ],
      "/nodeJS": ['']
    }
  },
  displayAllHeaders: true, //显示所有页面的标题链接
  plugins: [
    [
      "@vuepress/register-components",
      {
        componentsDir: "./components"
      }
    ]
  ]
};
