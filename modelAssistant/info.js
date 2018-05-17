let CommonFunc = require('../util/commonFunc');
let baseMgr = require('../facade/baseMgr');
let Indicator = require('../util/Indicator'); //标志位管理
let {ReturnCode, BonusType, UserStatus, em_Condition_Type, em_Condition_Checkmode, NotifyType, ActivityType, RankType, em_EffectCalcType,em_Effect_Comm,mapOfTechCalcType} = require('../const/comm');

/**
 * 用户综合信息管理
 */
class info extends baseMgr
{
	constructor(parent){
		super(parent, 'info');

        //	数据
        this.v 				= {
            name: "",
            //	邀请码
            invCode		: '',
            //	头像
            headIcon	: 0,
            //	文化值 (公司等级)
            level		: 0,
            //	体力
            ap 			: 15,
            //	金钱
            money		: this.parent.router.DataConst.threshold.moneyOfInit,
            diamond		: 0,

            //	排行榜
            rank		: 0, //总榜
            rankd       : 0, //日常
            rankc       : 0, //公司
            score: 0,//玩家当前最高分数
            scored: 0,//玩家每日最高分数

            role: 0,//玩家当前使用的角色ID
            scene:0,//玩家当前使用的场景ID
            road: 0,//玩家当前使用的道路ID

            refresh                     : 0,//刷新时间
            date: '',     //刷新日期，用于每日任务
			//用户复合状态字段
			status						: 0,
        };

        this.actionData = {
            cur:0,              //当前值
            max:0,              //最大值
            refreshTime:0,      //下一次刷新，如果体力已满则为0
            peroid:0,           //刷新周期（每个周期一点）
            diamond:0,          //钻石
            money:0,            //金币
        };
	}

    _Init(val){
        try{
            this.v = (!val||val == "" ) ? {} : JSON.parse(val);

            if(!this.v.diamond){
                this.v.diamond = 0;
            }
            if(!this.v.status){
                this.v.status = 0;
            }
        }
        catch(e){
            this.v = {
                "name": this.parent.name,
                "id": this.parent.id,
                "domain": this.parent.domain,
                "uuid": this.parent.uuid,
                "invCode": "",
                "headIcon": "",
                "level": 0,
                "ap": this.parent.router.DataConst.action.init,
                "money": this.parent.router.DataConst.threshold.moneyOfInit,
                "diamond":0,
                "rank": 0,
                "score": 0,
                "status": 0
            };
        }

        if(!this.v.refresh){
            this.v.refresh = CommonFunc.now();
        }
        if(!this.v.date){
            this.v.date = (new Date()).toDateString();
        }
    }

    get name(){
        return this.v.name;
    }
    set name(val){
        this.v.name = val;
        this.dirty = true;
    }

    SetStatus(val, send=true){
        let ns = Indicator.inst(this.v.status).set(val).value;
        if(this.v.status != ns){
            this.v.status = ns;
            this.parent.user.status = this.v.status;
            this.dirty = true;

            if(send){
                //通知自己的客户端状态发生了变化
                this.parent.notify({type:NotifyType.status, info:this.v.status});
            }

            switch(val){
                case UserStatus.gaming:
                case UserStatus.online:
                case UserStatus.slave:
                case UserStatus.master:
                    //将新的状态登记到索引服上
                    this.parent.router.notifyEvent('user.newAttr', {user: this.parent, attr:{type:'status', value: this.v.status}});

                    //通知所有好友，状态发生了变化
                    this.parent.socialBroadcast({type: NotifyType.userStatus, info: {id:this.parent.openid, value:this.v.status}});
                    break;

                default:
                    break;
            }
        }
    }
	UnsetStatus(val, send=true){
        let ns = Indicator.inst(this.v.status).unSet(val).value;
        if(this.v.status != ns){
            this.v.status = ns;
            this.parent.user.status = this.v.status;
            this.dirty = true;

            if(send){
                //通知自己的客户端状态发生了变化
                this.parent.notify({type:NotifyType.status, info:this.v.status});
            }

            switch(val){
                case UserStatus.gaming:
                case UserStatus.online:
                case UserStatus.slave:
                case UserStatus.master:
                    //通知所有好友，状态发生了变化
                    this.parent.socialBroadcast({type: NotifyType.userStatus, info: {id:this.parent.openid, value:this.v.status}});
                    //将新的状态登记到索引服上
                    this.parent.router.notifyEvent('user.newAttr', {user: this.parent, attr:{type:'status', value: this.v.status}});
                    break;

                default:
                    break;
            }
        }
    }
    CheckStatus(val){
    	return Indicator.inst(this.v.status).check(val);
    }
    GetStatus(){
        return this.v.status;
    }

