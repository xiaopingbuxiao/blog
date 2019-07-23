<template>
  <div class="container">
    <div class="desc-box">
      <div class="desc-name">
        <img :src="avatar" />
      </div>
      <div class="desc-text">
        <p>
          <span>大名：</span>pingjinhuo
        </p>
        <p>
          <span>小名：</span>xiaopingbuxiao
        </p>
        <p>
          <span>职业：</span>前端工程师
        </p>
        <p>
          <span>求职：</span>如果你能提供一份上海不错的前端岗位机会，
          <a target="_blank" href="mailto:1210774823@qq.com">可以联系我的邮箱</a>
        </p>
        <p>
          <a target="_blank" href="https://github.com/xiaopingbuxiao">Github</a>
          <a target="_blank" href="https://juejin.im/user/5b6ac7b8f265da0f955cf7bd">掘金</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import avatar from "../public/avatar.jpeg";
export default {
  data() {
    return {
      avatar: avatar
    };
  }
};
</script>

<style>
.container {
  width: 960px;
  padding: 40px 0;
  margin-left: -110px;
}
@media (max-width: 1000px) {
  .container {
    width: 100%;
    margin-left: 0;
  }
}

.container .desc-box {
  display: flex;
  align-items: center;
  padding: 20px;
  box-shadow: 0 2px 10px 0 #e3e7f6;
  border-radius: 4px;
}

.container .desc-box:not(:last-child) {
  margin-bottom: 40px;
}

.container .desc-box .desc-name {
  width: 100px;
  margin-right: 20px;
  padding: 20px;
  text-align: center;
  border-right: 1px solid #e4e4e4;
}
.container .desc-box .desc-name img {
  width: 60px;
  height: 60px;
  border-radius: 30px;
}
.container .desc-box .desc-text p {
  margin: 5px;
}
</style>
