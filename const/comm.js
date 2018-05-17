/**
枚举定义文件，使用范例：
    let {BonusType, ReturnCode} = require('./comm');
    console.log(BonusType.Money);
    console.log(ReturnCode.Error);
 */

/**
 * 受限行为类型
 */
const ActionExecuteType = {
    AE_Login: 1,              //每日可累计登录次数
    AE_SocialOfFail: 2,       //每日可以进行失败分享的次数
    AE_SocialOfAction: 3,     //每日可以赠送体力分享的次数
    AE_SocialOfSuper: 4,      //每日可以进行胜利超越分享的次数
    AE_SlaveCatch:5,          //每日可以进行抓捕奴隶的次数
    AE_SlaveEscape:6,         //每日可以进行起义的次数
    slaveFood: 7,             //奴隶：给奴隶加餐
    slaveAvenge: 8,           //奴隶：报复
    slaveFlattery: 9,         //奴隶：谄媚
    slaveCommend: 10,         //奴隶：表扬
    slaveLash: 12,            //奴隶：鞭挞 - 随机奖励
    vipDaily: 21,             //VIP：领取每日奖励
};

/**
 * Redis缓存操作标志位
 */
const RedisOperFlag = {
    Promisify:  1 << 0,     //Promisify标志
    Del:        1 << 1,     //删除标志
}

/**
 * 领域类型
 */
const DomainType = {
    MF: "mf",               //MoreFun
    TX: "tx",               //空间
    TXX: "txx",             //QQ
    D360: "360",            //360
    OFFICIAL: "offcial",    //官网
    SYSTEM: "system",       //RPC
    ADMIN: "admin",         //系统管理员
};

const DomainTable = {
    "mf":               ["mf", "mf.IOS", "mf.Android", "mf.Test"],
    "tx":               ["tx", "tx.IOS", "tx.Android", "tx.Test"],
    "txx":              ["txx", "txx.IOS", "txx.Android", "txx.Test"],
    "360":              ["360", "360.IOS", "360.Android", "360.Test"],
    "offcial":          ["offcial", "offcial.IOS", "offcial.Android", "offcial.Test"],
    "admin":            ["admin"],
};

const DomainList = {
    //moreFun
    "mf":               DomainTable[DomainType.MF],
    "mf.IOS":           DomainTable[DomainType.MF],
    "mf.Android":       DomainTable[DomainType.MF],
    "mf.Test":          DomainTable[DomainType.MF],
    
    //腾讯玩吧
    "tx":               DomainTable[DomainType.TX],
    "tx.IOS":           DomainTable[DomainType.TX],
    "tx.Android":       DomainTable[DomainType.TX],
    "tx.Test":          DomainTable[DomainType.TX],

    //腾讯
    "txx":              DomainTable[DomainType.TXX],
    "txx.IOS":          DomainTable[DomainType.TXX],
    "txx.Android":      DomainTable[DomainType.TXX],
    "txx.Test":         DomainTable[DomainType.TXX],

    //360
    "360":              DomainTable[DomainType.D360],
    "360.IOS":          DomainTable[DomainType.D360],
    "360.Android":      DomainTable[DomainType.D360],
    "360.Test":         DomainTable[DomainType.D360],

    //offcial
    "offfcial":         DomainTable[DomainType.OFFICIAL],
    "offcial.IOS":      DomainTable[DomainType.OFFICIAL],
    "offcial.Android":  DomainTable[DomainType.OFFICIAL],
    "offcial.Test":     DomainTable[DomainType.OFFICIAL],

    "admin":            DomainTable[DomainType.ADMIN],
};

function GetDomainType(domain){
    for(let $type of Object.keys(DomainTable)){
        if(DomainTable[$type].indexOf(domain) != -1){
            return $type;
        }
    }
    return DomainType.OFFICIAL;
}

/**
 * 获取社交链逻辑中，当前用户关联的领域列表
 */
function GetDomainList(domain){
    if(!DomainList[domain]){
        return DomainTable[DomainType.OFFICIAL];
    }
    else{
        return DomainList[domain];
    }
}

/**
 * 玩家状态
 */
const UserStatus = {
    /**
     * 空参数
     */
    none: 0,
    /**
     * 当前分享可以获得奖励
     */
    shareBonus: 1 << 1,
    /**
     * 有新的消息
     */
    newMsg: 1 << 3,
    /**
     * 新注册
     */
    isNewbie: 1<< 4,
    /**
     * 是否首次分享
     */
    isFirstShare: 1<< 5,
    /**
     * 当前在线
     */
    online: 1<<6,
    /**
     * 战斗中
     */
    gaming: 1<<7,
    /**
     * 成为奴隶
     */
    slave: 1<<8,
    /**
     * 成为奴隶主
     */
    master: 1<<9,
    /**
     * 是否执行了首次消费
     */
    isFirstPurchase: 1<<10,
    /**
     * 是否领取了首次消费奖励
     */
    isFirstPurchaseBonus: 1<<11,
    /**
     * 是否VIP
     */
    isVip: 1<<12,
    /**
     * 是否领取过新用户奖励
     */
    isGetNewbieBonus: 1<<13,
    /**
     * 是否领取过节日礼包（2017.10.16改状态更改为次日重置，以便复用
     */
    isGetFestivalGift: 1<<14,
    /**
     * 是否解锁火影场景
     */
    unlockedNinjaScene: 1<<15,
    /**
     * 是否已领取国庆活动礼包
     */
    isGetNinjaGift: 1<<16,
    /**
     * 是否已领取国庆任务奖励
     */
    isGetNarutoGift: 1<<17,
};

/**
 * 排行榜类型
 * @type {{total: number, daily: number, friend: number}}
 */
