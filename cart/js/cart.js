/****获取购物车数据进行渲染****/
class Cart {
  constructor() {
    this.list();
    //给全选按钮绑定事件
    all('.check-all')[0].addEventListener('click', this.checkAll);
    all('.check-all')[1].addEventListener('click', this.checkAll);
  }
  /***购物车列表*****/
  list () {
    //1 根据登录状态获取商品id
    let userId = localStorage.getItem('userId');
    //声明保存购物车商品id的变量
    let cartGoodsId = '';
    if (userId) {//2 存在则去cart表中获取id
      ajax.get('./server/cart.php', { fn: 'getGoodsId', userId: userId }).then(res => {
        // console.log(res);
        let { data, stateCode } = JSON.parse(res);
        if (stateCode == 200) {
          // console.log(data);
          // 购物车数据为空则停止
          if (!data) return;

          //将商品id和数量，保存为对象
          let cartIdNum = {};
          data.forEach(ele => {
            cartGoodsId += ele.productId + ',';
            cartIdNum[ele.productId] = ele.num;
          });
          //根据id获取商品信息
          // console.log(cartIdNum);
          // console.log(cartGoodsId);

          Cart.getCartGoods(cartGoodsId, cartIdNum);
        }
      });
    } else {//3 未登录去浏览器获取数据
      let cartGoods = localStorage.getItem('carts');
      //3-1 为空则停止
      if (!cartGoods) return;
      cartGoods = JSON.parse(cartGoods);
      // console.log(cartGoods);

      //3-2 循环遍历，获取商品id
      for (let gId in cartGoods) {
        // console.log(gId);
        cartGoodsId += gId + ',';
      }
      // console.log(cartGoodsId);
      Cart.getCartGoods(cartGoodsId);
    }
  }
  /****根据购物车商品id,去商品表获取商品信息*****/
  static getCartGoods (gId, cartIds = '') {
    //如果是登录状态，商品数量从cartIds,未登录从浏览器来
    cartIds = cartIds || JSON.parse(localStorage.getItem('carts'));
    // console.log(cartIds);

    ajax.post('./server/cart.php?fn=lst', { goodsId: gId }).then(res => {
      // console.log(res);
      //1 转化数据获取data
      let { data, stateCode } = JSON.parse(res);
      if (stateCode == 200) {
        let str = '';
        data.forEach(ele => {
          // console.log(ele);
          //将数据循环到页面中
          str += `<tr>
          <td class="checkbox"><input class="check-one check" type="checkbox"/ onclick="Cart.goodsCheck(this)"></td>
          <td class="goods"><img src="${ele.goodsImg}" alt=""/><span>${ele.goodsName}</span></td>
          <td class="price">${ele.price}</td>
          <td class="count">
              <span class="reduce" onclick="Cart.downGoodsNum(this,${ele.id})">-</span>
              <input class="count-input" type="text" value="${cartIds[ele.id]}"/>
              <span class="add" onclick="Cart.addGoodsNum(this,${ele.id})">+</span></td>
          <td class="subtotal">${(ele.price * cartIds[ele.id]).toFixed(2)}</td>
          <td class="operation"><span class="delete" onclick='Cart.delGoods(this,${ele.id})'>删除</span></td>
      </tr>`
        });
        $('tbody').innerHTML = str;
      }
    });
  }
  /******商品的删除*******/
  static delGoods (eleObj, gId) {
    let userId = localStorage.getItem('userId');
    if (userId) {
      ajax.get('./server/cart.php', { fn: 'delete', goodsId: gId, userId: userId }).then(res => {
        console.log(res);
      });
    } else {
      //从浏览器取出购物车数据
      let cartGoods = JSON.parse(localStorage.getItem('carts'));
      // console.log(cartGoods);
      //删除指定的属性
      delete cartGoods[gId];
      // console.log(cartGoods);
      localStorage.setItem('carts', JSON.stringify(cartGoods));
    }
    //把当前商品对应的tr删除
    eleObj.parentNode.parentNode.remove();
    Cart.cpCount();
  }
  /***价格和数量计算*****/
  static cpCount () {
    //1 获取页面中所有的check-one
    let checkOne = all('.check-one');
    //保存选中上面的价格和数量
    let count = 0;
    let xj = 0;
    //2 遍历找出选中的
    checkOne.forEach(ele => {
      if (ele.checked) {
        // console.log(ele);
        //3 找到当前input对应的tr
        let trObj = ele.parentNode.parentNode;
        //4 获取数量和小计
        let tmpCount = trObj.getElementsByClassName('count-input')[0].value;
        let tmpXj = trObj.getElementsByClassName('subtotal')[0].innerHTML;
        // console.log(tmpCount, tmpXj);
        count = tmpCount - 0 + count;
        xj = tmpXj - 0 + xj;
      }
      // console.log(count, xj);
      //5 放到页面中
      $('#selectedTotal').innerHTML = count;
      $('#priceTotal').innerHTML = parseInt(xj * 100) / 100;
    });
  }
  /***数量的增加***/
  static addGoodsNum (eleObj, gId) {
    //1 修改input的数量
    // console.log(eleObj);
    let inputNumObj = eleObj.previousElementSibling;
    // console.log(inputNumObj);
    inputNumObj.value = inputNumObj.value - 0 + 1;

    //2 判断登录状态，修改数据库或浏览器的数量
    if (localStorage.getItem('user')) {
      Cart.updateCart(gId, inputNumObj.value);
    } else {
      Cart.updateLocal(gId, inputNumObj.value);
    }
    //3 实现小计的计算
    //3-1 获取价格的节点
    let priceObj = eleObj.parentNode.previousElementSibling;
    eleObj.parentNode.nextElementSibling.innerHTML = (priceObj.innerHTML * inputNumObj.value).toFixed(2);

    //计算价格和数量
    Cart.cpCount();
  }
  /***cart中数量修改***/
  static updateCart (gId, gNum) {
    let id = localStorage.getItem('userId');
    ajax.get('./server/cart.php', { fn: 'update', goodsId: gId, goodsNum: gNum, userId: id }).then(res => {
      console.log(res);
    });
  }
  /***浏览器中数量修改****/
  static updateLocal (gId, gNum) {
    //取出并转化
    let cartGoods = JSON.parse(localStorage.getItem('carts'));
    //重新赋值
    cartGoods[gId] = gNum;
    localStorage.setItem('carts', JSON.stringify(cartGoods));
  }


