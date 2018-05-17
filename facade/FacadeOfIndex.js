/**
 * Created by Administrator on 2017-05-13.
 */
let {RedisOperFlag, UserStatus, CommMode} = require('../const/comm');
let Indicator = require('../util/Indicator'); //标志位管理
let FacadeOfBase = require('./FacadeOfBase');
let CacheManager = require('../util/cache');
let dailyActivityMonitor = require('../logic/autoExec/dailyActivityMonitor');
let Lock = require('../util/Lock');
let locker = new Lock(true);

/**
 * 索引服对应的门面类
 */
class FacadeOfIndex extends FacadeOfBase
{
    constructor($env){
        super($env);
        this.testRoute = new Set(); //直连测试服的openid列表
    }

    routeList(){
        let ret = [];
        this.testRoute.forEach((item, sameItem, s)=>{
            ret.push(item);
        })
        if(ret.length == 0){
            ret.push('添加测试路由');
        }
        return ret;
    }

    async Start(app){
        super.Start(app);

        [
            {path:"/", handle:"thirdPart"},
        ].map(rt=>{
            app.use(rt.path, require(`../router/${rt.handle}`));
        });

        //中间件设定
        this.middleSetOfSocket = {
            "Console"    : [this.middleware.parseParams, this.middleware.commonHandle],
            "config"        : [this.middleware.parseParams, this.middleware.commonHandle],
            "remoteIndex"   : [this.middleware.parseParams, this.middleware.authRemote, this.middleware.commonHandle],
            //"admin"         : [this.middleware.parseParams, this.middleware.authAdmin, this.middleware.commonHandle],
            "default"       : [],
        };

        //redis访问
        this.cacheMgr = new CacheManager(this);

        console.time('Load Db');
        await this.service.dailyactivity.loadDb(); //载入世界Boss活动信息
        this.loadAllUsers(()=>{
            console.timeEnd('Load Db');
            console.log(`${this.sysCur.serverType}.${this.sysCur.serverId}: 数据载入完成，准备启动网络服务...`);
            this.StartSocketServer(app);
        });

        //世界Boss活动检测，只在Index Server上进行
        this.taskMgr.addMonitor(new dailyActivityMonitor());
    }

    /**
     * 远程调用，支持req和notify两种方式
     * @param si            //服务器类型、编号
     * @param $func         //远程函数名称
     * @param $params       //参数数组
     * @param $cb           //回调，为空则表示notify
     * @returns {Promise.<{code: number}>}
     */
    async remoteCall(si, $func, $params, $cb){
        $params = $params || {};
        let svr = this.service.users.getServer(si.stype, si.sid);
        if(!!svr && !!svr.socket){
            try{
                let _control = 'remoteLogic';
                switch(si.stype){
                    case 'Image':
                        _control = 'remoteImage';
                        break;
                    default:
                        break;
                }

                if(!!$cb){
                    svr.socket.emit('req', {
                        control: _control,
                        func: $func,
                        msg: $params,
                    }, $cb);
                }
                else{
                    svr.socket.emit('notify', {
                        control: _control,
                        func: $func,
                        msg: $params,
                    });
                }
            }
            catch(e){
                console.log(e);
            }
        }
        else{
            return {code: this.const.ReturnCode.Error};
        }
    }

    /**
     * 远程调用: 直接返回调用结果
     * @param si     逻辑服类型、逻辑服编号
     * @param $call     远程调用函数名
     * @param info      待转发的消息体
     */
    async remoteCallReturn(si, $func, $params){
        try{
            let re = await new Promise(resolve => {
                this.remoteCall(si, $func, $params, ret =>{
                    resolve(ret);
                });
            });

            return re;
        }
        catch(e){
            console.error(e);
        }
        return {code: this.const.ReturnCode.Error};
    }

    /**
     * 根据DomainId列表，批量查询并返回用户对象列表
     * @param {*} list 
     */
    async getUserIndexOfAll(list){
        let ret = {};
        let query = await this.cacheMgr.get(list);
        if(!!query){
            query.map(uo=>{
                if(!!uo){ //由于对用户领域进行了猜测，这里要判断下查询结果是否为空
                    ret[`${uo.domain}.${uo.openid}`] = uo;
                }
            });
        }
        return ret;
    }

    /**
     * 检索用户所在服务器信息, 如果是新用户则采用负载均衡模式分配目标服务器
     * @param domainId
     * @param openid
     */
    async getUserIndex(domain, openid, register=false){
        //计算用户唯一标识串
        let domainId = `${domain}.${openid}`;

        let unLock = await locker.lock(domainId);
        try{
            let uo = await this.cacheMgr.get(domainId);
            if(!!uo){
                uo.status = Indicator.inst(uo.status).unSet(UserStatus.isNewbie).value;
            }
            else if(register){ //新用户注册
                //检测逻辑服类型
                let stype = "IOS"; //默认的逻辑服类型
                let pl = domain.split('.');
                if(pl.length > 1){
                    switch(pl[1]){//穷举所有有效的逻辑服类型
                        case "IOS":
                        case "Android":
                        case "Test":
                            stype = pl[1];
                            break;
                    }
                }
                if(!this.serversInfo[stype]){//非法类型
                    return null;
                }

                //负载均衡
                let serverId = (this.hashCode(domainId) % this.serverNum(stype)) + 1;   //通过hash计算命中服务器编号
                let sn = `${stype}.${serverId}`;

                //避免新用户进入不合适的服务器（人数超限或状态不正常）
                let recy = 0, isFind = false;
                while(recy++ < this.serverNum(stype)){//检测服务器人数和运行状况
                    let svr = this.service.users.getServer(stype, serverId);
                    if(!!svr && this.service.users.userNum[sn] < this.sysCur.MaxRegister){
                        isFind = true;
                        break;
                    }

                    serverId = serverId % this.serverNum(stype) + 1; //循环递增
                    sn = `${stype}.${serverId}`;
                }
                
                if(!isFind){
                    return null;
                }

                //寻找到了合适的服务器，累计服务器人数
                this.service.users.userNum[sn] += 1;
                
                //为注册用户预登记
                uo = {
                    hisGateNo: 1,
                    role: 1001,
                    name: '',
                    icon: '',
                    stype:stype, 
                    sid:serverId, 
                    score:0, 
                    status: UserStatus.isNewbie,
                    domain:domain, 
                    openid:openid
                }
                await this.setUserIndex(uo);
            }
            return uo;
        }
        finally{
            unLock();
        }
    }

    /**
     * 将用户对象存回Redis
     * @param {*} uo 
     */
    async setUserIndex(uo){
        if(!!uo && uo.domain && uo.openid){
            await this.cacheMgr.set(`${uo.domain}.${uo.openid}`, uo, RedisOperFlag.Promisify);
        }
    }

    /**
     * 加载全部用户索引
     * @returns {Promise.<void>}
     */
    async loadAllUsers(cb){
        try{
            //遍历所有服务器，以便加载所有逻辑服用户的索引
            for(let stype in this.serversInfo){
                if(stype == "IOS" || stype == "Android"){
                    for(let id in this.serversInfo[stype]){
                        let item = this.serversInfo[stype][id];
                        await this.service.users.loadIndex(item.mysql.db, item.mysql.sa, item.mysql.pwd, stype, id); //载入分服的用户
                    }
                }
            }
            //载入Index管理员信息
            // this.service.users.loadAll().then(()=>{
            // }).catch(e=>{});

            cb(); //外部传入的回调
        }
        catch(e){
            console.error(e);
        }
    }
}

exports = module.exports = FacadeOfIndex;