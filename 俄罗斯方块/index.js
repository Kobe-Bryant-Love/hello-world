window.addEventListener("load", function () {
  // 常量
  // 定义每次移动的距离，步长
  const STEP = 20;
  // 分割容器
  // 18行，10列
  const ROW_COUNT = 18,
    COL_COUNT = 10;
  // 创建每个模型的数据源
  const MODELS = [
    // 第一个模型数据源（L型）
    {
      0: {
        row: 2,
        col: 0,
      },
      1: {
        row: 2,
        col: 1,
      },
      2: {
        row: 2,
        col: 2,
      },
      3: {
        row: 1,
        col: 2,
      },
    },
    // 第二个模型数据源（凸型）
    {
      0: {
        row: 1,
        col: 1,
      },
      1: {
        row: 0,
        col: 0,
      },
      2: {
        row: 1,
        col: 0,
      },
      3: {
        row: 2,
        col: 0,
      },
    },
    // 第三个模型数据源（田型）
    {
      0: {
        row: 1,
        col: 1,
      },
      1: {
        row: 2,
        col: 1,
      },
      2: {
        row: 1,
        col: 2,
      },
      3: {
        row: 2,
        col: 2,
      },
    },
    // 第四个模型数据源（一型）
    {
      0: {
        row: 0,
        col: 0,
      },
      1: {
        row: 0,
        col: 1,
      },
      2: {
        row: 0,
        col: 2,
      },
      3: {
        row: 0,
        col: 3,
      },
    },
    // 第五个模型数据源（Z型）
    {
      0: {
        row: 1,
        col: 1,
      },
      1: {
        row: 1,
        col: 2,
      },
      2: {
        row: 2,
        col: 2,
      },
      3: {
        row: 2,
        col: 3,
      },
    },
  ];

  // 变量
  // 当前使用的模型
  let currentModel = {};
  let currentX = 0,
    currentY = 0;
  // 记录所有块元素的位置
  // k = 行_列 ：V = 块元素
  var fixedBlocks = {};
  // 定时器
  let mInterval = null;
  // 入口函数
  function init() {
    onKeyDown();
    createModel();
  }
  init();

  // 根据模型的数据源来创建对应的块元素
  function createModel() {
    // 判断游戏是否结束
    if (isGameOver()) {
      gameOver();
      return;
    }
    // 每次创建新的模型都要让16宫格归0
    currentX = 0;
    currentY = 0;
    // 确定当前使用那个模型
    currentModel = MODELS[_.random(0, MODELS.length - 1)];
    // 生成对应数量的块元素
    for (let k in currentModel) {
      let divEle = document.createElement("div");
      divEle.className = "activity_model";
      document.getElementById("container").appendChild(divEle);
    }
    // 定位元素位置
    locationBlocks();
    // 模型自动下落
    autoDown();
  }

  // 根据数据源定位块元素的位置
  function locationBlocks() {
    // 判断是否右越界行为
    checkBound();
    // 1.拿到所有的块元素
    let eles = document.getElementsByClassName("activity_model");
    for (let i = 0; i < eles.length; i++) {
      // 把单个块元素取出来
      let activityModelEle = eles[i];
      // 2.找到每个块元素对应的数据(行，列)
      let blockModel = currentModel[i];
      // 3.根据每个块元素对应的数据来指定块元素的位置 16宫格的位置 + 单个块元素在16宫格中的位置
      activityModelEle.style.top = (currentY + blockModel.row) * STEP + "px";
      activityModelEle.style.left = (currentX + blockModel.col) * STEP + "px";
    }
  }

  // 键盘监听事件
  function onKeyDown() {
    document.onkeydown = function (e) {
      switch (e.keyCode) {
        case 38:
          console.log("上");
          rotate();
          break;
        case 39:
          console.log("右");
          move(1, 0);
          break;
        case 40:
          console.log("下");
          move(0, 1);
          break;
        case 37:
          console.log("左");
          move(-1, 0);
          break;
      }
    };
  }

  // 移动模型
  function move(x, y) {
    // 控制块元素移动
    /*  let activityModelEle = document.getElementsByClassName("activity_model")[0];
    activityModelEle.style.top =
      parseInt(activityModelEle.style.top || 0) + y * STEP + "px";
    activityModelEle.style.left =
      parseInt(activityModelEle.style.left || 0) + x * STEP + "px"; */

    if (isMeet(x + currentX, y + currentY, currentModel)) {
      // 底部的触碰发生在移动16宫格的时候，并且此次移动是因为Y轴的变化而引起的
      if (y !== 0) {
        // 模型之间底部发生触摸
        fixedBottoModel();
      }
      return;
    }

    currentX += x;
    currentY += y;
    locationBlocks();
  }

  // 旋转模型
  function rotate() {
    // 克隆currentModel
    let cloneCurrentModel = _.cloneDeep(currentModel);

    // 算法
    // 旋转后的行 = 旋转前的列；
    // 旋转后的列 = 3 - 旋转前的行
    for (let k in cloneCurrentModel) {
      let blockModel = cloneCurrentModel[k];
      let temp = blockModel.row;
      blockModel.row = blockModel.col;
      blockModel.col = 3 - temp;
    }

    // 如果旋转之后会发生触碰,那么就不需要进行旋转了
    if (isMeet(currentX, currentY, cloneCurrentModel)) {
      return;
    }
    // 接受了这次旋转
    currentModel = cloneCurrentModel;
    locationBlocks();
  }

  // 控制模型只能在容器中移动
  function checkBound() {
    // 定义模型可以活动的边界
    let leftBound = 0,
      rightBound = COL_COUNT,
      bottomBound = ROW_COUNT;
    // 当块元素超出边界
    for (let k in currentModel) {
      // 获取块元素数据
      let blockModel = currentModel[k];
      // 左侧越界
      if (blockModel.col + currentX < leftBound) {
        currentX++;
      }
      // 右侧越界
      if (blockModel.col + currentX >= rightBound) {
        currentX--;
      }
      // 底部越界
      if (blockModel.row + currentY >= bottomBound) {
        currentY--;
        // 把模型固定在底部
        fixedBottoModel();
      }
    }
  }

  // 把模型固定在底部
  function fixedBottoModel() {
    // 1.改变模型中块元素的样式
    // 2.让模型不可以在进行移动
    let activityModelEles = document.getElementsByClassName("activity_model");
    // 这里如果使用正常的遍历方式会出问题，因为JS的特殊机制  每次修改完类名之后就会少获取一个
    // 就会出现只有第1或第3个的块元素会变成灰色，剩余两个则不会变色
    // 所以这里我们才用倒着遍历的方法
    for (let i = activityModelEles.length - 1; i >= 0; i--) {
      // 拿到每个元素
      let activityModelEle = activityModelEles[i];
      // 更改类名
      activityModelEle.className = "fiexd_model";
      // 这里修改类名之后，类名变成了fiexd_model  上面定位获取不到，所以也起到了移动的效果
      // 这里要把在底部的模型记录再变量中
      let blockModel = currentModel[i];
      fixedBlocks[
        currentY + blockModel.row + "_" + (currentX + blockModel.col)
      ] = activityModelEle;
    }
    // 判断一行是否被铺满
    isRemoveLine();
    // 3.创建新的模型
    createModel();
  }

  // 块元素碰撞问题
  // X，Y表示16宫格将要移动到的位置
  // model表示当前模型数据源将要完成的变化
  function isMeet(x, y, model) {
    // 所谓模型之间的触碰，在一个固定的位置已经存在一个被固定的块元素时，那么活动中的模型不可以在占用该位置
    // 判断触碰，就是在判断活动中的模型《将要移动的位置》是否已经存在被固定的模型（块元素）了，如果存在返回true，否则返回false
    for (let k in model) {
      let blockModel = model[k];
      if (fixedBlocks[y + blockModel.row + "_" + (x + blockModel.col)]) {
        return true;
      }
    }
    return false;
  }

  // 判断一行是否被铺满
  function isRemoveLine() {
    // 在一行中，每一列都存在块元素，那么该行就需要被清理了
    // 遍历所有行中的所有列
    // 遍历所有行
    for (let i = 0; i < ROW_COUNT; i++) {
      // 设置一个变量作为开关
      var flag = true;
      // 遍历所有列
      for (let j = 0; j < COL_COUNT; j++) {
        if (!fixedBlocks[i + "_" + j]) {
          flag = false;
          break;
        }
      }
      if (flag) {
        removeLine(i);
      }
    }
  }

  // 清理被铺满的一行
  function removeLine(line) {
    // 遍历该行中所有列
    for (let i = 0; i < COL_COUNT; i++) {
      // 1.删除该行中所有的块元素
      document
        .getElementById("container")
        .removeChild(fixedBlocks[line + "_" + i]);
      // 2.删除该行中所有的块元素的数据源
      fixedBlocks[line + "_" + i] = null;
    }
    downLine(line);
  }

  // 让清理行之上的块元素下落
  function downLine(line) {
    // 遍历被清理行之上的所有行
    for (let i = line - 1; i >= 0; i--) {
      // 该行中的所有列
      for (let j = 0; j < COL_COUNT; j++) {
        if (!fixedBlocks[i + "_" + j]) {
          continue;
        }
        // 存在数据
        // 1.被清理行之上的所有块元素数据源所在的行数 + 1
        fixedBlocks[i + 1 + "_" + j] = fixedBlocks[i + "_" + j];
        // 2.让块元素在容器中的位置下落
        fixedBlocks[i + 1 + "_" + j].style.top = (i + 1) * STEP + "px";
        // 3.清理掉之前的块元素
        fixedBlocks[i + "_" + j] = null;
      }
    }
  }

  // 让模型自动下落
  function autoDown() {
    if (mInterval) {
      clearInterval(mInterval);
    }
    mInterval = setInterval(function () {
      move(0, 1);
    }, 700);
  }

  // 判断游戏结束
  function isGameOver() {
    // 当第0行存在块元素的时候，表示游戏结束
    for (let i = 0; i < COL_COUNT; i++) {
      if (fixedBlocks["0_" + i]) {
        return true;
      }
      return false;
    }
  }

  // 结束掉游戏
  function gameOver() {
    if (mInterval) {
      clearInterval(mInterval);
    }
    alert("大吉大利，今晚吃鸡！");
  }
});