const RankType = {
    total: 0,   //总榜
    daily: 1,   //日榜
    friend:2,   //公司业绩
};

/**
 * 奖励类型
 * @type {{Diamond: string, Money: string, Action: string, VIP: string, Item: string, Revive: string, Role: string, Scene: string, Road: string, Box: string}}
 */
const BonusType = {
    Diamond: 'D',       //元宝
    Money : 'M',        //金币
    Action: 'A',        //体力
    VIP: 'V',           //VIP特权（单位：天）
    Item: "I",         //道具
    Chip: "C",          //角色碎片
    Revive: "item",     //复活
    Role: "role",       //角色
    Scene: "scene",     //场景
    Road : "road",      //道路
    Box: "box",         //礼包
};

/**
 * 物品类型字头，会和物品ID组合成最终的唯一ID，例如，鸡小德ID为1，则鸡小德角色为1001，而鸡小德碎片为6001
 * @type {{Role: number, Scene: number, Road: number, Item: number, Chip: number}}
 */
const BonusHead = {
    Role: 1000,     //角色
    Scene:2000,     //场景
    Road: 3000,     //道路
    Item: 4000,     //道具
    Chip: 6000,     //角色碎片
}

/**
 * 客户端请求返回值，统一定义所有的错误码，每100个为一个大类
 */
const ReturnCode = {
    Success: 0,             //操作成功
    userIllegal: 1,         //非法用户
    taskIllegalIdx:101,     //非法任务索引
    taskBonusHasGot:102,    //任务奖励已领取
    taskNotFinished:103,    //任务尚未完成
    buildLevelMax:201,      //建筑等级已达最大
    buildNeedNotRepair:202, //建筑物无需修复
    socialEnemyMoneyNotEnough:301,//敌人金币不足
    socialSimUserNotExist:302,  //指定目标用户不存在
    socialHelloCd:303,          //打招呼冷却中
    socialIsEnemy:304,          //当前是敌人
    socialIsFriend:305,         //当前是朋友
    socialMaxFriendNum:306,     //好友数量超限
    socialNoEnemyToSteal:307,   //没有发现合适的偷取对象
    socialNoEnemyToAttack:308,  //没有发现合适的攻击对象
    socialActionLimited:309,    //受限行为达到最大次数
    socialIsSlave:310,          //自己当前是奴隶
    socialMaxSlave:311,         //奴隶数量超出限制
    socialCatched:312,          //已被他人抓获
    socialCatchFailed:313,      //战斗失利，抓捕失败
    socialEscapeFailed:314,     //战斗失利，逃跑失败
    socialCatchedBySelf:315,    //已被自己抓获
    petActiveNotStart:401,      //宠物尚未开始孵化
    petNotExist:402,            //指定宠物不存在
    petMaxNum:403,              //达到宠物数量上限
    roleMaxLevel:404,           //角色达到最大等级
    itemNotExist:501,           //指定道具不存在
    itemNotEnough:502,          //指定道具数量不足
    itemHasOne:503,             //指定道具已拥有
    itemCanntExec:504,          //指定道具当前无法购买（比如体力满）
    timeTooShort: 601,          //关卡：用时太短
    timeTooLong: 602,           //关卡：用时太长
    actionNotEnough:603,        //关卡：体力不足
    toBeStarted:604,            //关卡：尚未开始
    inBattle: 605,              //关卡：战斗中
    inSweep: 606,               //关卡：扫荡中
    inBonus: 607,               //关卡：领奖中
    illegalScore:608,           //关卡：异常得分
    illegalGateId:609,          //关卡：异常关卡号
    slaveBattleNotRegister:610, //关卡：未注册（抓捕或起义）
    roleChipNotEnough:701,      //角色：角色碎片数量不足
    vipBonusGot:801,            //VIP：当日奖励已经领取
    activityBonusGot:901,       //活动：奖励已领取
    activityNoRankBonus:902,    //活动：没有上榜
    activityNoStart:903,        //活动：没有开始
    cannotAddProp:904,          //活动：预热时间已过无法进行投奖
    Error: 9000,                //未知错误
    illegalData:9001,           //非法数据
    EmptyData:9002,             //数据为空
    MoneyNotEnough:9003,        //金币不足
    ActionNotEnough:9004,       //体力不足
    dbError:9005,               //数据库错误
    authThirdPartFailed:9006,   //第三方平台校验失败
    routerFailed:9007,          //由于客户端上行了无法解析的路由信息，导致服务端路由失败
    tooManyConnections:9008,    //连接数太多
    DiamondNotEnough:9009,      //元宝不足
    RoleLeveltooLow:1001,       //角色等级过低
};

const ReturnCodeName = {
    0:'操作成功',
    1:'非法用户',
    101:'非法任务索引',
    102:'任务奖励已领取',
    103:'任务尚未完成',
    201:'建筑等级已达最大',
    202:'建筑物无需修复',
    301:'敌人金币不足',
    302:'指定目标用户不存在',
    303:'打招呼冷却中',
    304:'当前是敌人',
    305:'当前是朋友',
    306:'好友数量超限',
    307:'没有发现合适的偷取对象',
    308:'没有发现合适的攻击对象',
    309:'受限行为达到最大次数',
    310:'自己当前是奴隶',
    311:'奴隶数量超出限制',
    312:'已被他人抓获',
    313:'战斗失利，抓捕失败',
    314:'战斗失利，逃跑失败',
    315:'已被自己抓获',
    401:'宠物尚未开始孵化',
    402:'指定宠物不存在',
    403:'达到宠物数量上限',
    404:'角色达到最大等级',
    501:'指定道具不存在',
    502:'指定道具数量不足',
    503:'指定道具已拥有',
    504:'指定道具当前无法购买',
    601:'关卡：用时太短',
    602:'关卡：用时太长',
    603:'关卡：体力不足',
    604:'关卡：尚未开始',
    605:'关卡：战斗中',
    606:'关卡：扫荡中',
    607:'关卡：领奖中',
    608:'关卡：异常得分',
    609:'关卡：异常关卡号',
    610:'关卡：未注册(抓捕或起义)',
    701:'角色：角色碎片数量不足',
    801:'当日奖励已经领取',
    901:'活动: 奖励已领取',
    902:'活动：没有上榜',
    903:'活动：没有开始',
    9000:'未知错误',
    9001:'非法数据',
    9002:'数据为空',
    9003:'金币不足',
    9004:'体力不足',
    9005:'数据库错误',
    9006:'第三方平台校验失败',
    9007:'由于客户端上行了无法解析的路由信息，导致服务端路由失败',
    9008:'连接数太多',
    9009:'元宝不足',
};

