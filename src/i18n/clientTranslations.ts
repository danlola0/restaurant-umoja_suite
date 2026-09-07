export type AppLocale = 'fr' | 'en' | 'zh';

export const LOCALE_STORAGE_KEY = 'umoja-client-locale';

const categoryNames: Record<string, Record<AppLocale, string>> = {
  'Spécialités Umoja': { fr: 'Spécialités Umoja', en: 'Umoja Specials', zh: 'Umoja 招牌' },
  'Grillades & Viandes': { fr: 'Grillades & Viandes', en: 'Grill & Meat', zh: '烧烤与肉类' },
  'Poissons & Fruits de Mer': { fr: 'Poissons & Fruits de Mer', en: 'Fish & Seafood', zh: '鱼类与海鲜' },
  'Accompagnements': { fr: 'Accompagnements', en: 'Sides', zh: '配菜' },
  'Boissons Fraîches': { fr: 'Boissons Fraîches', en: 'Fresh Drinks', zh: '清凉饮品' },
  'Desserts & Douceurs': { fr: 'Desserts & Douceurs', en: 'Desserts', zh: '甜品' },
};

export const translations = {
  fr: {
    welcomeTitle: 'Bienvenue à table, chez Umoja',
    welcomeKicker: 'Table ouverte · Saveurs du soir',
    welcomeSubtitle: 'Braises, sauces veloutées et assiettes généreuses : composez votre moment, on s’occupe du feu.',
    clientSpace: 'Espace Client',
    yourTable: 'Votre table',
    cart: 'Panier',
    staffArea: 'Espace personnel',
    staffClock: 'Pointage Personnel',
    liveMenu: 'Carte en direct, à votre rythme',
    menuTitle: 'La carte Umoja',
    menuSubtitle: 'Grillades au feu de bois, classiques congolais et assiettes du jour — touchez un plat pour le savourer en détail.',
    viewCart: 'Voir la commande',
    viewPlate: 'Voir mon plateau',
    featuredTonight: 'À la une ce soir',
    favorite: 'Coup de cœur',
    viewDish: 'Voir l’assiette',
    orderNow: 'Je commande',
    prevImage: 'Image précédente',
    nextImage: 'Image suivante',
    goToDish: 'Aller au plat',
    searchPlaceholder: 'Une envie ? Poulet, fumbwa, frites…',
    chefSelection: 'Sélection du chef',
    allMenu: 'Toute la carte',
    noDish: 'Aucun plat ne correspond à cette recherche',
    tryAnother: 'Essayez un autre mot, ou revenez à toute la carte.',
    showMenuAgain: 'Réafficher la carte',
    add: 'Ajouter',
    addToCart: 'Ajouter au panier',
    chefsChoice: 'Choix du chef',
    nouveau: 'Nouveau',
    populaire: 'Populaire',
    soldOut: 'Épuisé',
    readyToSend: 'Prêt à envoyer',
    validateOrder: 'Valider',
    orderSent: 'Commande envoyée en cuisine',
    orderSentHint: 'On prépare votre assiette. Suivi en direct ci-dessous.',
    yourPlate: 'Votre plateau',
    flavorsReady: 'saveur(s) prête(s) à partir',
    plateEmpty: 'Votre plateau est encore vide',
    plateEmptyHint: 'Choisissez un plat qui vous fait de l’œil : un tap, et il rejoint votre commande.',
    perUnit: 'l’unité',
    forWhom: 'Pour qui est cette table ?',
    optional: 'optionnel',
    wordForService: 'Un mot pour le service',
    subtotal: 'Sous-total',
    dishes: 'plats',
    service: 'Service',
    included: 'Inclus',
    total: 'Total',
    tableTotal: 'Total de votre table',
    sendingKitchen: 'Envoi vers les fourneaux…',
    sendKitchen: 'Envoyer en cuisine',
    tapHint: 'Un tap, et la cuisine Umoja s’en occupe. Vous suivez la préparation en direct.',
    howYouLike: 'Comment le voulez-vous ?',
    addedToPlate: 'Ajouté au plateau',
    unavailable: 'Indisponible pour l’instant',
    noSpice: 'Sans piment',
    spiceAside: 'Piment à part',
    wellDone: 'Bien cuit / Très croustillant',
    sauceAside: 'Sauce à part',
    noOnion: 'Sans oignons',
    notesPlaceholder: 'Allergies, cuisson, sauce à part…',
    tableArriving: 'Votre table arrive',
    tableArrivingHint: 'La sélection de table s’affichera dès que la salle est prête.',
    nothingInKitchen: 'Encore rien en cuisine pour',
    nothingHint: 'Feuilletez la carte ci-dessous : dès que vous envoyez, le suivi s’allume ici.',
    liveOrder: 'Votre commande, en direct',
    passages: 'passage(s) vers les fourneaux',
    callService: 'Appeler le service',
    requestBill: 'L’addition, s’il vous plaît',
    stepReceived: 'Reçue',
    stepAccepted: 'Acceptée',
    stepCooking: 'En Préparation',
    stepReady: 'Prête',
    stepServed: 'Servie',
    placedAt: 'Passée à',
    onTheWay: 'En cours d\'acheminement à votre table',
    inKitchen: 'En cuisine',
    served: 'Servie',
    waiting: 'En attente de prise en charge',
    tableNotSelected: 'Table non sélectionnée',
    orderFailed: 'La commande n’a pas pu être enregistrée.',
    spicyLight: 'Légèrement épicé',
    spicyMed: 'Épicé',
    spicyHot: 'Très relevé',
    language: 'Langue',
  },
  en: {
    welcomeTitle: 'Welcome to the table, at Umoja',
    welcomeKicker: 'Open table · Evening flavours',
    welcomeSubtitle: 'Embers, velvet sauces and generous plates: compose your moment, we tend the fire.',
    clientSpace: 'Guest area',
    yourTable: 'Your table',
    cart: 'Cart',
    staffArea: 'Staff area',
    staffClock: 'Staff clock-in',
    liveMenu: 'Live menu, at your pace',
    menuTitle: 'The Umoja menu',
    menuSubtitle: 'Wood-fire grills, Congolese classics and today’s plates — tap a dish to see it in detail.',
    viewCart: 'View order',
    viewPlate: 'View my tray',
    featuredTonight: 'Tonight’s highlights',
    favorite: 'Staff favourite',
    viewDish: 'View the dish',
    orderNow: 'Order now',
    prevImage: 'Previous image',
    nextImage: 'Next image',
    goToDish: 'Go to dish',
    searchPlaceholder: 'Craving something? Chicken, fumbwa, fries…',
    chefSelection: 'Chef’s selection',
    allMenu: 'Full menu',
    noDish: 'No dish matches this search',
    tryAnother: 'Try another word, or go back to the full menu.',
    showMenuAgain: 'Show the menu again',
    add: 'Add',
    addToCart: 'Add to cart',
    chefsChoice: 'Chef’s choice',
    nouveau: 'New',
    populaire: 'Popular',
    soldOut: 'Sold out',
    readyToSend: 'Ready to send',
    validateOrder: 'Confirm',
    orderSent: 'Order sent to the kitchen',
    orderSentHint: 'We are preparing your plate. Live tracking below.',
    yourPlate: 'Your tray',
    flavorsReady: 'item(s) ready to go',
    plateEmpty: 'Your tray is still empty',
    plateEmptyHint: 'Pick a dish that catches your eye: one tap and it joins your order.',
    perUnit: 'each',
    forWhom: 'Who is this table for?',
    optional: 'optional',
    wordForService: 'A note for the team',
    subtotal: 'Subtotal',
    dishes: 'dishes',
    service: 'Service',
    included: 'Included',
    total: 'Total',
    tableTotal: 'Table total',
    sendingKitchen: 'Sending to the kitchen…',
    sendKitchen: 'Send to kitchen',
    tapHint: 'One tap, and Umoja’s kitchen takes over. Track the cooking live.',
    howYouLike: 'How would you like it?',
    addedToPlate: 'Added to tray',
    unavailable: 'Unavailable for now',
    noSpice: 'No chilli',
    spiceAside: 'Chilli on the side',
    wellDone: 'Well done / Extra crispy',
    sauceAside: 'Sauce on the side',
    noOnion: 'No onions',
    notesPlaceholder: 'Allergies, cooking, sauce on the side…',
    tableArriving: 'Your table is coming',
    tableArrivingHint: 'Table selection will appear when the room is ready.',
    nothingInKitchen: 'Nothing in the kitchen yet for',
    nothingHint: 'Browse the menu below: as soon as you send, tracking lights up here.',
    liveOrder: 'Your order, live',
    passages: 'order(s) to the kitchen',
    callService: 'Call service',
    requestBill: 'The bill, please',
    stepReceived: 'Received',
    stepAccepted: 'Accepted',
    stepCooking: 'Cooking',
    stepReady: 'Ready',
    stepServed: 'Served',
    placedAt: 'Placed at',
    onTheWay: 'On the way to your table',
    inKitchen: 'In the kitchen',
    served: 'Served',
    waiting: 'Waiting to be taken',
    tableNotSelected: 'No table selected',
    orderFailed: 'The order could not be saved.',
    spicyLight: 'Mildly spicy',
    spicyMed: 'Spicy',
    spicyHot: 'Very spicy',
    language: 'Language',
  },
  zh: {
    welcomeTitle: '欢迎来到 Umoja 餐桌',
    welcomeKicker: '餐桌已开 · 夜味正浓',
    welcomeSubtitle: '炭火、醇厚酱汁与丰盛菜肴：您点单，我们掌火。',
    clientSpace: '宾客区',
    yourTable: '您的餐桌',
    cart: '购物车',
    staffArea: '员工入口',
    staffClock: '员工打卡',
    liveMenu: '实时菜单，随心点选',
    menuTitle: 'Umoja 菜单',
    menuSubtitle: '炭火烧烤、刚果经典与当日菜品 — 点击菜品查看详情。',
    viewCart: '查看订单',
    viewPlate: '查看托盘',
    featuredTonight: '今晚主推',
    favorite: '人气推荐',
    viewDish: '查看菜品',
    orderNow: '立即下单',
    prevImage: '上一张',
    nextImage: '下一张',
    goToDish: '查看该菜',
    searchPlaceholder: '想吃什么？鸡肉、富姆瓦、薯条…',
    chefSelection: '主厨精选',
    allMenu: '全部菜单',
    noDish: '没有符合搜索的菜品',
    tryAnother: '换个关键词，或返回全部菜单。',
    showMenuAgain: '重新显示菜单',
    add: '添加',
    addToCart: '加入购物车',
    chefsChoice: '主厨推荐',
    nouveau: '新品',
    populaire: '热门',
    soldOut: '售罄',
    readyToSend: '准备发送',
    validateOrder: '确认',
    orderSent: '订单已发送至厨房',
    orderSentHint: '正在为您备餐。下方可实时跟踪。',
    yourPlate: '您的托盘',
    flavorsReady: '道菜已准备好',
    plateEmpty: '托盘还是空的',
    plateEmptyHint: '选一道心动的菜：点一下即可加入订单。',
    perUnit: '单价',
    forWhom: '这桌是给谁的？',
    optional: '选填',
    wordForService: '给服务台留言',
    subtotal: '小计',
    dishes: '道菜',
    service: '服务费',
    included: '已含',
    total: '合计',
    tableTotal: '本桌合计',
    sendingKitchen: '正在发送到厨房…',
    sendKitchen: '发送到厨房',
    tapHint: '轻轻一点，Umoja 厨房接手。您可实时跟踪烹饪。',
    howYouLike: '您希望怎么做？',
    addedToPlate: '已加入托盘',
    unavailable: '暂时无法供应',
    noSpice: '不要辣椒',
    spiceAside: '辣椒另上',
    wellDone: '全熟 / 更脆',
    sauceAside: '酱汁另上',
    noOnion: '不要洋葱',
    notesPlaceholder: '过敏、火候、酱汁另上等…',
    tableArriving: '正在准备您的餐桌',
    tableArrivingHint: '厅房就绪后即可选择餐桌。',
    nothingInKitchen: '厨房暂无订单：',
    nothingHint: '浏览下方菜单：发送后即可在此跟踪。',
    liveOrder: '订单实时跟踪',
    passages: '份订单已发往厨房',
    callService: '呼叫服务',
    requestBill: '请结账',
    stepReceived: '已收到',
    stepAccepted: '已接单',
    stepCooking: '烹饪中',
    stepReady: '已出餐',
    stepServed: '已上桌',
    placedAt: '下单时间',
    onTheWay: '正在送往您的餐桌',
    inKitchen: '厨房制作中',
    served: '已上桌',
    waiting: '等待接单',
    tableNotSelected: '未选择餐桌',
    orderFailed: '订单未能保存。',
    spicyLight: '微辣',
    spicyMed: '辣',
    spicyHot: '特辣',
    language: '语言',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

export function translateCategoryName(name: string, locale: AppLocale): string {
  return categoryNames[name]?.[locale] ?? name;
}

type DishCopy = {
  name: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
};

const dishCatalog: { keys: string[]; copy: DishCopy }[] = [
  {
    keys: ['Frites Dorées Croustillantes', 'Frites Dorees Croustillantes', 'Frites'],
    copy: {
      name: { fr: 'Frites Dorées Croustillantes', en: 'Golden crispy fries', zh: '金黄脆薯条' },
      description: {
        fr: 'Portion généreuse de frites de pommes de terre fraîches, découpées et dorées à l’huile végétale pure, légèrement salées.',
        en: 'Generous portion of fresh-cut potatoes, fried golden in pure vegetable oil and lightly salted.',
        zh: '大份新鲜土豆条，植物油炸至金黄，微咸酥脆。',
      },
    },
  },
  {
    keys: ['Travers de Porc Croustillants', 'Travers de porc'],
    copy: {
      name: { fr: 'Travers de Porc Croustillants', en: 'Crispy pork ribs', zh: '酥脆猪肋排' },
      description: {
        fr: 'Côtes et travers de porc dorés à la perfection, marinés avec ail, gingembre et épices traditionnelles.',
        en: 'Pork ribs grilled golden, marinated with garlic, ginger and traditional spices.',
        zh: '猪肋排烤至金黄，以蒜、姜与传统香料腌制。',
      },
    },
  },
  {
    keys: ['Fumbwa Traditionnel aux Arachides', 'Fumbwa'],
    copy: {
      name: { fr: 'Fumbwa Traditionnel aux Arachides', en: 'Traditional fumbwa with peanuts', zh: '花生风味富姆瓦' },
      description: {
        fr: 'Feuilles sauvages de Fumbwa finement découpées, mijotées à la pâte d’arachide pure, poisson fumé et piment jaune parfumé.',
        en: 'Finely chopped wild fumbwa leaves simmered with peanut paste, smoked fish and fragrant yellow chilli.',
        zh: '细切野生富姆瓦叶，配花生酱、熏鱼与黄辣椒慢炖。',
      },
    },
  },
  {
    keys: ['Poulet Braisé aux Citrons Verts', 'Poulet Braise aux Citrons Verts', 'Poulet braisé'],
    copy: {
      name: { fr: 'Poulet Braisé aux Citrons Verts', en: 'Braised chicken with lime', zh: '青柠炭火鸡' },
      description: {
        fr: 'Cuisses et blancs de poulet fermier marinés aux herbes et jus de citron vert, grillés au feu de braise avec graines de sésame.',
        en: 'Farm chicken marinated with herbs and lime, grilled over embers with sesame seeds.',
        zh: '农家鸡腿与鸡胸，香草青柠腌制，炭火烤制，点缀芝麻。',
      },
    },
  },
  {
    keys: ['Ngombe ya Sauce (Ragoût de Bœuf)', 'Ngombe ya Sauce', 'Viande de boeuf', 'Viande de bœuf', 'VIANDE DE BOEUF', 'Ragoût de Bœuf', 'Ragout de Boeuf'],
    copy: {
      name: { fr: 'Ngombe ya Sauce (Ragoût de Bœuf)', en: 'Beef stew (ngombe ya sauce)', zh: '牛肉炖菜（Ngombe）' },
      description: {
        fr: 'Morceaux tendres de bœuf de premier choix mijotés lentement dans une sauce onctueuse aux oignons, tomates et feuilles de laurier.',
        en: 'Tender prime beef slowly simmered in a silky sauce of onions, tomatoes and bay leaves.',
        zh: '精选嫩牛肉，配洋葱、番茄与月桂叶慢炖成浓郁酱汁。',
      },
    },
  },
  {
    keys: ['Madesu ya Lobi (Haricots Mijotés)', 'Madesu ya Lobi', 'Haricots Mijotés'],
    copy: {
      name: { fr: 'Madesu ya Lobi (Haricots Mijotés)', en: 'Slow-cooked beans (madesu ya lobi)', zh: '慢炖红豆（Madesu）' },
      description: {
        fr: 'Haricots rouges fondants cuits avec aromates, légumes verts et sauce tomate réduite selon la tradition kinsheoise.',
        en: 'Melt-in-the-mouth red beans cooked with aromatics, greens and reduced tomato sauce, Kinshasa style.',
        zh: '红豆配香料、绿叶菜与浓缩番茄酱，金沙萨传统做法。',
      },
    },
  },
  {
    keys: ['Riz Blanc Parfumé Vapeur', 'Riz Blanc Parfume Vapeur', 'Riz blanc'],
    copy: {
      name: { fr: 'Riz Blanc Parfumé Vapeur', en: 'Fragrant steamed white rice', zh: '清香白米饭' },
      description: {
        fr: 'Bol de riz blanc grains longs cuit à la vapeur, léger et garni de brins de coriandre fraîche.',
        en: 'Bowl of long-grain white rice, steamed light and finished with fresh coriander.',
        zh: '长粒白米蒸制，清淡适口，点缀新鲜香菜。',
      },
    },
  },
  {
    keys: ['Pondu / Saka-Saka Traditionnel', 'Pondu', 'Saka-Saka', 'Saka Saka'],
    copy: {
      name: { fr: 'Pondu / Saka-Saka Traditionnel', en: 'Traditional pondu / saka-saka', zh: '木薯叶（Pondu / Saka-saka）' },
      description: {
        fr: 'Feuilles de manioc pilées au mortier, mijotées à l’huile de palme raffinée, aubergines locales et poisson fumé.',
        en: 'Cassava leaves pounded in a mortar, simmered with refined palm oil, local eggplant and smoked fish.',
        zh: '木薯叶捣碎，棕榈油慢炖，配本地茄子与熏鱼。',
      },
    },
  },
  {
    keys: ['Makemba (Bananes Plantains Frites)', 'Makemba', 'Bananes Plantains Frites'],
    copy: {
      name: { fr: 'Makemba (Bananes Plantains Frites)', en: 'Makemba (fried plantains)', zh: '炸大蕉（Makemba）' },
      description: {
        fr: 'Tranches de bananes plantains mûres frites dorées, croustillantes à l’extérieur et douces à l’intérieur.',
        en: 'Ripe plantain slices fried golden — crisp outside, soft and sweet inside.',
        zh: '熟大蕉切片炸至金黄，外脆内软甜。',
      },
    },
  },
  {
    keys: ['Fufu Chaud Traditionnel (Manioc & Maïs)', 'Fufu Chaud Traditionnel', 'Fufu'],
    copy: {
      name: { fr: 'Fufu Chaud Traditionnel (Manioc & Maïs)', en: 'Hot traditional fufu (cassava & maize)', zh: '热富富（木薯与玉米）' },
      description: {
        fr: 'Boules de fufu faites à la minute avec farine de manioc et maïs, lisses, chaudes et sans grumeaux.',
        en: 'Fufu balls made to order with cassava and maize flour — smooth, hot, no lumps.',
        zh: '现做富富团，木薯与玉米粉制成，细滑热乎、无颗粒。',
      },
    },
  },
  {
    keys: [
      'Matumbo (Tripes de Bœuf en Sauce)',
      'Matumbo',
      'Tripes de Bœuf',
      'LE TRIPE DE BOEUF OU MABUMU',
      'Le tripe de boeuf ou mabumu',
      'Tripe de boeuf',
      'Mabumu',
    ],
    copy: {
      name: { fr: 'Matumbo (Tripes de Bœuf en Sauce)', en: 'Beef tripe in sauce (matumbo / mabumu)', zh: '牛肉肚（Matumbo / Mabumu）' },
      description: {
        fr: 'Tripes de bœuf nettoyées avec minutie et mijotées avec poivrons, tomates mûres, ail et piment rouge.',
        en: 'Carefully cleaned beef tripe simmered with peppers, ripe tomatoes, garlic and red chilli.',
        zh: '精洗牛肚，配甜椒、熟番茄、蒜与红辣椒慢炖。',
      },
    },
  },
  {
    keys: ['Poisson Poêlé aux Poivrons & Piment', 'Poisson Poele aux Poivrons', 'Poisson poêlé'],
    copy: {
      name: { fr: 'Poisson Poêlé aux Poivrons & Piment', en: 'Pan-fried fish with peppers & chilli', zh: '彩椒辣椒煎鱼' },
      description: {
        fr: 'Pavés de poisson savoureux cuisinés avec poivrons croquants jaunes et rouges, oignons et piment entier.',
        en: 'Tasty fish steaks cooked with crunchy yellow and red peppers, onions and whole chilli.',
        zh: '鲜美鱼排，配黄红甜椒、洋葱与整颗辣椒烹制。',
      },
    },
  },
  {
    keys: ['Jus Naturel Tangawisi (Gingembre & Ananas)', 'Jus Naturel Tangawisi', 'Tangawisi'],
    copy: {
      name: { fr: 'Jus Naturel Tangawisi (Gingembre & Ananas)', en: 'Tangawisi juice (ginger & pineapple)', zh: '姜菠萝汁（Tangawisi）' },
      description: {
        fr: 'Bouteille de 50cl de jus de gingembre frais pressé avec ananas mûr et une touche de menthe.',
        en: '50cl bottle of freshly pressed ginger juice with ripe pineapple and a hint of mint.',
        zh: '50厘升鲜榨姜汁，配成熟菠萝与少许薄荷。',
      },
    },
  },
  {
    keys: ['Jus de Folere / Bissap Maison', 'Jus de Folere', 'Bissap Maison', 'Bissap'],
    copy: {
      name: { fr: 'Jus de Folere / Bissap Maison', en: 'House folere / bissap juice', zh: '洛神花汁（Bissap）' },
      description: {
        fr: 'Infusion fraîche de fleurs d’hibiscus avec arôme vanille et feuilles de menthe fraîches.',
        en: 'Chilled hibiscus infusion with vanilla aroma and fresh mint leaves.',
        zh: '洛神花冷泡，香草风味，点缀新鲜薄荷。',
      },
    },
  },
  {
    keys: ['Bière Primus Bralima 65cl', 'Biere Primus Bralima 65cl', 'Primus'],
    copy: {
      name: { fr: 'Bière Primus Bralima 65cl', en: 'Primus Bralima beer 65cl', zh: 'Primus 啤酒 65厘升' },
      description: {
        fr: 'La grande bouteille fraîche servie au seau avec verres glacés.',
        en: 'Large cold bottle served in a bucket with iced glasses.',
        zh: '大瓶冰镇啤酒，冰桶配冰杯上桌。',
      },
    },
  },
  {
    keys: ['Eau Minérale Swissta 1.5L', 'Eau Minerale Swissta', 'Swissta'],
    copy: {
      name: { fr: 'Eau Minérale Swissta 1.5L', en: 'Swissta mineral water 1.5L', zh: 'Swissta 矿泉水 1.5升' },
      description: {
        fr: 'Bouteille d’eau pure et fraîche.',
        en: 'Bottle of pure, chilled water.',
        zh: '纯净冰镇矿泉水。',
      },
    },
  },
  {
    keys: ['Beignets Mikate Moelleux (Portion de 5)', 'Beignets Mikate Moelleux', 'Mikate'],
    copy: {
      name: { fr: 'Beignets Mikate Moelleux (Portion de 5)', en: 'Soft mikate doughnuts (set of 5)', zh: '松软米卡特炸糕（5个）' },
      description: {
        fr: 'Beignets traditionnels dorés, croustillants à l’extérieur et moelleux à souhait, saupoudrés de sucre fin.',
        en: 'Traditional doughnuts, golden and crisp outside, soft inside, dusted with fine sugar.',
        zh: '传统炸糕，外酥内软，撒细砂糖。',
      },
    },
  },
  {
    keys: ['Coupe de Fruits Tropicaux Frais', 'Fruits Tropicaux'],
    copy: {
      name: { fr: 'Coupe de Fruits Tropicaux Frais', en: 'Fresh tropical fruit cup', zh: '新鲜热带水果杯' },
      description: {
        fr: 'Assortiment de mangue, papaye mûre, ananas victoria et fruit de la passion.',
        en: 'Assortment of mango, ripe papaya, Victoria pineapple and passion fruit.',
        zh: '芒果、熟木瓜、菠萝与百香果拼盘。',
      },
    },
  },
  {
    keys: ['MATEMBELE'],
    copy: {
      name: { fr: 'MATEMBELE', en: 'Sweet potato leaves (matembela)', zh: '番薯叶（Matembela）' },
      description: {
        fr: 'Feuilles de patate douce mijotées à la congolaise.',
        en: 'Sweet potato leaves simmered the Congolese way.',
        zh: '刚果风味慢炖番薯叶。',
      },
    },
  },
  {
    keys: ['FUFU'],
    copy: {
      name: { fr: 'FUFU', en: 'Fufu', zh: '富富' },
      description: {
        fr: 'Fufu traditionnel, chaud et lisse.',
        en: 'Traditional fufu, hot and smooth.',
        zh: '传统富富，热乎细滑。',
      },
    },
  },
  {
    keys: ['POISSON SALE OU LIKAYABU', 'Poisson salé ou likayabu', 'Likayabu', 'Makayabu', 'Poisson salé'],
    copy: {
      name: { fr: 'POISSON SALE OU LIKAYABU', en: 'Salted fish (likayabu)', zh: '咸鱼（Likayabu）' },
      description: {
        fr: 'Poisson salé (likayabu / makayabu) préparé à la congolaise.',
        en: 'Salted fish (likayabu / makayabu) cooked the Congolese way.',
        zh: '刚果风味咸鱼（Likayabu / Makayabu）。',
      },
    },
  },
  {
    keys: ['LE TRIPE DE BOEUF OU  MABUMU', 'LE TRIPE DE BOEUF OU MABUMU'],
    copy: {
      name: { fr: 'LE TRIPE DE BOEUF OU MABUMU', en: 'Beef tripe (mabumu)', zh: '牛肉肚（Mabumu）' },
      description: {
        fr: 'Tripes de bœuf en sauce, aussi appelées mabumu.',
        en: 'Beef tripe in sauce, also called mabumu.',
        zh: '酱汁牛肚，又称 Mabumu。',
      },
    },
  },
  {
    keys: ['VIANDE DE BOEUF'],
    copy: {
      name: { fr: 'VIANDE DE BOEUF', en: 'Beef', zh: '牛肉' },
      description: {
        fr: 'Viande de bœuf mijotée.',
        en: 'Slow-cooked beef.',
        zh: '慢炖牛肉。',
      },
    },
  },
  {
    keys: ['RIZ'],
    copy: {
      name: { fr: 'RIZ', en: 'Rice', zh: '米饭' },
      description: {
        fr: 'Riz nature.',
        en: 'Plain rice.',
        zh: '白米饭。',
      },
    },
  },
  {
    keys: ['BANANE PLANTAIN'],
    copy: {
      name: { fr: 'BANANE PLANTAIN', en: 'Plantain', zh: '大蕉' },
      description: {
        fr: 'Bananes plantains.',
        en: 'Plantains.',
        zh: '大蕉。',
      },
    },
  },
  {
    keys: ['CUISSE'],
    copy: {
      name: { fr: 'CUISSE', en: 'Chicken thigh', zh: '鸡腿' },
      description: {
        fr: 'Cuisse de poulet.',
        en: 'Chicken thigh.',
        zh: '鸡腿。',
      },
    },
  },
  {
    keys: ['VIANDE DE PORC OU MIPANZI', 'Mipanzi'],
    copy: {
      name: { fr: 'VIANDE DE PORC OU MIPANZI', en: 'Pork (mipanzi)', zh: '猪肉（Mipanzi）' },
      description: {
        fr: 'Viande de porc, aussi appelée mipanzi.',
        en: 'Pork, also called mipanzi.',
        zh: '猪肉，又称 Mipanzi。',
      },
    },
  },
  {
    keys: ['FEUILLE DE MANIOC AUX HARICOTS OU PONDU MADESU', 'Pondu Madesu'],
    copy: {
      name: { fr: 'FEUILLE DE MANIOC AUX HARICOTS OU PONDU MADESU', en: 'Cassava leaves with beans (pondu madesu)', zh: '木薯叶配豆子（Pondu Madesu）' },
      description: {
        fr: 'Feuilles de manioc mijotées avec des haricots.',
        en: 'Cassava leaves simmered with beans.',
        zh: '木薯叶与豆子同炖。',
      },
    },
  },
  {
    keys: ['GOMBO'],
    copy: {
      name: { fr: 'GOMBO', en: 'Okra (gombo)', zh: '秋葵（Gombo）' },
      description: {
        fr: 'Gombo préparé à la congolaise.',
        en: 'Okra cooked the Congolese way.',
        zh: '刚果风味秋葵。',
      },
    },
  },
  {
    keys: ['POULET'],
    copy: {
      name: { fr: 'POULET', en: 'Chicken', zh: '鸡肉' },
      description: {
        fr: 'Poulet préparé maison.',
        en: 'House-prepared chicken.',
        zh: '自制鸡肉。',
      },
    },
  },
  {
    keys: ["FEUILLE D'OSEILLE OU NGAI NGAI", 'NGAI NGAI', 'Ngai Ngai'],
    copy: {
      name: { fr: "FEUILLE D'OSEILLE OU NGAI NGAI", en: 'Sorrel leaves (ngai ngai)', zh: '酸模叶（Ngai Ngai）' },
      description: {
        fr: 'Feuilles d’oseille, aussi appelées ngai ngai.',
        en: 'Sorrel leaves, also called ngai ngai.',
        zh: '酸模叶，又称 Ngai Ngai。',
      },
    },
  },
  {
    keys: ['CHAMPIGNON OU MAYEBO', 'Mayebo'],
    copy: {
      name: { fr: 'CHAMPIGNON OU MAYEBO', en: 'Mushrooms (mayebo)', zh: '蘑菇（Mayebo）' },
      description: {
        fr: 'Champignons, aussi appelés mayebo.',
        en: 'Mushrooms, also called mayebo.',
        zh: '蘑菇，又称 Mayebo。',
      },
    },
  },
  {
    keys: ['COURGE OU MBIKA', 'Mbika'],
    copy: {
      name: { fr: 'COURGE OU MBIKA', en: 'Squash / pumpkin seed stew (mbika)', zh: '南瓜籽菜（Mbika）' },
      description: {
        fr: 'Courge ou mbika à la congolaise.',
        en: 'Squash or mbika, Congolese style.',
        zh: '刚果风味南瓜籽菜（Mbika）。',
      },
    },
  },
  {
    keys: ['CHIKWANGUE'],
    copy: {
      name: { fr: 'CHIKWANGUE', en: 'Chikwangue (cassava paste)', zh: '木薯糕（Chikwangue）' },
      description: {
        fr: 'Bâton de manioc fermenté.',
        en: 'Fermented cassava stick.',
        zh: '发酵木薯棒。',
      },
    },
  },
  {
    keys: ['CHEVRE OU NTABA', 'NTABA', 'Chèvre'],
    copy: {
      name: { fr: 'CHEVRE OU NTABA', en: 'Goat (ntaba)', zh: '山羊肉（Ntaba）' },
      description: {
        fr: 'Viande de chèvre, aussi appelée ntaba.',
        en: 'Goat meat, also called ntaba.',
        zh: '山羊肉，又称 Ntaba。',
      },
    },
  },
  {
    keys: ['CHENILLE OU MBINZO', 'Mbinzo'],
    copy: {
      name: { fr: 'CHENILLE OU MBINZO', en: 'Caterpillars (mbinzo)', zh: '毛虫（Mbinzo）' },
      description: {
        fr: 'Chenilles comestibles, aussi appelées mbinzo.',
        en: 'Edible caterpillars, also called mbinzo.',
        zh: '可食用毛虫，又称 Mbinzo。',
      },
    },
  },
  {
    keys: ['FEUILLE DE MANIOC OU PONDU'],
    copy: {
      name: { fr: 'FEUILLE DE MANIOC OU PONDU', en: 'Cassava leaves (pondu)', zh: '木薯叶（Pondu）' },
      description: {
        fr: 'Feuilles de manioc, aussi appelées pondu.',
        en: 'Cassava leaves, also called pondu.',
        zh: '木薯叶，又称 Pondu。',
      },
    },
  },
  {
    keys: ['EPINARD A LA VIANDE', 'ÉPINARD A LA VIANDE'],
    copy: {
      name: { fr: 'EPINARD A LA VIANDE', en: 'Spinach with meat', zh: '肉末菠菜' },
      description: {
        fr: 'Épinards mijotés à la viande.',
        en: 'Spinach simmered with meat.',
        zh: '菠菜与肉同炖。',
      },
    },
  },
  {
    keys: ['HARICOT OU MADESU'],
    copy: {
      name: { fr: 'HARICOT OU MADESU', en: 'Beans (madesu)', zh: '豆子（Madesu）' },
      description: {
        fr: 'Haricots, aussi appelés madesu.',
        en: 'Beans, also called madesu.',
        zh: '豆子，又称 Madesu。',
      },
    },
  },
  {
    keys: ['CAPITAINE EN ENTIER OU CAPITAINE MOBIMBA', 'Capitaine Mobimba'],
    copy: {
      name: { fr: 'CAPITAINE EN ENTIER OU CAPITAINE MOBIMBA', en: 'Whole Nile perch (capitaine mobimba)', zh: '整条尼罗鲈（Capitaine Mobimba）' },
      description: {
        fr: 'Capitaine entier.',
        en: 'Whole Nile perch.',
        zh: '整条尼罗鲈。',
      },
    },
  },
  {
    keys: ['DEMI CAPITAINE OU CAPITAINE YA NDAMBU', 'Capitaine ya ndambu'],
    copy: {
      name: { fr: 'DEMI CAPITAINE OU CAPITAINE YA NDAMBU', en: 'Half Nile perch (capitaine ya ndambu)', zh: '半条尼罗鲈（Capitaine ya ndambu）' },
      description: {
        fr: 'Demi-capitaine.',
        en: 'Half Nile perch.',
        zh: '半条尼罗鲈。',
      },
    },
  },
  {
    keys: ['COCA'],
    copy: {
      name: { fr: 'COCA', en: 'Coca-Cola', zh: '可口可乐' },
      description: {
        fr: 'Coca-Cola.',
        en: 'Coca-Cola.',
        zh: '可口可乐。',
      },
    },
  },
  {
    keys: ['FATAN', 'FANTA'],
    copy: {
      name: { fr: 'FATAN', en: 'Fanta', zh: '芬达' },
      description: {
        fr: 'Fanta.',
        en: 'Fanta.',
        zh: '芬达。',
      },
    },
  },
  {
    keys: ['SPRITE'],
    copy: {
      name: { fr: 'SPRITE', en: 'Sprite', zh: '雪碧' },
      description: {
        fr: 'Sprite.',
        en: 'Sprite.',
        zh: '雪碧。',
      },
    },
  },
  {
    keys: ['BAVARIA'],
    copy: {
      name: { fr: 'BAVARIA', en: 'Bavaria', zh: 'Bavaria 啤酒' },
      description: {
        fr: 'Bavaria.',
        en: 'Bavaria.',
        zh: 'Bavaria 啤酒。',
      },
    },
  },
];

function normalizeDishKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'ou', 'a', 'au', 'aux', 'et', 'en', 'ya', 'the', 'or']);

