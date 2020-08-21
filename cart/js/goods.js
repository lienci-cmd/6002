class Goods {
  //构造方法
  constructor() {
    this.list();
    //给登录按钮绑定事件
    $('#login').addEventListener('click', this.login);
    //退出
    $('#exit').addEventListener('click', this.exit);
  }
  /****实现商品列表****/
  list () {
    //1发送ajax拿到数据
    ajax.get('./server/goods.php', { fn: 'lst' }).then(res => {
      // console.log(res);
      let { stateCode, data } = JSON.parse(res);
      //2判断状态拿到data
      if (stateCode == 200) {
        //3 循环数据拼接追加
        let str = '';
        data.forEach(ele => {
          str += `<div class="goodsCon"><a target = "_blank" >
          <img src="${ele.goodsImg}" class="icon"><h4 class="title">${ele.goodsName}</h4>
          <div class="info">限时抢购200条</div></a><div class="priceCon">
          <span class="price">￥${ele.price}</span>
          <span class="oldPrice">￥${(ele.price * 1.2).toFixed(2)}</span>
          <div><span class="soldText">已售${ele.num}%</span>
          <span class="soldSpan"><span style="width: 87.12px;">
          </span></span></div>
          <a class="button" target="_blank" onclick="Goods.addCart(${ele.id},1)">立即抢购</a></div></div >`;
        });
        //4 获取divs将数据追加
        $('.divs').innerHTML = str;
      }
    });
  }
  /****数据加入购物车****/
  static addCart (goodsId, goodsNum) {
    //1 判断当前用户是否登录
    if (localStorage.getItem('user')) {//2 登录则存入数据库
      Goods.setDataBase(goodsId, goodsNum);
    } else {//3 没有登录则存入浏览器中
      Goods.setLocal(goodsId, goodsNum);
    }
  }
  /***存数据库的方法*****/
  static setDataBase (goodsId, goodsNum) {
    //1 获取当前用户id
    let userId = localStorage.getItem('userId');
    //2 发送ajax进行存储 
    ajax.post('./server/goods.php?fn=add', { userId: userId, gId: goodsId, gNum: goodsNum }).then(res => {
      console.log(res);
    });
  }
  /***存浏览器的方法*****/
  static setLocal (goodsId, goodsNum) {
    //1 取出local中的数据
    let carts = localStorage.getItem('carts');
    if (carts) {//2 判断是否有数据，存在则判断当前商品是否存在
      // console.log(carts);
      //2-1 转化为对象
      carts = JSON.parse(carts);
      // console.log(carts);
      //2-2 判断当前商品是否存在，存在则增加数量
      for (let gId in carts) {//判断当前循环的商品和添加的商品是否一致
        // console.log(gId)
        if (gId == goodsId) {
          console.log(goodsId)
          goodsNum = carts[gId] - 0 + goodsNum;
        }
      }
      //2-3 不存在就新增，存在就重新给数量
      carts[goodsId] = goodsNum;
      //2-4 存到local
      localStorage.setItem('carts', JSON.stringify(carts));
    } else {//3 没有数据就新增，保存商品id和数量
      let goodsCart = { [goodsId]: goodsNum };
      //3-1 转化为json进行存储
      goodsCart = JSON.stringify(goodsCart);
      localStorage.setItem('carts', goodsCart);
    }
  }


  /****登录的方法****/
  login () {
    //1 发送ajax请求，让后台验证用户名和密码

    //2 验证成功则登录，将用户名保存到浏览器
    localStorage.setItem('user', 'zs');
    localStorage.setItem('userId', 1);
  }
  /****退出的方法****/
  exit () {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }

  /****用户登录后，将浏览器数据添加到数据库中****/
}
new Goods;