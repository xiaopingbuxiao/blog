module.exports = {
  title: "小平不小",
  description: "一个前端攻城狮的学习笔记",
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
          { text: "Vue", link: "/Vue/observer/object" },
          { text: "JavaScript", link: "/JavaScript/promise" },
          { text: "nodeJS", link: "/nodeJS/" },
        ]
      },
      { text: "关于我们", link: "/about" },
      { text: "GitHub", link: "https://github.com/xiaopingbuxiao" }
    ],
    sidebar: {
      "/JavaScript/": [
        "promise",
        "脚本化http",
        "bind实现",
        "canvas 合成多张图片",
        "composition",
        "从element中学习ResizeObserver",
        "前端也需要了解的生产环境跨域问题"
      ],
      "/Vue/": [
        {
          title:'Vue的响应式',
          path:'/Vue/observer/object',
          collapsable:true,
          sidebarDepth:2,
          children: [
            'observer/object',
            'observer/array',
            'observer/watch',
            'observer/set-delete',
            'observer/computed的实现'
          ]
        },
        {
          title:'Vue的init',
          path:'/Vue/init/extend',
          collapsable:true,
          sidebarDepth:2,
          children: [
            'init/extend',
            'init/Vue选项的合并-上'
          ]
        },
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