  /***数量的减少***/
  static downGoodsNum (eleObj, gId) {
    //1 修改input的数量
    // console.log(eleObj);
    let inputNumObj = eleObj.nextElementSibling;
    // console.log(inputNumObj);
    inputNumObj.value = inputNumObj.value - 0 - 1;
    // 2 判断登录状态,修改数据库或浏览器的数量
    if (localStorage.getItem('user')) {
      Cart.updateCart(gId, inputNumObj.value);
    } else {
      Cart.updateLocal(gId, inputNumObj.value);
    }
    // 3 实现小计的计算
    //  3-1 获取价格的节点
    let priceObj = eleObj.parentNode.previousElementSibling;
    eleObj.parentNode.nextElementSibling.innerHTML = (priceObj.innerHTML * inputNumObj.value).toFixed(2);
    // 计算价格和数量
    Cart.cpCount();
  }

  /***全选的实现****/
  checkAll () {
    // console.log(this);
    //1 实现另一个全选按钮选中或者取消
    let state = this.checked;
    // console.log(state);//true
    all('.check-all')[this.getAttribute('all-key')].checked = this.checked;
    //2 让所有的商品选中
    //2-1 获取单个商品的复选框
    let checkGoods = all('.check-one');
    //2-2 遍历所有商品的单选框设置状态
    checkGoods.forEach(ele => {
      // console.log(ele);
      ele.checked = state;
    });
    //计算价格和数量
    Cart.cpCount();
  }
  /***单选的实现****/
  static goodsCheck (eleObj) {
    // console.log(eleObj);
    let state = eleObj.checked;
    // console.log(state);
    //1 当一件商品取消选中，全选取消
    if (!state) {
      all('.check-all')[0].checked = false;
      all('.check-all')[1].checked = false;
    } else {
      //2 所有单选选中，全选选上
      //2-1 获取所有的单选框
      let checkOne = all('.check-one');
      let len = checkOne.length;
      //2-2 计算选中的单选框
      let checkCount = 0;
      checkOne.forEach(ele => {
        //前面为true,后面执行++
        ele.checked && checkCount++;
      });
      //2-3 单个商品选中的个数，等于len,则全选选中
      if (len == checkCount) {
        all('.check-all')[0].checked = true;
        all('.check-all')[1].checked = true;
      }
    }
    //计算价格和数量
    Cart.cpCount();
  }
}
new Cart;