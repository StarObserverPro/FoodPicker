/*
 * Menu availability policy.
 *
 * Keep the legacy international catalogue intact, but make the default picker
 * China-oriented: all China-region dishes plus a deliberately small set of
 * international fast-food / casual-Western items that are routinely findable
 * in Chinese cities. Future UI can switch back to the full world catalogue by
 * calling FOOD_PICKER_MENU.setMode('international').
 */
(() => {
  if (!Array.isArray(FOODS)) return;

  const fullCatalogue = FOODS.slice();

  const commonInternationalNames = new Set([
    // Italy / common Western casual food
    '意大利肉酱面',
    '奶油培根意面',
    '青酱鸡肉意面',
    '蒜香橄榄油意面',
    '海鲜番茄意面',
    '辣味番茄通心粉',
    '千层面配沙拉',
    '焗通心粉配蔬菜',
    '玛格丽特披萨',
    '意式香肠披萨',
    '火腿蘑菇披萨',
    '四季披萨',
    '白酱鸡肉披萨',
    '帕尼尼三明治',
    '火腿奶酪帕尼尼',
    '意式烤蔬菜三明治',
    '意式肉丸三明治',
    '鸡肉帕尔马三明治',
    '番茄罗勒汤配面包',
    '火腿奶酪法棍',
    '金枪鱼法棍三明治',
    '鸡肉凯撒法棍',
    '可颂火腿奶酪三明治',
    '可颂鸡蛋沙拉三明治',
    '法式烤火腿奶酪三明治',
    '英式炸鱼薯条',
    '德式咖喱香肠配薯条',
    '希腊烤肉卷饼',
    '希腊鸡肉皮塔饼',
    '土耳其烤肉卷',
    '土耳其烤肉饭',
    '鹰嘴豆泥皮塔拼盘',
    '番茄炖蛋配面包',
    '罗马奶酪胡椒意面',
    '经典培根蛋酱意面',
    '意式番茄肉丸面',
    '意式佛卡夏夹烤蔬菜',
    '意式佛卡夏夹火腿奶酪',
    '地中海烤鸡鹰嘴豆碗',

    // US-style fast food and deli food that is commonly available in China
    '经典牛肉汉堡配薯条',
    '芝士汉堡配薯条',
    '培根芝士汉堡',
    '蘑菇瑞士芝士汉堡',
    '辣味鸡肉汉堡',
    '炸鸡三明治配薯条',
    '烤鸡三明治配沙拉',
    '火鸡俱乐部三明治',
    '金枪鱼三明治',
    '花生酱果酱三明治',
    '烤芝士三明治配番茄汤',
    '火腿芝士三明治',
    '牛肉热狗配薯条',
    '玉米热狗配薯角',
    '炸鸡块配薯条',
    '炸鸡配土豆泥和肉汁',
    '通心粉芝士配烤鸡',
    '焗芝士通心粉',
    '鸡肉凯撒沙拉',
    '培根鸡蛋早餐三明治',
    '香肠鸡蛋松饼',
    '纽约披萨切片配沙拉',
    '夏威夷披萨',
    '水牛城鸡翅配芹菜',
    '炸马苏里拉奶酪条配沙拉',
    '墨西哥牛肉塔可',
    '墨西哥鸡肉塔可',
    '墨西哥炸鱼塔可',
    '牛肉卷饼',
    '鸡肉卷饼',
    '豆泥芝士卷饼',
    '墨西哥饭碗',
    '鸡肉法希塔饭碗',
    '奶酪夹饼',
    '鸡肉奶酪夹饼',
    '墨西哥玉米片拼盘',
    '加拿大肉汁奶酪薯条',
    '照烧鸡肉美式饭碗',
    '快餐鸡肉卷套餐',
    '快餐鱼柳汉堡套餐',
    '快餐双层芝士汉堡套餐',
    '快餐炸鸡桶配薯条',
    '便利店热狗加沙拉',
    '超市烤鸡三明治套餐',
    '午餐肉芝士三明治',
    '火腿鸡蛋早餐卷',
    '牛肉奶酪早餐卷',
    '黑豆玉米素食卷饼',
    '美式鸡柳配薯条',
    '纽约培根鸡蛋芝士贝果',
    '田纳西辣炸鸡三明治',
    '纳什维尔辣鸡柳配薯条',
    '加州鸡肉牛油果三明治',
    '墨西哥烤肉碗配黑豆',
    '烤蔬菜黑豆饭碗',
    '玉米藜麦牛油果碗',
    '烤鸡甜薯谷物碗'
  ]);

  const chinaDefault = fullCatalogue.filter(meal =>
    meal.region === '中国' || commonInternationalNames.has(meal.name)
  );

  const pools = Object.freeze({
    china: Object.freeze(chinaDefault.slice()),
    international: Object.freeze(fullCatalogue.slice())
  });

  const setMode = mode => {
    const next = mode === 'international' ? pools.international : pools.china;
    FOODS.splice(0, FOODS.length, ...next);
    return FOODS;
  };

  window.FOOD_PICKER_MENU = Object.freeze({
    pools,
    setMode,
    isChinaDefault: meal => meal?.region === '中国' || commonInternationalNames.has(meal?.name),
    counts: Object.freeze({
      china: pools.china.length,
      international: pools.international.length,
      internationalOnly: pools.international.length - pools.china.length
    })
  });

  setMode('china');
})();
