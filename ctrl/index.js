/**
 * Created by liub on 2017-04-06.
 */
let baseCtl = require('../facade/baseCtl');
let {now, ms,getPeriod} = require('../util/commonFunc');
let {em_Effect_Comm, ActivityType, NotifyType, ActionExecuteType, em_Condition_Type, BonusType, OperEnum, ReturnCode} = require('../const/comm');

class index extends baseCtl {
    /**
     * 用户登录
     * @param user
     * @param objData
     * @returns {Promise.<{}>}
     */
    async 1000(user, objData){
        try{
            return await this.parent.control.login.UserLogin(user, objData)
        }
        catch(e){}
    }
    async login(user, objData){
        try{
            return await this.parent.control.login.UserLogin(user, objData);
        }catch(e){}
    }

    /**
     * 游戏结束后上报积分和获得的金币
     * @param user
     * @param objData
     * @returns {Promise.<void>}
     *
     * @note 测试如下问题：
     * 1、新的高分（包括使用复活道具获得的分数）是否正确刷新
     * 2、每日最高分（不一定是历史最高分）是否正确刷新
     *
     * @todo:
     * 1、需要增加中段验证机制：5分钟内至少提交一次分数刷新请求，需要携带当前authCode，服务端下发新的authCode，如果authCode不一致则分数和奖励被清零
     */
    async 1001(user, objData){
        //对用户输入要有一个合理区间判定，还可能需要频次控制 - 游戏时长决定最高分数和金币：scoreMax = timeLen * 3, moneyMax = timeLen * 1.5
        try{
            if(objData.start == 0){
                //无尽次数不计入totalRound成就 2017.7.21 modified by liub
                //user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.totalRound, 1, this.parent.const.em_Condition_Checkmode.add);

                switch(user.baseMgr.info.role){
                    case 1002:
                        user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.useRole1002, 1, this.parent.const.em_Condition_Checkmode.add);
                        break;
                }

                switch(user.baseMgr.info.scene){
                    case 2002:
                        user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.useScene2002, 1, this.parent.const.em_Condition_Checkmode.add);
                        break;
                }

                user.battleMoney = 0;
                user.battltTime = now();
                return {code:this.parent.const.ReturnCode.Success};
            }
            else{
                let tl = Math.min(1800, !!user.battltTime ? now() - user.battltTime : 0); //限制最大值
                let _score = parseInt(objData.score);

                //计算实际所得金币
                let _money = user.refreshEffect().CalcFinallyValue(
                    em_Effect_Comm.MoneyAdded, 
                    parseInt(objData.money) - user.battleMoney
                ) | 0;
                user.battleMoney = parseInt(objData.money);

                let resultOk = (_score<50 && _money<50) || (_score <= tl * 9 && _money < tl * 4.5);
                if(this.parent.sysCur.debug || resultOk){
                    user.baseMgr.info.score = _score;   //总榜和好友榜
                    user.baseMgr.info.scored = _score;  //每日榜

                    //region 任务检测
                    user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.roundScore, user.baseMgr.info.score, this.parent.const.em_Condition_Checkmode.absolute);
                    user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.roundMoney, _money, this.parent.const.em_Condition_Checkmode.absolute);
                    user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.death, 1, this.parent.const.em_Condition_Checkmode.add);
                    user.baseMgr.task.Execute(this.parent.const.em_Condition_Type.totalMoney, _money, this.parent.const.em_Condition_Checkmode.add);
                    //endregion

                    if(!this.parent.sysCur.debug){
                        // 此接口经测试不可用（appid非法），好友积分&排名已调整为本地管理
                        // let rt = await this.parent.service.txApi.set_achievement(user, this.parent.sysCur.auth.pf, _score);
                        // if(rt.ret != 0){
                        //     console.log(rt);
                        // }
                    }

                    user.baseMgr.info.AddRes(BonusType.Money, _money);

                    return {
                        code:this.parent.const.ReturnCode.Success,
                        data:{
                            id: user.id,
                            score: user.baseMgr.info.score,
                            rank: user.baseMgr.info.v.rank,
                            scored: user.baseMgr.info.scored,
                            rankd: user.baseMgr.info.v.rankd,
                            money: user.baseMgr.info.GetRes(BonusType.Money)
                        }
                    }
                }
                else{
                    return {code:this.parent.const.ReturnCode.illegalData};
                }
            }
        }
        catch(e){
            console.log(e);
            return {
                code:this.parent.const.ReturnCode.Error
            };
        }
    }

    /**
     * 使用道具
     * @param user
     * @param objData
     * @returns {Promise.<{code, data}|{code}|*>}
     */
    async 1002(user, objData){
        try{
            objData.id = objData.id || 0;
            if(typeof objData.id == 'string'){
                objData.id = parseInt(objData.id);
            }
            return await this.parent.control.item.useItem(user, objData);
        }catch(e){}
    }

    /**
     * 购买道具
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async 1003(user, objData){
        objData.num = Math.max(0, Math.min(200, !!objData.num ? objData.num : 1));

        let bi = this.parent.config.fileMap.shopdata[objData.id];
        if(!!bi){
            let tm = bi.price * objData.num;
            //判断折扣
            let tm1 = bi.times.split(",");
            let now = Date.parse(new Date())/1000;
            if(now >= parseInt(tm1[0]) && now <= parseInt(tm1[1])){
                tm = Math.ceil(tm * bi.discount);
            }
            if(user.baseMgr.info.GetRes(bi.costtype) >= tm){
                if(bi.stack == 1 || !user.baseMgr.item.find(bi.id)){
                    let cb = user.convertBonus(bi.bonus);

                    //进行可用性分析
                    let canExec = true;
                    canExec = canExec && (!user.baseMgr.item.relation(cb, BonusType.Action) || !user.baseMgr.info.isMaxRes(BonusType.Action));
                    //End.

                    if(canExec){
                        user.baseMgr.info.SubRes(bi.costtype, tm);
                        
                        for(let i = 0; i< objData.num; i++){
                            user.getBonus(cb);
                        }
                        return {code:ReturnCode.Success, data:user.baseMgr.item.getList()};
                    }
                    else{
                        return {code:ReturnCode.itemCanntExec};
                    }
                }
                else{
                    return {code:ReturnCode.itemHasOne};
                }
            }
            else{
                return {code:user.baseMgr.info.ResLack(bi.costtype)};
            }
        }
        else{
            return {code:ReturnCode.itemNotExist};
        }
    }

    /**
     * 玩吧兑换金币
     * @param user
     * @param objData
     * @returns {Promise.<Promise.<Promise|{code: number, data: {tradeNo: string}}>|{code: number, data: {tradeNo: string}}>}
     */
    async 1006(user, objData){
        return this.parent.control.shop.BuyItem(user, objData);
    }

    /**
     * 修改道路、场景、角色
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: {scene: (*|number), road: (*|number), role: (*|number)}}>}
     */
    async 1009(user, objData){
        if(!user.baseMgr.item.find(objData.id)){
            return {code:this.parent.const.ReturnCode.itemNotExist};
        }
        let bi = this.parent.config.fileMap.itemdata[objData.id];
        if(!!bi){
            switch(bi.type){
                case this.parent.const.BonusType.Role:
                    user.baseMgr.info.role = objData.id;
                    break;
                case this.parent.const.BonusType.Scene:
                    user.baseMgr.info.scene = objData.id;
                    break;
                case this.parent.const.BonusType.Road:
                    user.baseMgr.info.road = objData.id;
                    break;
            }
            return {code:this.parent.const.ReturnCode.Success, data:{
                scene: user.baseMgr.info.scene,
                road: user.baseMgr.info.road,
                role: user.baseMgr.info.role,
            }};
        }
        else{
            return {code:ReturnCode.itemNotExist};
        }
    }

    /**
     * 分享获得复活道具
     * @param user
     * @param objData
     * @returns {Promise.<{code: number}>}
     */
    async 1010(user, objData){
        return this.parent.control.social.share(user, objData);
    }

    /**
     * 获取背包列表
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async 2001(user, objData){
        try{
            return await this.parent.control.item.list(user);
        }catch(e){}
    }

    /**
     * 获取总榜信息
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async 9000(user, objData){
        return this.parent.control.rank.GetRankData(user, objData, this.parent.const.RankType.total);
    }

    /**
     * 获取每日排行榜
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: {}}>}
     */
    async 9001(user, objData){
        return this.parent.control.rank.GetRankData(user, objData, this.parent.const.RankType.daily);
    }

    /**
     * 获取公司排行榜
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async 9003(user, objData){
        return this.parent.control.rank.GetRankData(user, objData, this.parent.const.RankType.friend);
    }

    /**
     * 获取活动排行信息
     */
    async 9005(user){
        return this.parent.service.activity.getList(user);
    }

    /**
     * 获取好友排行榜
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: {}}>}
     */
    async 9002(user, objData){
        try{
            let cache = await user.baseMgr.txFriend.getFriendList();

            let fns = Object.keys(cache).reduce((sofar, cur)=>{
                if(cur != user.openid){
                    sofar.push({openid:cur});
                }
                return sofar;
            }, [{openid:user.openid}]);

            if(!!fns && fns.length > 0){
                //好友列表：包括自身openid
                //let fns = [{openid:'666'},{openid:'555'},{openid:'777'},{openid:'999'}]; //配合mocha的测试数据
                let result = await this.parent.remoteCallReturn('getFriendRankList', {list:fns, filter:true});
                //原先在Index上排序后返回，考虑到Index的负载压力，现在改为返回到Logic后再排序 - 2017.5.28 by liub
                result.data.list.sort((s1, s2)=>{
                    return s2.score - s1.score;
                });
                for(let idx in result.data.list){
                    result.data.list[idx].rank = parseInt(idx) + 1;
                    if(result.data.list[idx].openid == user.openid){
                        user.baseMgr.task.Execute(
                            this.parent.const.em_Condition_Type.onRankFriendOfWeek,
                            result.data.list[idx].rank,
                            this.parent.const.em_Condition_Checkmode.absolute
                        );
                    }
                }

                return result;
            }
            else{
                return {code: ReturnCode.Success, data:{list: []}};
            }
        }catch(e){}
    }

    /**
     * 获取系统配置文件（JSON）
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async config(user, objData) {
        if(objData.file == "sys"){ //禁止客户端直接访问系统配置文件
            return {code: this.parent.const.ReturnCode.illegalData};
        }

        try{
            return await this.parent.config.getConfigFile(objData.file);
        }catch(e){}
    }

    /**
     * 获取当前的加持效果
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: (Promise|*)}>}
     */
    async getEffect(user, objData){
        return {code: this.parent.const.ReturnCode.Success, data: user.getEffect()};
    }

    /**
     * 社交类操作统一接口
     * @param {*} user 
     * @param {*} objData 
     */
    async sendHello(user, objData){
        return await this.parent.control.social.action(user, objData);
    }

    /**
     * 收获好友点的赞，得到随机奖励
     * @param user
     * @param objData
     */
    async bonusHello(user, objData){
        objData.actionType = NotifyType.socialBonusHello;
        return await this.parent.control.social.action(user, objData);
    }
    /**
     * 附加新手引导接口
     * @param {*} user
     * @param {*} objData
     */
    async checkGuide(user, objData){
        let id = this.parent.const.GuideList[user.baseMgr.vip.GuideNo].next;
        return id;
    }
    /**
     * 礼包统一接口
     * @param {*} user 
     * @param {*} objData
     * objData.type 1:新用户礼包，2：累计7日登陆礼包，3：中秋礼包，4：国庆活动礼包，5：国庆活动累计消费礼包，6：国庆活动角色培养礼包 
     */
    async getGift(user,objData){
		if(typeof objData.type != "number"){
            objData.type = parseInt(objData.type);
        }
        let bonus = null;	
        switch(objData.type){
            case 1:
                if(!user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetNewbieBonus)){
                    user.baseMgr.info.SetStatus(this.parent.const.UserStatus.isGetNewbieBonus);
                    bonus = this.parent.config.fileMap.vip.newbieGift;
                    user.getBonus(bonus);
                    return {code:ReturnCode.Success,data:{bonus:bonus}};
                }
                else {
                    return {code:ReturnCode.taskBonusHasGot};
                }
                break;
            case 2:
                bonus = user.baseMgr.task.getBonus("3003");
                if(bonus != '-1' && bonus != '-2'){
                    return {code:ReturnCode.Success,data:{bonus:[{type: this.parent.const.BonusType.VIP,num:1}]}};
                }
                else {
                    return {code:ReturnCode.taskNotFinished};
                }
                break;
            case 3:
                if(!user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetFestivalGift)){
                    user.baseMgr.info.SetStatus(this.parent.const.UserStatus.isGetFestivalGift);
                    bonus = this.parent.config.fileMap.vip.festivalGift;
                    user.getBonus(bonus);
                    return {code:ReturnCode.Success,data:{bonus:bonus}};
                }
                else {
                    return {code:ReturnCode.taskBonusHasGot};
                }
                break;
            default:
                return {code:ReturnCode.illegalData};
                break;
        }
            
    }
    /**
     * 节日礼包统一接口
     * @param {*} user 
     * @param {*} objData
     * objData.type 1：国庆活动礼包，2：国庆活动累计消费礼包，3：国庆活动角色培养礼包 ,4：统一节日礼包,5：节日期间累计时间礼包
     */
    async getFesGift(user,objData){
		if(typeof objData.type != "number"){
            objData.type = parseInt(objData.type);
        }
        let bonus = null;	
        switch(objData.type){
            case 1:
                if(getUnixtime() >= getUnixtime("10 9,2017 0:0:0") || getUnixtime() < getUnixtime("10 1,2017 0:0:0")){
                    return {code:ReturnCode.illegalData};
                }
                if(!user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetNinjaGift)){
                    user.baseMgr.info.SetStatus(this.parent.const.UserStatus.isGetNinjaGift);
                    bonus = this.parent.config.fileMap.vip.NinjaGift;
                    user.getBonus(bonus);
                    return {code:ReturnCode.Success,data:{bonus:bonus}};
                }
                else {
                    return {code:ReturnCode.taskBonusHasGot};
                }
                break;
            case 2:
                if(getUnixtime() >= getUnixtime("10 9,2017 0:0:0") || getUnixtime() < getUnixtime("10 1,2017 0:0:0")){
                    return {code:ReturnCode.illegalData};
                }
                bonus = user.baseMgr.task.getBonus("1055");
                if(bonus != '-1' && bonus != '-2'){
                    return {code:ReturnCode.Success,data:{bonus:[{type: this.parent.const.BonusType.Chip,id:33,num:55}]}};
                }
                else {
                    return {code:ReturnCode.taskNotFinished};
                }
                break;
            case 3:
                if(getUnixtime() >= getUnixtime("10 9,2017 0:0:0") || getUnixtime() < getUnixtime("10 1,2017 0:0:0")){
                    return {code:ReturnCode.illegalData};
                }
                if(user.baseMgr.item.getItem(1031) && user.baseMgr.item.getItem(1031).lv >= 3){
                    if(!user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetNarutoGift)){
                        user.baseMgr.info.SetStatus(this.parent.const.UserStatus.isGetNarutoGift);
                        bonus = [{type: this.parent.const.BonusType.Chip,id:32,num:30}];
                        user.getBonus(bonus);
                        return {code:ReturnCode.Success,data:{bonus:bonus}};
                    }
                    else {
                        return {code:ReturnCode.taskBonusHasGot};
                    }
                }
                else {
                    return {code:ReturnCode.taskNotFinished};
                }
                break;
            case 4:
                let tm1 = getPeriod("10 22,2017 0:0:0","10 21,2017 0:0:0");
                let tm2 = getPeriod("10 23,2017 0:0:0","10 22,2017 0:0:0");
                let tm3 = getPeriod("10 29,2017 0:0:0","10 28,2017 0:0:0");
                let tm4 = getPeriod("10 30,2017 0:0:0","10 29,2017 0:0:0");
                let tm5 = getPeriod("11 5,2017 0:0:0","11 4,2017 0:0:0");
                let tm6 = getPeriod("11 6,2017 0:0:0","11 5,2017 0:0:0");

                if(!tm1 && !tm2 && !tm3 && !tm4 && !tm5 && !tm6){
                    return {code:ReturnCode.illegalData};
                }
                
                if(!user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetFestivalGift)){
                    user.baseMgr.info.SetStatus(this.parent.const.UserStatus.isGetFestivalGift);

                    if(tm1||tm2){
                        bonus = [{type: this.parent.const.BonusType.Diamond,num:50}];
                    }
                    if(tm3||tm5){
                        bonus = [{type: this.parent.const.BonusType.Chip,id:32,num:2}];
                    }
                    if(tm4||tm6){
                        bonus = [{type: this.parent.const.BonusType.Chip,id:33,num:2}];
                    }
                    user.getBonus(bonus);
                    return {code:ReturnCode.Success,data:{bonus:bonus}};
                }
                else {
                    return {code:ReturnCode.taskBonusHasGot};
                }
                break;
            case 5:
                let d1 = getPeriod("10 23,2017 0:0:0","10 21,2017 0:0:0");
                let d2 = getPeriod("10 30,2017 0:0:0","10 28,2017 0:0:0");
                let d3 = getPeriod("11 6,2017 0:0:0","11 4,2017 0:0:0");
                
                if(!d1 && !d2 && !d3){
                    return {code:ReturnCode.illegalData};
                }
                bonus = user.baseMgr.task.getBonus(objData.stage);
                let taskListStatus = [0,0,0,0,0];
                for(let i = 0; i < taskListStatus.length; i++){
                    if(!user.baseMgr.task.getTaskObj(2002+i)){
                        taskListStatus[i] = 0;
                    }
                    else{
                        taskListStatus[i] = user.baseMgr.task.getTaskObj(2002+i).status;
                    }
                }
                if(bonus != '-1' && bonus != '-2'){
                    return {code:ReturnCode.Success,data:{bonus:user.convertBonus(bonus),list:taskListStatus,time:user.baseMgr.task.getTaskObj(2006).conditionMgr.conList[103].value}};
                }
                else {
                    return {code:ReturnCode.taskNotFinished,data:{list:taskListStatus,time:user.baseMgr.task.getTaskObj(2006).conditionMgr.conList[103].value}};
                }
                break;
            default:
                return {code:ReturnCode.illegalData};
                break;
        }
            
    }
    //获取节日活动信息:当前活动——万圣节周四到周六，持续三周
    async getFesInfo(user,objData){
        if(typeof objData.type != "number"){
            objData.type = parseInt(objData.type);
        }
        let bonus = null;	
        switch(objData.type){
            case 1://万圣节
                let d1 = getPeriod("10 23,2017 0:0:0","10 21,2017 0:0:0");
                let d2 = getPeriod("10 30,2017 0:0:0","10 28,2017 0:0:0");
                let d3 = getPeriod("11 6,2017 0:0:0","11 4,2017 0:0:0");
                if(!d1 && !d2 && !d3){
                    return {code:ReturnCode.Success,data:{status:0}};
                }
                else{
                    return {code:ReturnCode.Success,
                            data:{
                                status:1,
                                gift:user.baseMgr.info.CheckStatus(this.parent.const.UserStatus.isGetFestivalGift)?0:1
                                }
                            };
                }
                break;
            case 2:
                let c1 = getPeriod("10 23,2017 0:0:0","10 21,2017 0:0:0");
                let c2 = getPeriod("10 30,2017 0:0:0","10 28,2017 0:0:0");
                let c3 = getPeriod("11 6,2017 0:0:0","11 4,2017 0:0:0");
                if(!c1 && !c2 && !c3){
                    return {code:ReturnCode.Success,data:{status:0}};
                }    
                else{
                    let taskListStatus = [0,0,0,0,0];
                    for(let i = 0; i < taskListStatus.length; i++){
                        if(!user.baseMgr.task.getTaskObj(2002+i)){
                            taskListStatus[i] = 0;
                        }
                        else{
                            taskListStatus[i] = user.baseMgr.task.getTaskObj(2002+i).status;
                        }
                    }
                    return {code:ReturnCode.Success,
                            data:{
                                status:1,
                                list:taskListStatus,
                                time:user.baseMgr.task.getTaskObj(2006).conditionMgr.conList[103].value
                                }
                            };
                }
                break;
            default:
                return {code:ReturnCode.illegalData};
                break;

        }
    }

    sceneShare(user,objData){
        if(typeof objData.type != "number"){
            objData.type = parseInt(objData.type);
        }
        let bonus = null;
        switch(objData.type){
            case 1:
                bonus = [{type:BonusType.Diamond, num:50}];
                user.getBonus(bonus);
                user.notify({type: NotifyType.sceneShare, info: {bonus:bonus}});
                return {code:ReturnCode.Success};
                break;
            default:
                return {code:ReturnCode.illegalData};
                break;
        }
    }
    /**
     * 用户客户端获取服务端时间戳
     * @param {*} user 
     */
    getTime(user){
        return {code:ReturnCode.Success,data:{time:Date.parse(new Date())/1000}};
    }

    async test(user,objData){
        return await this.parent.service.fbApi.Test(objData.id,objData.access);
    }
}

exports = module.exports = index;