/**
 * 通讯模式
 * @type {{ws: string, socket: string, http: string, https: string}}
 */
const CommMode = {
    ws: "webSocket",    //Web Socket
    socket: "socket",   //原生Socket
    http:"http",        //HTTP短连模式
}

/**
 * 好友类型
 * @type {{stranger: number, social: number, oneWay: number, twoWay: number, enemy: number}}
 */
const FriendType = {
    stranger: 0,        //陌生人
    social: 1,          //社交媒体上的好友
    oneWay: 2,          //单向好友，已关注
    twoWay: 3,          //双向好友，相互关注
    enemy: 4,           //敌人
};

/**
 * 下行消息类型
 */
const NotifyType = {
    none: 0,            //测试消息
    action: 1,          //体力数值结构推送
    chat:2,             //聊天消息
    mail:3,             //邮件
    status:4,           //状态：info.status字段

    buyItem: 1001,      //支付相关
    taskFinished: 2001, //任务完成
    taskChanged: 2002,  //任务改变
    socialSendAction: 3001,     //互动：赠送体力
    socialSendDog: 3002,        //互动：放狗
    socialSendShield: 3003,     //互动：赠送护盾
    socialSendHello: 3004,      //互动：点赞
    friends:3005,               //互动：好友列表（每次20条，可能多条）
    actions:3006,               //互动：下发受限行为列表，附带行为奖励
    socialBonusHello:3007,      //互动：收获点赞
    userStatus:3010,            //好友状态改变 0 离线 1 在线 2 游戏中

    //以下为奴隶相关
    slaveCatch: 3101,           //奴隶：抓捕 - 需要通关指定关卡，胜利后方可抓捕
    slaveCatched:3121,          //奴隶：抓捕结果
    slaveLash: 3102,            //奴隶：鞭挞 - 随机奖励
    slaveEscape: 3103,          //奴隶：起义 - 奴隶反抗，需要通关指定关卡，胜利后方可解放。
    slaveEscaped:3123,          //奴隶：起义结果
    slaveRansom: 3104,          //奴隶：赎身 - 使用赎身道具时触发，赎身道具可在商城中购买，或者直接元宝赎身，奴隶主获取部分收益
    slaveRelease:3105,          //奴隶：释放 - 系统自动触发，奴隶主获取全部收益
    slaveList:3106,             //奴隶：下发列表
    slaveFood: 3107,            //奴隶：给奴隶加餐
    slaveAvenge: 3108,          //奴隶：报复
    slaveFlattery: 3109,        //奴隶：谄媚
    slaveCommend: 3110,         //奴隶：表扬
    slaveFlatteryAdditional: 3111,//奴隶：谄媚附加消息
    //ealerRelease:3125,          //奴隶：被提前释放
    purchase:3150,              //购买行为次数
    //以上为奴隶相关

    vipBonus: 4001,             //VIP:获取每日奖励
    guide:5001,                 //启动新手引导
    guideBonus: 5002,           //获取新手奖励
    activityScoreBonus:6001,    //活动 - 分段积分奖励
    activityRankBonus:6002,     //活动 - 排名奖励
    activityScore:6000,         //活动分数
    firstShareBonus: 5003,           //首次分享

    // DailyActivityBonus:4100,      //七夕活动邮件类型
    DailyActivityBonus:4104,        //每日活动
    DailyEvent:4101,                //每日首次登陆
    DailyActivityState:4102,        //每日活动开关状态
    DailyActivityInstantBonus:4103, //活动中即时送出的奖励

    roleShare:7001,                 //角色分享
    sceneShare:7002,                //场景分享
};

/**
 * 订单状态
 * @type {{create: number, cancel: number, commit: number}}
 */
const PurchaseStatus = {
    create: 0,          //订单已生成
    cancel: 1,          //订单已取消
    commit: 2,          //订单已确认支付
};

/**
 * 加成模式
 * @type {{em_EffectCalc_Multiplication: number, em_EffectCalc_Addition: number, em_EffectCalc_Subduction: number, em_EffectCalc_Division: number}}
 */
const em_EffectCalcType = {
    em_EffectCalc_Multiplication: 1, //乘法，表示加持时，效果是按照百分比叠加的
    em_EffectCalc_Addition: 2,       //加法，标识加持时，效果是按照绝对值叠加的
    em_EffectCalc_Subduction: 3,     //减法，可以使用加法+负数实现
    em_EffectCalc_Division: 4,       //除法，可以使用乘法+小数实现
};

/**
 * 效果类型
 * @type {{None: number}}
 */
const em_Effect_Comm = {
    None:0,                 //空
    ActionRecover: 2,       //加快体力恢复速度, 配置加速百分比, 累计相加后按比例缩短体力恢复间隔
    DiscountActionTime:3,   //缩短体力恢复所用周期时间
    MoneyAdded:4,           //闯关和无尽金币收益增加
    InterOperation:5,       //增加奴隶系统互动次数
};

