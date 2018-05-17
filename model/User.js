let Sequelize = require('sequelize');
let conn = require('../util/sequel');
let EffectManager = require('../logic/EffectManager');
let ChatPrivateManager = require('../logic/ChatPrivateManager');
let updateMgr       = require('../util/updateMgr');
let {DomainType, DomainList,GetDomainType, ActivityType, em_Condition_Type,em_Condition_Checkmode, UserStatus, ReturnCode, ActionExecuteType, NotifyType, BonusHead, BonusType} = require('../const/comm');
let commonFunc = require('../util/commonFunc');

class UserEntity{
    /**
     * 构造函数
     * @param {User} user 
     * @param {FacadeOfBase} router 
     */
	constructor(user, router){
        this.router = router;       //路由管理对象
        this.privateChatMgr = new ChatPrivateManager(this);
	    this.dirty = false;//脏数据标志
        this.user = user; //存储ORM对象

		this.time = 0;
		this.sign = '';
		this.appId = '';
		this.serverId = '';

		//腾讯大厅
		this.openkey = '';//这个值是有时效的，所以不保存入数据库，每次去获取
		this.pf = '';//标识腾讯的来源渠道
		//腾讯大厅 end

        //载入全部全局服务对象
        this.baseMgr = {};
        this.router.tools.filelist.mapPath('modelAssistant').map(srv=>{
            let srvObj = require(`../modelAssistant/${srv.name}`);
            this.baseMgr[srv.name.split('.')[0]] = new srvObj(this);
        });

        //利用反序列化对象，填充各个成员对象
        Object.keys(this.baseMgr).map($key=>{
            let $value = this.baseMgr[$key];
            $value._Init(this.user[$value.attribute]);
        });

        if(!this.baseMgr.info.v.refresh){
            this.baseMgr.info.v.refresh = commonFunc.now();
        }
        this.baseMgr.info.v.id = this.user.id;

		//效果管理器
        this.effectMgr = new EffectManager();
    }
    
    /**
     * 固定时间间隔的滴答操作，由底层自动调用
     */
    tick(){
        this.baseMgr.vip.checkSweep(); //检测扫荡是否结束，如果结束则自动计算奖励
        this.baseMgr.slave.CheckStatus(); //释放到期奴隶，或者解放自身
    }

    /**
     * 广播消息给所有好友
     */
    socialBroadcast(msg){
        Object.keys(this.baseMgr.txFriend.friends).map(openid=>{
            this.socialNotify(msg, openid);
        });
    }

    DelegateByOpenid(cb, openid){
        if(!openid || openid == this.openid){
            cb(this);
        }
        else{
            this.domainList.map(domain=>{
                let friend = this.router.service.users.GetUserByDomainId(`${domain}.${openid}`);
                if(!!friend){
                    cb(friend);
                }
            });
        }
    }

    /**
     * 发送消息给指定好友
     */
    socialNotify(msg, openid){
        if(!openid || this.openid == openid){
            this.$handleSocialMsg(msg);
        }
        else{
            this.domainList.map(domain=>{
                let friend = this.router.service.users.GetUserByDomainId(`${domain}.${openid}`);
                if(!!friend){
                    friend.$handleSocialMsg(msg);
                }
                else{
                    //远程通告：在原始消息msg的外围，包裹上目标用户的信息
                    this.router.remoteCall('userNotify', {domain: domain, openid: openid, msg: msg});
                }
            });
        }
    }

    /**
     * 获取社交链逻辑中，当前用户关联的领域列表
     */
    get domainList(){
        if(!DomainList[this.domain]){
            return DomainTable[DomainType.OFFICIAL];
        }
        else{
            return DomainList[this.domain];
        }
    }

    /**
     * 获取当前用户的领域类型
     */
    get domainType(){
        return GetDomainType(this.domain);
    }