    get score(){
	    if(!this.v.score){
	        this.v.score = 0;
        }
        return this.v.score;
    }
    set score(val){
        val = parseInt(val);
        if(val > this.v.score){//分数只能高不能低
            this.dirty = true;

            this.parent.user.score = val; //设置数据库中的独立字段score的值
            this.parent.router.notifyEvent('user.newAttr', {user:this.parent, attr:{type:'score', value:val}});//发送"创造新纪录"事件

            this.v.score = val;
            //	更新当前玩家的排行榜情况
            this.parent.router.control.rank.UpdateRankData(this.parent.router.const.RankType.total, this.parent);
        }
    }
    get scored(){
        if(!this.v.scored){
            this.v.scored = 0;
        }
        return this.v.scored;
    }
    set scored(val){
        val = parseInt(val);
        if(val == 0 || val > this.v.scored){//分数只能高不能低
            this.dirty = true;

            this.v.scored = val;
            //	更新当前玩家的排行榜情况
            this.parent.router.control.rank.UpdateRankData(this.parent.router.const.RankType.daily, this.parent);
        }
    }
    get role(){
        if(!this.v.role){
            this.v.role = 0;
        }
        return this.v.role;
    }
    set role(val){
        this.v.role = parseInt(val);
        this.parent.user.role = this.v.role; //设置数据库中的独立字段
        //角色形象发生变化
        this.parent.router.notifyEvent('user.newAttr', {user: this.parent, attr:{type:'role', value:this.v.role}});
        this.dirty = true;
    }
    get scene(){
        if(!this.v.scene){
            this.v.scene = 0;
        }
        return this.v.scene;
    }
    set scene(val){
        this.v.scene = parseInt(val);
        this.dirty = true;
    }
    get road(){
        if(!this.v.road){
            this.v.road = 0;
        }
        return this.v.road;
    }
    set road(val){
        this.v.road = parseInt(val);
        this.dirty = true;
    }
    //	设置等级
    set level(val) {
        val = parseInt(val);
        if(val > this.v.level){//分数只能高不能低
            this.dirty = true;
            this.v.level = val;
            //	更新当前玩家的排行榜情况
            this.parent.router.control.rank.UpdateRankData(this.parent.router.const.RankType.friend, this.parent);
        }

    };
    //	获取等级
    get level() {
		return this.v.level;
    };

    /**
     * 是否机器人
     * @returns {boolean}
     */
    getRobot(){
        return (this.v.robot == null) ? false : this.v.robot;
    }
    /**
     * 设置为机器人
     */
    setRobot(){
        this.v.robot = true;
        this.dirty = true;
    }

    /**
     * 设置排名
     * @param rank
     * @param rType
     * @constructor
     */
    SetRank (rank, rType = RankType.total) {
        this.dirty = true;
        switch(rType){
            case RankType.friend:
                this.v.rankc = rank;
                this.parent.baseMgr.task.Execute(em_Condition_Type.onRankCompany, rank, em_Condition_Checkmode.absolute);
                break;
            case RankType.daily:
                this.v.rankd = rank;
                this.parent.baseMgr.task.Execute(em_Condition_Type.onRankDaily, rank, em_Condition_Checkmode.absolute);
                break;
            case RankType.total:
                this.v.rank = rank;
                this.parent.baseMgr.task.Execute(em_Condition_Type.onRank, rank, em_Condition_Checkmode.absolute);
                break;
            default:
                break;
        }
	};

    /**
     * 获取排名
     * @param rType
     * @returns {number}
     * @constructor
     */
    GetRank (rType = RankType.total) {
        switch(rType){
            case RankType.daily: return this.v.rankd || 0;
            case RankType.friend: return this.v.rankc || 0;
            default: return this.v.rank || 0;
        }
	};

    //	设置邀请码
    SetInvCode (invCode) {
		this.v.invCode = invCode;
	};
    //	获取邀请码
    GetInvCode () {
		return this.v.invCode;
	};
    //	设置头像
    SetHeadIcon (headIcon) {
		this.v.headIcon = headIcon;
		this.dirty = true;
	};
    //	获取头像
    GetHeadIcon() {
		return this.v.headIcon;
	};
    