/**
 * 特权加持模式一览表 注意每种特权只能指定一种加持模式
 *
 */
class MapOfTechCalcType {
    constructor(){
        this[em_Effect_Comm.None] = em_EffectCalcType.em_EffectCalc_Addition;
        this[em_Effect_Comm.ActionRecover] = em_EffectCalcType.em_EffectCalc_Addition;
        this[em_Effect_Comm.DiscountActionTime] = em_EffectCalcType.em_EffectCalc_Division;
        this[em_Effect_Comm.MoneyAdded] = em_EffectCalcType.em_EffectCalc_Multiplication;
        this[em_Effect_Comm.InterOperation] = em_EffectCalcType.em_EffectCalc_Addition;
    }
}
let mapOfTechCalcType = new MapOfTechCalcType();

/**
 * 条件检测模式
 */
const em_Condition_Checkmode = 
{
    add: 1,         //累加检测
    absolute: 2,    //绝对值检测
}

/**
 * 检测条件类型枚举
 * 注：检测条件类型一旦定义就不要修改或删除，因为会影响到静态配置表和任务状态持久化字段
 */
const em_Condition_Type = {
    loginContinue: 101,     //连续登录
    finishFirst: 1,         //首次（场）完成游戏
    buyRole: 2,             //每次购买任意角色
    buyRoad: 3,             //每次购买任意路径
    buyScene: 4,            //每次购买任意背景
    overFriend: 5,          //每次单次游戏游戏超越了好友排名
    overHistory: 6,         //每次单次游戏刷新最高分
    onRank: 7,              //首次登上总排行榜
    onRankDaily: 8,         //每天首次登上日排行榜
    onRankFriendOfWeek: 9,  //每周首次登上好友排行榜
    roundScore: 10,         //单次游戏获得分数
    roundMoney: 11,         //单次游戏获得游戏币个数
    death: 12,              //累计死亡次数
    totalMoney: 13,         //累计从游戏获得的游戏币
    totalRound: 14,         //累计进行游戏次数
    totalRevive: 15,        //累计使用复活道具次数
    orderOfRankTotal: 16,   //总排行榜达到过前若干名
    orderOfRankDaily: 17,   //日排行榜达到过前若干名
    orderOfRankFriend: 18,  //好友排行榜达到过前若干名
    totalSpendMoney: 19,    //累计花费游戏币个数
    totalLogin: 20,         //累计登陆游戏天数
    totalShare: 21,         //累计进行分享次数
    totalRole: 22,          //累计拥有角色个数
    totalRoad: 23,          //累计拥有路径个数
    totalScene: 24,         //累计拥有背景个数
    getRole: 25,            //拥有某个角色
    getRoad: 26,            //拥有某个路径
    getScene: 27,           //拥有某个背景
    useRole1002: 28,        //使用指定角色进行游戏的次数
    useRoad: 29,            //使用指定路径进行游戏的次数
    useScene2002: 30,       //使用指定背景进行游戏的次数
    gatePassNum: 31,        //通关次数
    gateMaxNo: 32,          //通关最高关卡
    useAction: 33,          //使用体力
    onRankCompany: 34,      //每天首次登上公司排行榜
    gateStar:35,            //累计获得的星星总数
    totalSpendDiamond: 36,  //累计花费钻石个数
    totalSlaveCatch:37,     //累计抓捕指定数量奴隶
    totalPurchase:38,       //累计充值
    shareOfFail: 101,       //战斗失败时的分享
    shareOfLackAction:102,  //缺乏体力时的分享
    totalTime:103,          //用户累计登录时间
};

/**
 * 任务状态枚举
 * 注：只是使用静态类简单模拟枚举类型（下同），因此并不支持默认值、检测枚举值是否定义等枚举特性，有兴趣的童鞋可以自行扩展
 */
const em_task_status =
{
    init: 0,         //初始状态
    award: 1,        //待领奖状态
    finished: 2,     //完成状态 - 对主线任务，一旦完成会停留在此状态；对日常任务，一旦完成会停留在该状态直至第二天登录；对循环任务，一旦完成会自动恢复为初始状态
}

/**
 * 任务类型枚举
 */
const em_task_type =
{
    main: 1,         //主线
    daily: 2,        //日常
    recy: 3,         //循环

    dailyHead: 2000,//日程任务字头
    recyHead: 3000, //循环任务字头
}

/**
 * 静态任务配置表
 * @key: 任务唯一编号
 * @value = 条件设定|奖励设定
 *      条件设定 = 条件编号，条件阈值[;更多条件设定]
 *      奖励设定 = 奖励编号，奖励数量[;更多奖励设定]
 *
 * @note
 *  新增前置条件、嵌套层次参数 2017.1.12
 *  如果对任务ID做了删/改，则需要清理数据库表中的task字段，如果只是新增任务条目则无此必要
 */

