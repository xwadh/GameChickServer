var CommonFunc	= require('./../util/commonFunc.js');
var CUser 		= require('./../model/User.js');
let {UserStatus, ReturnCode} = require('../const/comm');
let monitor = require('../logic/autoExec/monitor');

/**
 * 用户集合管理类
 */
class users
{
    constructor(parent)
    {
        this.parent = parent;
        this.userList = {};		    //用户对象map
        this.userNameId = {};		//用户名称-ID键值对
        this.userDomainIdId = {};	//用户UUID-ID键值对
        this.userToken = {};        //用户Token-ID键值对
        this.uidList = [];          //所有用户的ID的集合
        this.preList = {};          //用户预注册列表 - 索引服和逻辑服之间数据校验用
        this.userNum = {};          //各逻辑服当前注册用户数
    }
    /**
     * 根据id，从数据库直接查询用户信息
     * @param id
     * @param res
     * @returns {Promise.<void>}
     */
    async findUser(id, res){
        try{
            let ret = await this.parent.models.User().findAll({
                //attributes: ['id', 'name'],
                where:{
                    id:id
                }
            });
            res.end(JSON.stringify(ret));
        }catch(e){
            res.end();
        }
    };

    /**
     * 校验来访用户身份是否合法
     * @param domainId
     * @returns {number}
     */
    authUserByToken(token){
        let id = !token ? 0 : this.userToken[token];
        if(!!this.userList[id]){
            if(!!this.userList[id].time && CommonFunc.now() - this.userList[id].time < 3600*2){
                return id;
            }
            else{
                delete this.userToken[token]; //令牌过期
            }
        }
        return 0;
    };

    authUserByDomainId(domainId){
        let id = this.GetIdByDomainId(domainId);
        if(!!this.userList[id]){
            return id;
        }
        return 0;
    };

    /**
     * 通过名字找到ID
     * @param userName
     * @returns {*}
     * @constructor
     */
    GetIdByName(userName) {
        return this.userNameId[userName];
    }
    /**
     * 通过ID 找名字
     * @param userId
     * @returns {*}
     * @constructor
     */
    GetNameById(userId) {
        return this.userList[userId].name;
    }

    /**
     * 通过DomainId 获取id
     * @param domainId
     * @returns {*}
     * @constructor
     */
    GetIdByDomainId(domainId) {
        if (!domainId || '' == domainId) {
            return 0;
        }
        return this.userDomainIdId[domainId];
    }

    GetUserByDomainId(domainId){
        let id = this.GetIdByDomainId(domainId);
        if(id <= 0){
            return null;
        }
        return this.GetUser(id);
    }

    /**
     * 根据用户ID返回某个玩家的信息，查询失败返回Null
     * @param userId	用户ID
     * @returns {*}
     * @constructor
     */
    GetUser(userId) {
        if(!!this.userList[userId]){
            return this.userList[userId];
        }
        else{
            return null;
        }
    }

    GetUserByName(name){
        let uid = this.GetIdByName(name);
        if(!uid){
            uid = this.GetIdByName(decodeURIComponent(name));
        }
        if(!uid){
            uid = this.GetIdByName(encodeURIComponent(name));
        }
        if(!!uid){
            let uo = this.GetUser(uid)
            if(!!uo){
                return {id: uid, name:name, openid:uo.openid};
            }
        }
        return null;
    }

    /**
     * 获取随机用户 - 排除指定ID
     * @param exceptUserId
     * @returns {*}
     * @constructor
     */
    GetRandomUser(exceptUserId) {
        if (this.uidList.length < 2) {
            return nulll;
        }

        let pUser = null;
        while(!pUser || pUser.id == exceptUserId){
            let index = CommonFunc.GetRandomInt(0, this.uidList.length - 1);
            if (index < 0 || index >= this.uidList.length) {
                return null;
            }
            pUser = this.userList[this.uidList[index]];
        }
        return pUser;
    }