    /**
	 * 处理收到的社交消息，包括直接收到的，以及通过索引服务器中转后收到的
     * @param msg
     */
	$handleSocialMsg(msg){
        switch(msg.type){
            case NotifyType.slaveFlattery: //奴隶：谄媚
                this.router.notifyEvent('user.slave.flattery', {user:this, msg:msg});
                break;
            case NotifyType.slaveCommend: //奴隶：表扬
                this.router.notifyEvent('user.slave.commend', {user:this, msg:msg});
                break;
            case NotifyType.slaveEscaped://起义 - 必须参加一场战斗，战斗获胜方可获得自由
                this.router.notifyEvent('user.slave.escape', {user:this, msg:msg});
                break;
            case NotifyType.slaveRansom://赎身 - 使用道具即可立即获得自由
                this.router.notifyEvent('user.slave.ransom', {user:this, msg:msg});
                break;
            case NotifyType.slaveRelease://释放
                this.router.notifyEvent('user.slave.release', {user:this, msg:msg});
                break;
            case NotifyType.slaveCatched: //抓捕结果
                this.router.notifyEvent('user.slave.catched', {user:this, msg:msg});
                break;
            case NotifyType.slaveLash://鞭挞
                this.router.notifyEvent('user.slave.lash', {user:this, msg:msg});
                break;
            case NotifyType.slaveFood://加餐
                this.router.notifyEvent('user.slave.food', {user:this, msg:msg});
                break;
            case NotifyType.slaveAvenge://复仇
                this.router.notifyEvent('user.slave.avenge', {user:this, msg:msg});
                break;
            case NotifyType.mail: //发送邮件
                this.router.service.mails.add(this, msg.info.con, msg.info.src, msg.info.dst);
                break;
            case NotifyType.DailyActivityBonus://下发活动奖励
                this.router.service.mails.add(this, msg, 'system', this.openid);//发邮件
                this.notify(msg);//发通知
                break;
            case NotifyType.DailyActivityInstantBonus:
                this.baseMgr.item.useItem(702,msg.info.num); //扣取活动道具
                this.getBonus(msg.info.bonus);
                this.notify(msg);//发通知
                break;
                
            case NotifyType.socialSendAction:   //赠送体力
                this.notify(msg);

                msg.info.bonus = {type:BonusType.Action, num:1};
                this.router.service.mails.add(this, msg, "system", this.openid);

                break;

            case NotifyType.socialSendHello://点赞
                if(this.baseMgr.txFriend.recvHello(msg)){
                    this.notify(msg);
                }
                break;

            case NotifyType.userStatus: //好友状态发生变化
                //刷新好友的状态
                
                //下发通知
                this.notify(msg);
                break;

            default:
                this.notify(msg);
                break;
        }
	}

    /**
     * 向客户端推送消息,格式固定为:{type, info}，其中type为推送消息类型，引用自NotifyType, info为推送消息内容
     * @param msg  
     *
     * @note
     *      原始消息为msg，抛出时包裹了socket信息，实际下发时会自动剥离，最终下发的消息仍旧为原始msg
     */
    notify(msg){
        this.router.notifyEvent('socket.userNotify', {sid: this.socket, msg: msg});
    }

	/**
     * 当前的技能效果
     */
    refreshEffect(){
	    let st = [
	    	this.baseMgr.vip,
        ];
	    if(st.reduce((sofar, item)=>{ return sofar || item.effectMgr.isEffectChanged}, false)){
	        st.reduce((sofar, item)=>{ return sofar.Add(item.refreshEffect());}, this.effectMgr.Clear());
        }
        return this.effectMgr;
    }
    getEffect(){
        return this.refreshEffect().effectList;
    }

    /**
	 * 读取脏数据标志
     * @returns {*}
     */
    get dirty(){
        return this.isDirty;
    }

    /**
	 * 设置脏数据标志
     * @param val
     */
    set dirty(val){
        this.isDirty = val;
        if(this.isDirty){
            this.router.notifyEvent('user.update', {id:this.id});
        }
    }

	/**
	 * 设置最后刷新日期
	 * @param {*}  
	 */
	setRefreshDate($val){
		this.baseMgr.info.v.date = $val;
        this.baseMgr.info.dirty = true;
	}
	/**
	 * 读取最后刷新日期
	 */
	getRefreshDate(){
		return this.baseMgr.info.v.date;
	}