const StaticTaskList = {
    //静态主线任务，编号从1001开始
    // 1001 : em_Condition_Type.totalLogin+',1'+'|'+BonusType.Diamond+',1|0|1/3',        //累计登录1次，奖励50钻石
    // 1002 : em_Condition_Type.totalLogin+',2'+'|'+BonusType.Diamond+',2|1001|2/3',    //累计登录2次，奖励50钻石
    // 1003 : em_Condition_Type.totalLogin+',3'+'|'+BonusType.Diamond+',3|1002|3/3',    //累计登录3次，奖励50钻石
    1001 : `${em_Condition_Type.roundScore},150|${BonusType.Money},1680`,    //单次游戏获得分数
    1002 : `${em_Condition_Type.roundScore},500|${BonusType.Money},5040`,    //单次游戏获得分数
    1003 : `${em_Condition_Type.roundScore},1600|${BonusType.Diamond},100`,    //单次游戏获得分数
    1004 : `${em_Condition_Type.roundMoney},200|${BonusType.Item},20,1`,    //单次游戏获得金钱
    1005 : `${em_Condition_Type.roundMoney},1000|${BonusType.Diamond},20`,    //单次游戏获得金钱
    1006 : `${em_Condition_Type.roundMoney},2000|${BonusType.Diamond},100`,    //单次游戏获得金钱
    1007 : `${em_Condition_Type.death},5|${BonusType.Item},20,1`,    //累计死亡
    1008 : `${em_Condition_Type.death},15|${BonusType.Item},20,3`,    //累计死亡
    1009 : `${em_Condition_Type.death},100|${BonusType.Item},20,10`,    //累计死亡
    1010 : `${em_Condition_Type.totalMoney},1700000|${BonusType.Chip},3,3`,    //累计消费
    1011 : `${em_Condition_Type.totalMoney},3500000|${BonusType.Chip},3,5`,    //累计消费
    1012 : `${em_Condition_Type.totalMoney},10000000|${BonusType.Chip},3,10`,    //累计消费
    1013 : `${em_Condition_Type.totalRound},10|${BonusType.Money},1680`,    //累计游戏
    1014 : `${em_Condition_Type.totalRound},100|${BonusType.Money},5040`,    //累计游戏
    1015 : `${em_Condition_Type.totalRound},1000|${BonusType.Diamond},300`,    //累计游戏
    1016 : `${em_Condition_Type.totalItem},10|${BonusType.Item},20,1`,    //累计复活
    1017 : `${em_Condition_Type.totalItem},30|${BonusType.Item},20,3`,    //累计复活
    1018 : `${em_Condition_Type.totalItem},100|${BonusType.Item},20,5`,    //累计复活
    1019 : `${em_Condition_Type.onRank},50|${BonusType.Item},20,3`,    //总榜
    1020 : `${em_Condition_Type.onRank},10|${BonusType.Diamond},50`,    //总榜
    1021 : `${em_Condition_Type.onRank},3|${BonusType.Chip},5,5`,    //总榜
    1022 : `${em_Condition_Type.onRankDaily},50|${BonusType.Item},20,2`,    //日榜
    1023 : `${em_Condition_Type.onRankDaily},10|${BonusType.Diamond},50`,    //日榜
    1024 : `${em_Condition_Type.onRankDaily},3|${BonusType.Chip},5,2`,    //日榜
    1025 : `${em_Condition_Type.onRankFriendOfWeek},50|${BonusType.Money},1680`,    //好友榜
    // 1026 : `${em_Condition_Type.onRankFriendOfWeek},10|${BonusType.Money},1680`,    //好友榜
    // 1027 : `${em_Condition_Type.onRankFriendOfWeek},3|${BonusType.Item},20,1`,    //好友榜
    1028 : `${em_Condition_Type.totalSpendMoney},40000|${BonusType.Chip},6,3`,    //累计花费
    1029 : `${em_Condition_Type.totalSpendMoney},125000|${BonusType.Chip},6,5`,    //累计花费
    1030 : `${em_Condition_Type.totalSpendMoney},525000|${BonusType.Chip},6,10`,    //累计花费
    1031 : `${em_Condition_Type.totalLogin},7|${BonusType.Item},20,3`,    //累计登录
    1032 : `${em_Condition_Type.totalLogin},30|${BonusType.Diamond},150`,    //累计登录
    1033 : `${em_Condition_Type.totalLogin},60|${BonusType.Chip},8,8`,    //累计登录
    1034 : `${em_Condition_Type.totalShare},10|${BonusType.Item},20,5`,    //累计分享
    // 1035 : `${em_Condition_Type.totalShare},50|${BonusType.Item},20,1`, //累计分享
    // 1036 : `${em_Condition_Type.totalShare},100|${BonusType.Role},1002,1`,    //累计分享
    // 1037 : `${em_Condition_Type.totalRole},2|${BonusType.Money},1680`,    //累计拥有角色
    // 1038 : `${em_Condition_Type.totalScene},2|${BonusType.Money},1680`,    //累计拥有背景
    1039 : `${em_Condition_Type.getRole},1002|${BonusType.Diamond},50`,    //拥有角色
    // 1040 : `${em_Condition_Type.getScene},2002|${BonusType.Item},20,2`,    //拥有背景
    1041 : `${em_Condition_Type.useRole1002},3|${BonusType.Chip},2,5`,    //使用特定角色次数
    // 1042 : `${em_Condition_Type.useScene2002},3|${BonusType.Money},1680`,    //使用特定背景次数
    1043 : `${em_Condition_Type.gateStar},27|${BonusType.Diamond},50`,    //累计获得星星数
    1044 : `${em_Condition_Type.gateStar},72|${BonusType.Chip},4,2`,    //累计获得星星数
    1045 : `${em_Condition_Type.gateStar},150|${BonusType.Chip},2,10`,    //累计获得星星数
    1046 : `${em_Condition_Type.gateMaxNo},5|${BonusType.Money},1680`,    //闯关累计通过最大关卡
    1047 : `${em_Condition_Type.gateMaxNo},20|${BonusType.Diamond},100`,    //闯关累计通过最大关卡
    1048 : `${em_Condition_Type.gateMaxNo},50|${BonusType.Chip},1,10`,    //闯关累计通过最大关卡
	1049 : `${em_Condition_Type.totalSlaveCatch},10|${BonusType.Money},1680`,    //累计抓捕奴隶次数
	1050 : `${em_Condition_Type.totalSlaveCatch},50|${BonusType.Diamond},50`,    //累计抓捕奴隶次数
	1051 : `${em_Condition_Type.totalSlaveCatch},150|${BonusType.Diamond},300`,    //累计抓捕奴隶次数
    // 1051 : `${em_Condition_Type.gatePassNum},2|${BonusType.Money},100`,    //通关次数
    // 1052 : `${em_Condition_Type.gateMaxNo},5|${BonusType.Money},100`,    //通关最大关卡
    1055 : `${em_Condition_Type.totalPurchase},100,1506787200,1507478400|${BonusType.Chip},33,55`,    //累计充值
     
    //静态日常任务，编号从2001开始
    //2001 : `${em_Condition_Type.totalLogin},1|${BonusType.Money},100`,    //累计登录
    
    2002 : `${em_Condition_Type.totalTime},300|${BonusType.Money},1500`,    
    2003 : `${em_Condition_Type.totalTime},600|${BonusType.Diamond},5`,    
    2004 : `${em_Condition_Type.totalTime},1800|${BonusType.Chip},32,1`,    
    2005 : `${em_Condition_Type.totalTime},2700 |${BonusType.Diamond},15`,    
    2006 : `${em_Condition_Type.totalTime},3600|${BonusType.Chip},33,1`, 

    //静态循环任务，编号从3001开始
    3001 : `${em_Condition_Type.shareOfFail},1|${BonusType.Item},20,1`,    //分享送复活道具
    3002 : `${em_Condition_Type.shareOfLackAction},1|${BonusType.Action},30`,    //分享送体力
    3003 : `${em_Condition_Type.loginContinue},7|${BonusType.VIP},1`,          //累计登陆7日
};