    getDefaultValue(userName, domain, openid){
        return {
            name:userName,
            info:`{"name": "", "id": 0, "domain":"${domain}", "uuid": "${openid}","invCode": "","headIcon": "","level": 0,"ap": ${this.parent.DataConst.action.init},"money": ${this.parent.DataConst.threshold.moneyOfInit}, "diamond":0, "score":0, "rank": 0,"status": 0}`,
            rank: '{}',
            login: '{}',
            item: '{}',
            txinfo: '{"openid": "","openkey": "","pf": "","nickname": "","gender": "","figureurl": "","is_blue_vip": false,"is_blue_year_vip": false,"blue_vip_level": 0,"is_super_blue_vip": false}',
            txFriend: '{"friendList": {}}',
        };
    }

    /**
     * 索引服通知预注册
     * @param oemInfo
     */
    preLogin(oemInfo){
        if(!this.preList){
            this.preList = {};
        }

        let domainId = `${oemInfo.domain}.${oemInfo.openid}`;
        this.preList[domainId] = oemInfo;
        return {code: ReturnCode.Success};
    }

    /**
     * 通过uuid创建玩家
     * @param userName
     * @param domain
     * @param openid
     * @returns {Promise.<*>}
     */
    async CreateNewUser(userName, domain, openid) {
        let domainId = `${domain}.${openid}`;

        //预登录检测，设定一些例外的情形
        let passway = (this.parent.sysCur.serverType == "Index" && domain == "admin") //对管理员登录Index服务器，不做预登录检测
            || this.parent.sysCur.debug; // 测试模式
        if(!passway){
            if(    !this.preList
                || !this.preList[domainId]
                || this.preList[domainId].openid != openid
                || this.preList[domainId].domain != domain){
                return null;
            }
            // 为避免新用户连接索引服后，因通讯失败反复连接逻辑服而造成注册失败，先注释以下语句
            // else{
            //     delete this.preList[domainId];
            // }
        }

        try{
            let it = await this.parent.models.User().findCreateFind({
                where:{
                    domain:domain,
                    uuid:openid
                },
                defaults: this.getDefaultValue(userName, domain, openid),
            });
            let dbUser = it[0];
            let ret = this.mapUser(new CUser(dbUser, this.parent));              //建立内存用户对象
            if(dbUser.$options.isNewRecord){//新创建的记录
                ret.baseMgr.info.SetStatus(UserStatus.isNewbie, false);
                this.parent.notifyEvent('user.afterRegister', {user:ret});
            }
            else{//已有的记录
                ret.baseMgr.info.UnsetStatus(UserStatus.isNewbie, false);
            }
            return ret;
        }
        catch(e){
            console.error(e);
            return null;
        }
    }

    /**
     * 为用户创建反向索引
     * @param pUser
     */
    mapUser(pUser){
        pUser.domainId = pUser.user.domain + '.' + pUser.user.uuid;
        if(!this.userList[pUser.user.id]){
            this.userList[pUser.user.id] = pUser;           //添加到字典
            this.uidList.push(pUser.user.id);               //添加用户ID到集合
            this.userNameId[pUser.user.name] = pUser.user.id;   //建立反向索引
            this.userDomainIdId[pUser.domainId] = pUser.user.id;   //建立反向索引

            this.parent.control.rank.LoadRankData(this.parent.const.RankType.friend, pUser);
            this.parent.control.rank.LoadRankData(this.parent.const.RankType.total, pUser);
            this.parent.control.rank.LoadRankData(this.parent.const.RankType.daily, pUser);
        }

        //载入玩家的活动参与信息
        if(pUser.baseMgr.vip.v.aId > 0){
            this.parent.service.activity.setScore(pUser, pUser.baseMgr.vip.v.aId, pUser.baseMgr.vip.v.aScore, pUser.baseMgr.vip.v.aLv);
        }

        //添加VIP标志监控器，以便定时检测该标记是否失效
        if(pUser.baseMgr.info.CheckStatus(UserStatus.isVip) || pUser.baseMgr.vip.valid){
            this.parent.taskMgr.addMonitor(new monitor(pUser.id));
        }

        return pUser;
    }