    //  写入附加信息
    WriteUserInfo(_appId, _serverId, _time, _sign){
    	this.dirty = true;
        this.appId = _appId;
        this.serverId = _serverId;
        this.sign = _sign;
        this.time = _time;
    };
	get id(){
    	return this.user.id;
	}
	get name(){
        return this.user.name;
	}
	set name(val){
		this.user.name = val;
	}
	get domain(){
        return this.user.domain;
    }
    //腾讯大厅
    GetOpenKey() {
		if (this.baseMgr.txInfo && this.baseMgr.txInfo.GetOpenKey()) {
			return this.baseMgr.txInfo.GetOpenKey();
		}
		return this.openkey;
	}
    SetOpenKey(openkey) {
		this.openkey = openkey;
		if (this.baseMgr.txInfo) {
			this.baseMgr.txInfo.SetOpenKey(openkey);
		}
	}
    GetPf () {
		if (this.baseMgr.txInfo && this.baseMgr.txInfo.GetPf()) {
			return this.baseMgr.txInfo.GetPf();
		}
		return this.pf;
	}
    SetPf(pf) {
		this.pf = pf;
		if (this.baseMgr.txInfo) {
			this.baseMgr.txInfo.SetPf(pf);
		}
	}
	//设置腾讯会员信息
    async SetTxInfo(txuserdata) {
		if (this.baseMgr.txInfo) {
			if (txuserdata) {
                let nw = [];
				if (txuserdata.openkey != undefined) {
					this.SetOpenKey(txuserdata.openkey);
					this.baseMgr.txInfo.SetOpenKey(txuserdata.openkey);
				}
				if (txuserdata.pf != undefined) {
					this.SetPf(txuserdata.pf);
					this.baseMgr.txInfo.SetPf(txuserdata.pf);
				}
				if (txuserdata.nickname != undefined) {
                    let nm = encodeURIComponent(txuserdata.nickname); //转码
                    this.name = nm;

                    nw.push({type:'name', value:nm});//更新名称
				}
				if (txuserdata.gender != undefined) {
					this.baseMgr.txInfo.SetGender(txuserdata.gender);
				}
				if (txuserdata.figureurl != undefined && txuserdata.figureurl != "") {
                    // this.user.pet = this.router.tools.urlToCdn(txuserdata.figureurl); //保存到数据库pet字段
                    this.user.pet = txuserdata.figureurl;
                    nw.push({type:'icon', value:this.user.pet});//更新头像

					this.baseMgr.txInfo.SetFigureurl(this.user.pet);
					this.baseMgr.info.SetHeadIcon(this.user.pet);
				}
				if (txuserdata.is_blue_vip != undefined) {
					this.baseMgr.txInfo.SetBlueVip(txuserdata.is_blue_vip);
				}
				if (txuserdata.is_blue_year_vip != undefined) {
					this.baseMgr.txInfo.SetBlueYearVip(txuserdata.is_blue_year_vip);
				}
				if (txuserdata.blue_vip_level != undefined) {
					this.baseMgr.txInfo.SetBlueVipLevel(txuserdata.blue_vip_level);
				}
				if (txuserdata.is_super_blue_vip != undefined) {
					this.baseMgr.txInfo.SetSuperBlueVip(txuserdata.is_super_blue_vip);
                }

                if(nw.length > 0){
                    this.router.notifyEvent('user.newAttr', {user:this, attr:nw});//发送"更新名称"事件
                }
			}
		}
	}
    //腾讯大厅 end

	get openid(){
		return this.user.uuid;
	}
	set openid(val){
		this.user.uuid = val;
		this.dirty = true;
	}