/**
 * 新手引导
 * @note
 *      condition:是否可以推进到下一步的限定条件，目前未启用
 *      next：本步骤对应的下一个步骤
 *      rec：是否是一个记录点，如果不是则即使完成本步骤也不会记录
 *      bonus：完成本步骤可以领取的奖励
 */
const GuideList = {
    0 : {condition:[], next:1, rec:true},
    1 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:2, rec:true},
    2 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:3, rec:true},
    3 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:4, rec:true},
    4 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:5, rec:true},
    5 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:6, rec:false},
    6 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:7, rec:false},
    7 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:8, rec:true},
    8 : {condition:[{type:em_Condition_Type.totalMoney, num:100}], next:0, rec:true, bonus:[{type:BonusType.Diamond,num:100}]},
};

/**
 * 关卡类型
 * @type {{const: number}}
 */
const TollgateType = {
    SmallGate: 1,
    MediumGate: 2,
    BigGate: 3,
};

const TollgateState = {
    idle: 0,    //空闲
    start: 1,   //战斗中
    sweep: 2,   //扫荡中
    bonus: 3,   //等待领取扫荡收益
};

/**
 * 关卡操作类型
 */
const OperEnum = {
    Require: 0,         //查询
    Start: 1,           //开始
    PassTollgate: 2,    //提交结果
    Sweep: 3,           //扫荡
    SweepBonus: 4,      //领取扫荡奖励
    StartCatch: 5,      //抓捕开始
    Catch:6,            //抓捕结束
    StartEscape: 7,     //起义开始
    Escape:8,           //起义结束
};

/**
 * 活动的类型枚举，注意值要连续设置（base 0）
 */
const ActivityType = {
    Action: 0,       //累计花费的体力
    Money: 1,        //累计花费的金币
    Diamond:2,          //累计花费的钻石
    Gate:3,             //累计通关次数
    Revive:4,           //累计复活次数
    Slave:5,            //累计抓取奴隶
};
ActivityType.len = Object.keys(ActivityType).length; //枚举的数量
/**
 * 不同类型活动的分数转化率
 */
const ActivityScoreRate = {
    0:1,
    1:0.01,
    2:1,
    3:1,
    4:1,
    5:1,
}

/**
 * 活动的状态枚举
 */
const DailyActivityStatus = {
    Idle: 'Idle',       //空闲状态
    Active: 'Active',   //活跃状态
    Bonus: 'Bonus',     //奖励展示状态
    Ready: 'Ready',     //预热
    End:'End',          //活动结束
};

/**
 * 活动的状态枚举
 */
const ActivityStatus = {
    Idle: 'Idle',       //空闲状态
    Active: 'Active',   //活跃状态（周一到周六）
    Bonus: 'Bonus',     //奖励展示状态（周天）
};

/**
 * 活动 - 分段积分奖励
 */