function significantDishKey(value: string): string {
  return normalizeDishKey(value)
    .split(' ')
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    .join(' ');
}

const dishByKey = new Map<string, DishCopy>();
for (const entry of dishCatalog) {
  for (const key of entry.keys) {
    const normalized = normalizeDishKey(key);
    const significant = significantDishKey(key);
    if (normalized) dishByKey.set(normalized, entry.copy);
    if (significant) dishByKey.set(significant, entry.copy);
  }
}

function findDishCopy(name: string): DishCopy | undefined {
  const normalized = normalizeDishKey(name);
  if (!normalized) return undefined;
  const significant = significantDishKey(name);
  return dishByKey.get(normalized) ?? dishByKey.get(significant);
}

const WORD_GLOSSARY: Record<string, { en: string; zh: string }> = {
  poisson: { en: 'fish', zh: '鱼' },
  sale: { en: 'salted', zh: '咸' },
  salee: { en: 'salted', zh: '咸' },
  grille: { en: 'grilled', zh: '烤' },
  grillee: { en: 'grilled', zh: '烤' },
  braise: { en: 'braised', zh: '炭火' },
  braisee: { en: 'braised', zh: '炭火' },
  poele: { en: 'pan-fried', zh: '煎' },
  frite: { en: 'fried', zh: '炸' },
  frites: { en: 'fries', zh: '薯条' },
  viande: { en: 'meat', zh: '肉' },
  boeuf: { en: 'beef', zh: '牛肉' },
  porc: { en: 'pork', zh: '猪肉' },
  poulet: { en: 'chicken', zh: '鸡肉' },
  cuisse: { en: 'thigh', zh: '鸡腿' },
  chevre: { en: 'goat', zh: '山羊' },
  tripe: { en: 'tripe', zh: '肚' },
  tripes: { en: 'tripe', zh: '肚' },
  feuille: { en: 'leaves', zh: '叶' },
  feuilles: { en: 'leaves', zh: '叶' },
  manioc: { en: 'cassava', zh: '木薯' },
  haricot: { en: 'beans', zh: '豆子' },
  haricots: { en: 'beans', zh: '豆子' },
  riz: { en: 'rice', zh: '米饭' },
  banane: { en: 'plantain', zh: '大蕉' },
  plantain: { en: 'plantain', zh: '大蕉' },
  plantains: { en: 'plantains', zh: '大蕉' },
  champignon: { en: 'mushroom', zh: '蘑菇' },
  champignons: { en: 'mushrooms', zh: '蘑菇' },
  courge: { en: 'squash', zh: '南瓜' },
  epinard: { en: 'spinach', zh: '菠菜' },
  epinards: { en: 'spinach', zh: '菠菜' },
  chenille: { en: 'caterpillar', zh: '毛虫' },
  chenilles: { en: 'caterpillars', zh: '毛虫' },
  capitaine: { en: 'Nile perch', zh: '尼罗鲈' },
  entier: { en: 'whole', zh: '整条' },
  demi: { en: 'half', zh: '半条' },
  gombo: { en: 'okra', zh: '秋葵' },
  fufu: { en: 'fufu', zh: '富富' },
  pondu: { en: 'pondu', zh: 'Pondu' },
  madesu: { en: 'madesu', zh: 'Madesu' },
  likayabu: { en: 'likayabu', zh: 'Likayabu' },
  makayabu: { en: 'makayabu', zh: 'Makayabu' },
  mabumu: { en: 'mabumu', zh: 'Mabumu' },
  matumbo: { en: 'matumbo', zh: 'Matumbo' },
  ntaba: { en: 'ntaba', zh: 'Ntaba' },
  mbinzo: { en: 'mbinzo', zh: 'Mbinzo' },
  mbika: { en: 'mbika', zh: 'Mbika' },
  mayebo: { en: 'mayebo', zh: 'Mayebo' },
  mipanzi: { en: 'mipanzi', zh: 'Mipanzi' },
  chikwangue: { en: 'chikwangue', zh: 'Chikwangue' },
  matembe: { en: 'matembela', zh: 'Matembela' },
  matembele: { en: 'matembela', zh: 'Matembela' },
  fumbwa: { en: 'fumbwa', zh: '富姆瓦' },
  makemba: { en: 'makemba', zh: 'Makemba' },
  ngombe: { en: 'ngombe', zh: 'Ngombe' },
  oseille: { en: 'sorrel', zh: '酸模' },
  ngai: { en: 'ngai ngai', zh: 'Ngai Ngai' },
  sauce: { en: 'sauce', zh: '酱' },
  piment: { en: 'chilli', zh: '辣椒' },
  poivron: { en: 'pepper', zh: '甜椒' },
  poivrons: { en: 'peppers', zh: '甜椒' },
  arachide: { en: 'peanut', zh: '花生' },
  arachides: { en: 'peanuts', zh: '花生' },
  gingembre: { en: 'ginger', zh: '姜' },
  ananas: { en: 'pineapple', zh: '菠萝' },
  citron: { en: 'lemon', zh: '柠檬' },
  citrons: { en: 'lemons', zh: '柠檬' },
  verts: { en: 'lime', zh: '青柠' },
  vert: { en: 'green', zh: '青' },
  jus: { en: 'juice', zh: '汁' },
  biere: { en: 'beer', zh: '啤酒' },
  eau: { en: 'water', zh: '水' },
  minerale: { en: 'mineral', zh: '矿泉' },
  beignets: { en: 'doughnuts', zh: '炸糕' },
  fruits: { en: 'fruit', zh: '水果' },
  tropicaux: { en: 'tropical', zh: '热带' },
  frais: { en: 'fresh', zh: '新鲜' },
  chaud: { en: 'hot', zh: '热' },
  traditionnelle: { en: 'traditional', zh: '传统' },
  traditionnel: { en: 'traditional', zh: '传统' },
  maison: { en: 'homemade', zh: '自制' },
  nature: { en: 'plain', zh: '原味' },
  naturel: { en: 'natural', zh: '鲜榨' },
  croustillant: { en: 'crispy', zh: '酥脆' },
  croustillants: { en: 'crispy', zh: '酥脆' },
  moelleux: { en: 'soft', zh: '松软' },
  portion: { en: 'portion', zh: '份' },
  coca: { en: 'Coca-Cola', zh: '可口可乐' },
  fanta: { en: 'Fanta', zh: '芬达' },
  fatan: { en: 'Fanta', zh: '芬达' },
  sprite: { en: 'Sprite', zh: '雪碧' },
  bavaria: { en: 'Bavaria', zh: 'Bavaria' },
  ou: { en: 'or', zh: '或' },
  et: { en: 'and', zh: '和' },
  avec: { en: 'with', zh: '配' },
  aux: { en: 'with', zh: '配' },
  au: { en: 'with', zh: '配' },
  a: { en: 'with', zh: '配' },
  de: { en: 'of', zh: '' },
  du: { en: 'of', zh: '' },
  des: { en: 'of', zh: '' },
  en: { en: 'in', zh: '' },
};