    //	获取
    GetInfo() {
		let ret = {};
		Object.keys(this.baseMgr).map($key=>{
            ret[this.baseMgr[$key].attribute] = this.baseMgr[$key]._QueryInfo();
        });

		return ret;
	}
	$getBonus(bonus){
        if(bonus.constructor == String){
            bonus = JSON.parse(bonus);
        }

        //	处理实际奖励获得
        switch (bonus.type) {
            case BonusType.Revive:	//目前已合并到Item中，不再单独使用
            case BonusType.Item:
                this.baseMgr.item.addItem(bonus.id, bonus.num);
                break;
            case BonusType.Chip: //角色碎片
                if(bonus.id == 0){ //随机碎片 2017.7.13
                    let rate = Math.random() /*随机数*/, cur = 0/*记录累计概率*/;
                    for(let rid of Object.keys(this.router.config.fileMap.roledata)) {
                        cur +=  this.router.config.fileMap.roledata[rid].rate; //从角色表中获取掉率并进行累计
                        if(rate < cur) { //本次随机数小于累计概率，找到符合条件的碎片
                            bonus.id = this.router.config.fileMap.roledata[rid].pieceid;
                            break;
                        }
                    }
                }
                if(bonus.id>0){
                    this.baseMgr.item.addItem(bonus.id, bonus.num);
                }
                break;
			case BonusType.Road:
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.totalRoad, 1, this.router.const.em_Condition_Checkmode.add);
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.getRoad, bonus.id, this.router.const.em_Condition_Checkmode.absolute);
                this.baseMgr.item.addItem(bonus.id, 1);
				break;
			case BonusType.Role:
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.totalRole, 1, this.router.const.em_Condition_Checkmode.add);
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.getRole, bonus.id, this.router.const.em_Condition_Checkmode.absolute);
                this.baseMgr.item.addItem(bonus.id, 1);
            	break;
			case BonusType.Scene:
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.totalScene, 1, this.router.const.em_Condition_Checkmode.add);
                this.baseMgr.task.Execute(this.router.const.em_Condition_Type.getScene, bonus.id, this.router.const.em_Condition_Checkmode.absolute);
                this.baseMgr.item.addItem(bonus.id, 1);
            	break;
            case BonusType.Money:
            case BonusType.Action:
            case BonusType.Diamond:
                this.baseMgr.info.AddRes(bonus.type, bonus.num, false);//可以超过上限
                break;
			case BonusType.VIP:
                this.baseMgr.vip.increase(bonus.num);
                break;
			case BonusType.Box:
                let bi = this.router.config.fileMap.shopdata[bonus.id];
                if(!!bi){
                	this.getBonus(bi.bonus);
				}
				break;
        }
    }

    /**
	 * 获取奖励
     * @param bonus
     */
    getBonus(bonus){
		if(!bonus){
			return;
		}

        if(bonus.constructor == String){
            this.getBonus(JSON.parse(bonus));
        }
        else if(bonus.constructor == Array){
            bonus.map(item=>this.$getBonus(item));
        }
        else{
            this.$getBonus(bonus);
        }
	}

    /**
	 * 将奖励字符串转化为奖励对象数组
     * @param bonusStr
     * @returns {*}
     */
	convertBonus(bonusStr){
    	return bonusStr.split(';').reduce((sofar, cur)=>{
            let info = cur.split(',');
            if(info.length == 2){
                sofar.push({type: info[0], num: parseInt(info[1])});
			}
			else if(info.length == 3){
                sofar.push({type: info[0], id: parseInt(info[1]), num: parseInt(info[2])});
			}
            return sofar;
		}, []);
	}

    /**
     * 将变动的数值持久化到数据库
	 * @note 只在最关键如支付时直接调用，一般依赖脏数据检测自动调用
     */
    Save () {
		//将子对象序列化以便持久化到数据库
		let isDirty = false;
		for(let $key in this.baseMgr){
			if(this.dirty || this.baseMgr[$key].dirty){
				this.user[this.baseMgr[$key].attribute] = this.baseMgr[$key].ToString();
				this.baseMgr[$key].dirty = false;
				isDirty = true;
			}
		}
		this.dirty = isDirty;
		//End

        if(this.dirty){
            this.dirty = false;
            this.user.save();
        }
	}

    /**
     * 检测和跨天相关的数据
     * @param day       //检测日期
     */
    checkDailyData(day){
        if(day != this.getRefreshDate()){//跨天登录
            //改写最后登录日期
            this.setRefreshDate(day);

            //重置每日任务
            this.baseMgr.task.InitDailyTask();
            //重置行为限制对象
            this.baseMgr.action.Reset();
            //重置每日榜分数
            this.baseMgr.info.scored = 0;
            //清除每日社交互动数据
            this.baseMgr.txFriend.DailyRefresh();
            //重置节日礼包领取状态
            if(this.baseMgr.info.CheckStatus(UserStatus.isGetFestivalGift)){
                this.baseMgr.info.UnsetStatus(UserStatus.isGetFestivalGift);
            }
            //登记回头率
            let t1 = Date.parse(this.user.createdAt.toDateString())/1000;
            let t2 = Date.parse(day)/1000;
            let tp = ((t2-t1)/(3600*24)) | 0;

            if(tp == 1 || tp == 3 || tp == 7){
                this.router.models.login().findCreateFind({
                    where:{
                        uid: this.user.id,
                        type: tp
                    },
                    defaults: {uid:this.user.id, type:tp, time: day},
                });
            }
        }
    }
}

//输出类
exports = module.exports = UserEntity;

//建立数据库ORM模型
/**
 mysql 数据类型
 BLOB: BLOB,
 BOOLEAN: BOOLEAN,
 ENUM: ENUM,
 STRING: STRING,
 UUID: UUID,
 DATE: DATE,
 NOW: NOW,
 INTEGER: INTEGER,
 BIGINT: BIGINT,
 REAL: REAL,
 FLOAT: FLOAT,
 TEXT: TEXT
 */
exports.User = (db, sa, pwd, host, port) => conn.seqConnector(db, sa, pwd, host, port).define(
	'user', //默认表名。一般这里写单数，生成时会自动转换成复数形式
	{//主键、created_at、updated_at默认包含，不用特殊定义
        score: Sequelize.INTEGER,
        hisGateNo: Sequelize.INTEGER,
        role: Sequelize.INTEGER,
        status: Sequelize.INTEGER,
        domain: Sequelize.STRING,
		name: Sequelize.STRING,
		uuid: Sequelize.STRING,
		info: Sequelize.STRING,
		rank: Sequelize.STRING,
		login: Sequelize.STRING,
		item: Sequelize.STRING,
        friend: Sequelize.STRING,
		vip: Sequelize.STRING,
        hudong: Sequelize.STRING,
		txinfo: Sequelize.STRING,
		txFriend: Sequelize.STRING,
		pet: Sequelize.STRING,
	},
    {
        // 自定义表名
        'freezeTableName': true,
        'tableName': 'users',
        // 是否需要增加createdAt、updatedAt、deletedAt字段
        'timestamps': true,
        // true表示删除数据时不会进行物理删除，而是设置deletedAt为当前时间
        'paranoid': false
    }
);