const ActivityScoreBonus = {
    0:{
        0: {score:60, bonus:[{type:BonusType.Money, num:10000},{type:BonusType.Diamond, num:5}]},
        1: {score:120, bonus:[{type:BonusType.Money, num:15000},{type:BonusType.Diamond, num:10}]},
        2: {score:360, bonus:[{type:BonusType.Money, num:30000},{type:BonusType.Diamond, num:15}]},
        3: {score:800, bonus:[{type:BonusType.Money, num:50000},{type:BonusType.Diamond, num:20}]},
        4: {score:1200, bonus:[{type:BonusType.Money, num:100000},{type:BonusType.Diamond, num:25}]},
    },
    1:{
        0: {score:40, bonus:[{type:BonusType.Chip, id:0, num:1},{type:BonusType.Diamond, num:1}]},
        1: {score:80, bonus:[{type:BonusType.Chip, id:0, num:1},{type:BonusType.Diamond, num:5}]},
        2: {score:200, bonus:[{type:BonusType.Chip, id:0, num:2},{type:BonusType.Diamond, num:10}]},
        3: {score:450, bonus:[{type:BonusType.Chip, id:0, num:3},{type:BonusType.Diamond, num:15}]},
        4: {score:650, bonus:[{type:BonusType.Chip, id:0, num:5},{type:BonusType.Diamond, num:20}]},
    },
    2:{
        0: {score:100, bonus:[{type:BonusType.Money, num:40000},{type:BonusType.Chip, id:0, num:1}]},
        1: {score:300, bonus:[{type:BonusType.Money, num:100000},{type:BonusType.Chip, id:0, num:2}]},
        2: {score:800, bonus:[{type:BonusType.Money, num:300000},{type:BonusType.Chip, id:0, num:3}]},
        3: {score:1500, bonus:[{type:BonusType.Money, num:700000},{type:BonusType.Chip, id:0, num:5}]},
        4: {score:3000, bonus:[{type:BonusType.Money, num:1000000},{type:BonusType.Chip, id:0, num:5}]},
    },
    3:{
        0: {score:20, bonus:[{type:BonusType.Chip, id:0, num:1},{type:BonusType.Diamond, num:5}]},
        1: {score:50, bonus:[{type:BonusType.Chip, id:0, num:2},{type:BonusType.Diamond, num:7}]},
        2: {score:100, bonus:[{type:BonusType.Chip, id:0, num:3},{type:BonusType.Diamond, num:10}]},
        3: {score:180, bonus:[{type:BonusType.Chip, id:0, num:5},{type:BonusType.Diamond, num:12}]},
        4: {score:300, bonus:[{type:BonusType.Chip, id:0, num:5},{type:BonusType.Diamond, num:15}]},
    },
    4:{
        0: {score:5, bonus:[{type:BonusType.Chip, id:0, num:1},{type:BonusType.Diamond, num:15}]},
        1: {score:10, bonus:[{type:BonusType.Chip, id:0, num:2},{type:BonusType.Diamond, num:20}]},
        2: {score:15, bonus:[{type:BonusType.Chip, id:0, num:3},{type:BonusType.Diamond, num:25}]},
        3: {score:30, bonus:[{type:BonusType.Chip, id:0, num:5},{type:BonusType.Diamond, num:30}]},
        4: {score:50, bonus:[{type:BonusType.Chip, id:0, num:5},{type:BonusType.Diamond, num:35}]},
    },
    5:{
        0: {score:8, bonus:[{type:BonusType.Money, num:40000},{type:BonusType.Chip, id:0, num:1}]},
        1: {score:16, bonus:[{type:BonusType.Money, num:100000},{type:BonusType.Chip, id:0, num:2}]},
        2: {score:32, bonus:[{type:BonusType.Money, num:300000},{type:BonusType.Chip, id:0, num:3}]},
        3: {score:56, bonus:[{type:BonusType.Money, num:700000},{type:BonusType.Chip, id:0, num:5}]},
        4: {score:72, bonus:[{type:BonusType.Money, num:1000000},{type:BonusType.Chip, id:0, num:5}]},
    },
};

/**
 * 活动 - 排位积分奖励
 */