    /**
     * 获取总的用户数
     * @returns {Number}
     */
    get total(){
        return this.uidList.length;
    }

    /**
     * 加载所有用户
     * @returns {Promise.<void>}
     */
    async loadAll (db, sa, pwd){
        let curDay = (new Date()).toDateString();

        db = db || this.parent.sysCur.mysql.db;
        sa = sa || this.parent.sysCur.mysql.sa;
        pwd = pwd || this.parent.sysCur.mysql.pwd;

        try{
            let ret = await this.parent.models.User(db, sa, pwd).findAll();
            ret.map(it=>{
                if(it.domain == ""){
                    it.domain = "official";
                }

                let pUser = new CUser(it, this.parent);
                if(curDay != pUser.getRefreshDate()){//数据跨天
                    pUser.baseMgr.info.v.scored = 0; //清空用户过期的每日榜分数，之所以修改info.v.scored而不是info.scored，是为了不在载入阶段触发排序事件
                }
                this.mapUser(pUser);
            });

            this.parent.control.rank.sortRank();
        }catch(e){}
    };

    /**
     * 加载所有用户的索引
     * @returns {Promise.<void>}
     */
    async loadIndex(db, sa, pwd, serverType, serverId){
        db = db || this.parent.sysCur.mysql.db;
        sa = sa || this.parent.sysCur.mysql.sa;
        pwd = pwd || this.parent.sysCur.mysql.pwd;

        let dl = []; //准备写入Redis中的用户对象
        try{
            let sn = `${serverType}.${serverId}`; //服务器唯一编号
            //累计当前服的总人数
            if(!this.userNum[sn]){
                this.userNum[sn] = 0;
            }

            let ret = await this.parent.models.User(db, sa, pwd).findAll({attrbutes:["id", "score", "domain", "uuid", "pet", "name", "status", "hisGateNo", "role"]});
            for(let it of ret){
                this.userNum[sn] += 1;

                if(it.domain == ""){
                    it.domain = "official";
                }

                let un = `${it.domain}.${it.uuid}`; //用户唯一编号
                let uo = {
                    name: it.name,
                    score: it.score,
                    hisGateNo: it.hisGateNo,
                    status: it.status,
                    role: it.role,
                    domain: it.domain,
                    openid: it.uuid,
                    icon: it.pet,
                    stype:serverType,
                    sid: serverId
                };

                dl.push({key:un, value:uo});
            }

            if(dl.length >= 100){
                this.parent.cacheMgr.setAll(dl);//批量写入
                dl = [];
            }
        }catch(e){}

        if(dl.length > 0){ //别忘了将余量写入Redis
            this.parent.cacheMgr.setAll(dl);
            dl = [];
        }
    };

    //region 逻辑服管理
    /**
     * 为集群中的服务器创建反向索引
     * @param {*} svr       逻辑服描述对象
     * @param {*} clear     清除标志
     */
    mapServer(svr, clear = false){
        svr.domainId = `${svr.domain}.${svr.stype}.${svr.sid}`;

        if(!!clear){
            if(!!this.userList[svr.domainId]){
                delete this.userList[svr.domainId];//删除字典条目
            }
            return null;
        }

        this.userList[svr.domainId] = svr;           //添加到字典
        return svr;
    }

    /**
     * 反向查询服务器信息
     * @param stype     //逻辑服类型
     * @param sid       //逻辑服编号
     * @returns {*}
     */
    getServer(stype, sid){
        let domainId = `system.${stype}.${sid}`;
        return this.userList[domainId];
    }

    getServerTotal(){
        return Object.keys(this.userList).length;
    }

    /**
     * 遍历所有逻辑服
     * @param $cb
     */
    forServers($cb){
        Object.keys(this.userList).map(idx=>{
            let srv = this.userList[idx];
            if(srv.stype == "IOS" || srv.stype== "Android"){
                return $cb(srv);
            }
        });
    }
    //endregion    
}
exports = module.exports = users;