const PHRASE_GLOSSARY: { key: string; en: string; zh: string }[] = [
  { key: 'poisson sale', en: 'salted fish', zh: '咸鱼' },
  { key: 'viande de boeuf', en: 'beef', zh: '牛肉' },
  { key: 'viande de porc', en: 'pork', zh: '猪肉' },
  { key: 'banane plantain', en: 'plantain', zh: '大蕉' },
  { key: 'feuille de manioc', en: 'cassava leaves', zh: '木薯叶' },
  { key: 'feuilles de manioc', en: 'cassava leaves', zh: '木薯叶' },
  { key: 'feuille d oseille', en: 'sorrel leaves', zh: '酸模叶' },
  { key: 'ngai ngai', en: 'ngai ngai', zh: 'Ngai Ngai' },
  { key: 'capitaine en entier', en: 'whole Nile perch', zh: '整条尼罗鲈' },
  { key: 'demi capitaine', en: 'half Nile perch', zh: '半条尼罗鲈' },
  { key: 'epinard a la viande', en: 'spinach with meat', zh: '肉末菠菜' },
];

function composeFromGlossary(text: string, locale: 'en' | 'zh'): string {
  const tokens = normalizeDishKey(text).split(' ').filter(Boolean);
  if (tokens.length === 0) return text;

  const parts: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tri = tokens.slice(i, i + 3).join(' ');
    const bi = tokens.slice(i, i + 2).join(' ');
    const phrase3 = PHRASE_GLOSSARY.find(item => item.key === tri);
    const phrase2 = PHRASE_GLOSSARY.find(item => item.key === bi);
    if (phrase3) {
      parts.push(phrase3[locale]);
      i += 3;
      continue;
    }
    if (phrase2) {
      parts.push(phrase2[locale]);
      i += 2;
      continue;
    }
    const word = WORD_GLOSSARY[tokens[i]];
    if (word) {
      if (word[locale]) parts.push(word[locale]);
      i += 1;
      continue;
    }
    if (STOP_WORDS.has(tokens[i])) {
      i += 1;
      continue;
    }
    parts.push(locale === 'zh' ? tokens[i] : tokens[i]);
    i += 1;
  }

  const composed = locale === 'zh'
    ? parts.filter(Boolean).join('')
    : parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return composed || text;
}

export function translateDishName(name: string, locale: AppLocale): string {
  if (!name) return name;
  if (locale === 'fr') return name;
  return findDishCopy(name)?.name[locale] ?? composeFromGlossary(name, locale);
}

export function translateDishDescription(name: string, description: string, locale: AppLocale): string {
  if (locale === 'fr') return description;
  const known = findDishCopy(name)?.description[locale];
  if (known) return known;
  if (!description) return description;
  return composeFromGlossary(description, locale);
}