const ActivityRankBonus  = {
    0:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:0, num:10}, {type:BonusType.Diamond, num:150}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:0, num:8}, {type:BonusType.Diamond, num:120}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:0, num:5}, {type:BonusType.Diamond, num:100}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:0, num:3}, {type:BonusType.Diamond, num:80}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:0, num:1}, {type:BonusType.Diamond, num:60}]},
        6: {rank:51, bonus:[{type:BonusType.Money, num:5000}, {type:BonusType.Diamond, num:50}]},
        7: {rank:101, bonus:[{type:BonusType.Money, num:3000}, {type:BonusType.Diamond, num:30}]},
        8: {rank:501, bonus:[{type:BonusType.Money, num:2500}, {type:BonusType.Diamond, num:20}]},
        9: {rank:1001, bonus:[{type:BonusType.Money, num:1800}, {type:BonusType.Diamond, num:15}]},
        10: {rank:10001, bonus:[{type:BonusType.Money, num:1500}, {type:BonusType.Diamond, num:10}]},
        11: {rank:100000, bonus:[{type:BonusType.Money, num:1000}, {type:BonusType.Diamond, num:5}]},
    },
    1:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:0, num:10}, {type:BonusType.Diamond, num:150}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:0, num:8}, {type:BonusType.Diamond, num:120}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:0, num:5}, {type:BonusType.Diamond, num:100}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:0, num:3}, {type:BonusType.Diamond, num:80}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:0, num:1}, {type:BonusType.Diamond, num:60}]},
        6: {rank:51, bonus:[{type:BonusType.Money, num:5000}, {type:BonusType.Diamond, num:50}]},
        7: {rank:101, bonus:[{type:BonusType.Money, num:3000}, {type:BonusType.Diamond, num:30}]},
        8: {rank:501, bonus:[{type:BonusType.Money, num:2500}, {type:BonusType.Diamond, num:20}]},
        9: {rank:1001, bonus:[{type:BonusType.Money, num:1800}, {type:BonusType.Diamond, num:15}]},
        10: {rank:10001, bonus:[{type:BonusType.Money, num:1500}, {type:BonusType.Diamond, num:10}]},
        11: {rank:100000, bonus:[{type:BonusType.Money, num:1000}, {type:BonusType.Diamond, num:5}]},
    },
    2:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:5, num:10}, {type:BonusType.Chip, id:8, num:10}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:5, num:8}, {type:BonusType.Chip, id:8, num:8}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:5, num:3}, {type:BonusType.Chip, id:8, num:3}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:4, num:5}, {type:BonusType.Chip, id:8, num:3}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:4, num:5}, {type:BonusType.Chip, id:5, num:3}]},
        6: {rank:51, bonus:[{type:BonusType.Chip, id:3, num:5}, {type:BonusType.Chip, id:6, num:5}]},
        7: {rank:101, bonus:[{type:BonusType.Chip, id:3, num:5}, {type:BonusType.Chip, id:4, num:5}]},
        8: {rank:501, bonus:[{type:BonusType.Chip, id:2, num:2}, {type:BonusType.Chip, id:6, num:3}]},
        9: {rank:1001, bonus:[{type:BonusType.Chip, id:2, num:2}, {type:BonusType.Chip, id:4, num:3}]},
        10: {rank:10001, bonus:[{type:BonusType.Chip, id:1, num:2}, {type:BonusType.Chip, id:6, num:1}]},
        11: {rank:100000, bonus:[{type:BonusType.Chip, id:1, num:1}, {type:BonusType.Chip, id:4, num:1}]},
    },
    3:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:0, num:10}, {type:BonusType.Diamond, num:150}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:0, num:8}, {type:BonusType.Diamond, num:120}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:0, num:5}, {type:BonusType.Diamond, num:100}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:0, num:3}, {type:BonusType.Diamond, num:80}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:0, num:1}, {type:BonusType.Diamond, num:60}]},
        6: {rank:51, bonus:[{type:BonusType.Money, num:5000}, {type:BonusType.Diamond, num:50}]},
        7: {rank:101, bonus:[{type:BonusType.Money, num:3000}, {type:BonusType.Diamond, num:30}]},
        8: {rank:501, bonus:[{type:BonusType.Money, num:2500}, {type:BonusType.Diamond, num:20}]},
        9: {rank:1001, bonus:[{type:BonusType.Money, num:1800}, {type:BonusType.Diamond, num:15}]},
        10: {rank:10001, bonus:[{type:BonusType.Money, num:1500}, {type:BonusType.Diamond, num:10}]},
        11: {rank:100000, bonus:[{type:BonusType.Money, num:1000}, {type:BonusType.Diamond, num:5}]},
    },
    4:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:0, num:10}, {type:BonusType.Diamond, num:150}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:0, num:8}, {type:BonusType.Diamond, num:120}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:0, num:5}, {type:BonusType.Diamond, num:100}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:0, num:3}, {type:BonusType.Diamond, num:80}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:0, num:1}, {type:BonusType.Diamond, num:60}]},
        6: {rank:51, bonus:[{type:BonusType.Money, num:5000}, {type:BonusType.Diamond, num:50}]},
        7: {rank:101, bonus:[{type:BonusType.Money, num:3000}, {type:BonusType.Diamond, num:30}]},
        8: {rank:501, bonus:[{type:BonusType.Money, num:2500}, {type:BonusType.Diamond, num:20}]},
        9: {rank:1001, bonus:[{type:BonusType.Money, num:1800}, {type:BonusType.Diamond, num:15}]},
        10: {rank:10001, bonus:[{type:BonusType.Money, num:1500}, {type:BonusType.Diamond, num:10}]},
        11: {rank:100000, bonus:[{type:BonusType.Money, num:1000}, {type:BonusType.Diamond, num:5}]},
    },
    5:{
        1: {rank:1, bonus:[{type:BonusType.Chip, id:0, num:10}, {type:BonusType.Diamond, num:150}]},
        2: {rank:2, bonus:[{type:BonusType.Chip, id:0, num:8}, {type:BonusType.Diamond, num:120}]},
        3: {rank:3, bonus:[{type:BonusType.Chip, id:0, num:5}, {type:BonusType.Diamond, num:100}]},
        4: {rank:4, bonus:[{type:BonusType.Chip, id:0, num:3}, {type:BonusType.Diamond, num:80}]},
        5: {rank:11, bonus:[{type:BonusType.Chip, id:0, num:1}, {type:BonusType.Diamond, num:60}]},
        6: {rank:51, bonus:[{type:BonusType.Money, num:5000}, {type:BonusType.Diamond, num:50}]},
        7: {rank:101, bonus:[{type:BonusType.Money, num:3000}, {type:BonusType.Diamond, num:30}]},
        8: {rank:501, bonus:[{type:BonusType.Money, num:2500}, {type:BonusType.Diamond, num:20}]},
        9: {rank:1001, bonus:[{type:BonusType.Money, num:1800}, {type:BonusType.Diamond, num:15}]},
        10: {rank:10001, bonus:[{type:BonusType.Money, num:1500}, {type:BonusType.Diamond, num:10}]},
        11: {rank:100000, bonus:[{type:BonusType.Money, num:1000}, {type:BonusType.Diamond, num:5}]},
    },
};
ActivityRankMax = 100000; //最大可获奖的排名

exports = module.exports = {
    BonusType: BonusType,
    ReturnCode: ReturnCode,
    ReturnCodeName: ReturnCodeName,
    FriendType: FriendType,
    NotifyType: NotifyType,
    PurchaseStatus: PurchaseStatus,
    em_EffectCalcType: em_EffectCalcType,
    em_Effect_Comm: em_Effect_Comm,
    mapOfTechCalcType: mapOfTechCalcType,
    UserStatus: UserStatus,
    RankType: RankType,
    em_Condition_Checkmode: em_Condition_Checkmode,
    em_Condition_Type: em_Condition_Type,
    em_task_status: em_task_status,
    em_task_type: em_task_type,
    StaticTaskList: StaticTaskList,
    ActionExecuteType: ActionExecuteType,
    TollgateType: TollgateType,
    TollgateState: TollgateState,
    OperEnum: OperEnum,
    CommMode: CommMode,
    GuideList: GuideList,
    ActivityType: ActivityType,
    ActivityStatus: ActivityStatus,
    ActivityScoreBonus: ActivityScoreBonus,
    ActivityRankBonus: ActivityRankBonus,
    ActivityRankMax: ActivityRankMax,
    ActivityScoreRate: ActivityScoreRate,
    DomainType: DomainType,
    GetDomainType:GetDomainType,
    DomainList: DomainList,
    GetDomainList: GetDomainList,
    DailyActivityStatus: DailyActivityStatus,
    RedisOperFlag: RedisOperFlag,
};