    //region 体力管理
    /**
     * 自动恢复体力
     */
    AutoAddAP() {
        let recover = Math.max(1, this.parent.refreshEffect().CalcFinallyValue(em_Effect_Comm.ActionRecover, this.parent.router.DataConst.action.add) | 0);
        let $iHourSecond = this.parent.refreshEffect().CalcFinallyValue(em_Effect_Comm.DiscountActionTime, this.parent.router.DataConst.action.iHourSecond) | 0;
        this.actionData.refreshTime = 0;
        
        //首先判断体力值是否已满，如果已满甚至已经超过最大值，就不要更新了，这样避免了体力被强制平仓
        if(!this.isMaxRes(BonusType.Action)){
            let ct = CommonFunc.now();

            let passSecond 	= ct - this.v.refresh;
            if(passSecond < 0){
                this.v.refresh = ct;
            }
            else{
                let rec = (passSecond / $iHourSecond) | 0;
                if(rec > 0){
                    this.AddRes(BonusType.Action, rec * recover);
                    this.v.refresh += rec * $iHourSecond;
                }
            }

            this.actionData.refreshTime = (this.actionData.cur == this.actionData.max) ? 0 : this.v.refresh + $iHourSecond - ct;
        }
        this.actionData.peroid = $iHourSecond / recover;
    };

    /**
     * 返回体力描述信息结构
     */
    getActionData(){
        this.actionData.cur = this.GetRes(BonusType.Action);
        this.actionData.max = this.GetResMaxValue(BonusType.Action);
        this.actionData.money = this.GetRes(BonusType.Money);
        this.actionData.diamond = this.GetRes(BonusType.Diamond);
        return this.actionData;
    }

    //endregion

    //region 统一的资源操作接口
    GetRes($type){
        switch($type){
            case BonusType.Money:
        		return this.v.money;

            case BonusType.Diamond:
                return this.v.diamond;

            case BonusType.Action:
                return this.v.ap;
                
            default:
                return 0;
        }
    }
    /**
     * 资源缺乏时的返回码
     * @param {*}  
     */
    ResLack($type){
        switch($type){
            case BonusType.Diamond:
                return ReturnCode.DiamondNotEnough;

            case BonusType.Action:
                return ReturnCode.ActionNotEnough;
                
            case BonusType.Money:
        		return ReturnCode.MoneyNotEnough;

            default:
        		return ReturnCode.Error;
        }
    }

    SubRes($type, num){
        let $num = CommonFunc.ZeroBaseInt(num);

        switch($type){
            case BonusType.Diamond:
                this.v.diamond = Math.max(0, this.v.diamond - $num);

                //任务检测
                this.parent.baseMgr.task.Execute(em_Condition_Type.totalSpendDiamond, $num, em_Condition_Checkmode.add);
                //累计分段积分
                this.parent.router.service.activity.addScore(this.parent.id, ActivityType.Diamond, $num);
                break;

            case BonusType.Action:
                this.AutoAddAP(); //检测体力自动恢复

                this.v.ap = Math.max(0, this.v.ap - $num);

                //任务检测
                this.parent.baseMgr.task.Execute(
                    em_Condition_Type.useAction,
                    Math.abs($num),
                    em_Condition_Checkmode.add
                );
                //累计分段积分
                this.parent.router.service.activity.addScore(this.parent.id, ActivityType.Action, $num);
                break;

            case BonusType.Money:
                this.v.money = Math.max(0, this.v.money - $num);
                
                 //任务检测
                this.parent.baseMgr.task.Execute(em_Condition_Type.totalSpendMoney, $num, em_Condition_Checkmode.add);
                //累计分段积分
                this.parent.router.service.activity.addScore(this.parent.id, ActivityType.Money, $num);
                break;
        }
        this.dirty = true;
        this.parent.notify({type: NotifyType.action, info: this.getActionData()});
    }
    isMaxRes($type){
        return this.GetRes($type) >= this.GetResMaxValue($type);
    }
    GetResMaxValue($type){
        switch($type){
            case BonusType.Action:
                return this.parent.router.DataConst.action.max;
        }
        return 9007199254740992;
    }
    AddRes($type, num, max=true){
		let $num = CommonFunc.ZeroBaseInt(num);

        switch($type){
            case BonusType.Diamond:
                this.v.diamond += $num;
                break;

            case BonusType.Action:
                let ap = this.v.ap + $num;
                ap = ap || 0;
                this.v.ap = !!max ? 
                    Math.max(0, Math.min(ap, this.GetResMaxValue(BonusType.Action))) : 
                    Math.max(0, ap);

                break;

            case BonusType.Money:
                this.v.money = this.v.money + $num;
                break;
        }
        this.dirty = true;
        this.parent.notify({type: NotifyType.action, info: this.getActionData()});
    }
    //endregion
}

exports = module.exports = info;