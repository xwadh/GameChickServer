/**
 * Created by Administrator on 2017-05-13.
 */
let {ReturnCode, CommMode} = require('../const/comm');
let FacadeOfBase = require('./FacadeOfBase');

let socketClient = require('socket.io-client');
let activityMonitor = require('../logic/autoExec/activityMonitor');

/**
 * 逻辑服对应的门面类
 */
class FacadeOfLogic extends FacadeOfBase {
    constructor($env){
        super($env);
    }

    async Start(app){
        super.Start(app);

        //载入路由配置
        this.tools.filelist.mapPath('router').map(fl=>{
            let id = fl.name.split('.')[0];
            app.use("/", require(`../router/${id}`));
        });

        //中间件设定
        this.middleSetOfSocket = {
            "query"        : [this.middleware.parseParams, this.middleware.commonHandle],
            "config"        : [this.middleware.parseParams, this.middleware.commonHandle],
            "remoteLogic"   : [this.middleware.parseParams, this.middleware.commonHandle],
            "default"       : [this.middleware.parseParams, this.middleware.authHandle, this.middleware.commonHandle, this.middleware.afterHandle],
        };

        console.time('Load Db');
        await this.service.activity.loadDb(); //首先载入活动信息，后续的用户积分信息才能顺利注册
        Promise.all([
            this.service.mails.loadAll(),       //载入邮件
            this.service.users.loadAll(),       //载入用户
            this.service.log.loadAll(),         //载入消费日志
        ]).then(()=>{
            console.timeEnd('Load Db');
            console.log(`${this.sysCur.serverType}.${this.sysCur.serverId}: 数据载入完成，准备启动网络服务...`);

            //启动对外网络服务
            this.StartSocketServer(app);
            
            //region 建立内部RPC机制
            this.initConnector("Index", 1);
            //endregion
        }).catch(e=>{
            console.log(e);
        });

        //事件映射
        this.eventHandleList = {};
        this.tools.filelist.mapPath('events').map(srv=>{
            let handle = require(srv.path).handle;
            let handleName = !!srv.cname ? `${srv.cname}.${srv.name.split('.')[0]}` : `${srv.name.split('.')[0]}`;
            this.eventHandleList[handleName] = handle.bind(this);
        });

        //活动检测
        this.taskMgr.addMonitor(new activityMonitor());
    }

    /**
     * 远程调用 - 负责处理Index 和 Logic 之间的通讯
     * @param $func         函数名称
     * @param $params       传入参数
     * @param $callback     回调，可为空
     */
    remoteCall($func, $params, $callback){
        let attr = {
            control: "remoteIndex", //目前只支持与IndexServer定向通讯
            func: $func,
            msg: $params,
        };

        if(!this.remoting.user){ //尚未登录，补充登录信息
            attr.oemInfo = {openid:"system", openkey: this.sysCur.admin.role.system};
            attr.stype =  this.sysCur.serverType;
            attr.sid = this.sysCur.serverId;
        }

        if(!!$callback){
            this.remoting.emit('req', attr, $callback);
        }
        else{
            this.remoting.emit('notify', attr);
        }
    }

    /**
     * 远程调用索引服/逻辑服的功能，直接返回结果
     * @param $func
     * @param $params
     * @returns {Promise.<*>}
     */
    async remoteCallReturn($func, $params){
        try{
            return await new Promise(resolve => {
                this.remoteCall($func, $params, ret =>{
                    resolve(ret);
                });
            });
        }catch(e){
            console.error(e);
        }
    }

    /**
     * 一个逻辑服对另一个逻辑服发起调用
     * @param {*} func              //方法名称
     * @param {*} params            //方法形参数组
     * @param {*} openid            //目标用户，用于定位目标逻辑服
     */
    async rpcCall(func, params, openid = ''){
        try{
            let [sname, sfunc] = func.split('.');
            if(!!sname && !!sfunc){
                let local = !!openid && !!this.service.users.GetUserByDomainId(`tx.${this.sysCur.serverType}.${openid}`);
                if(local){
                    if(!!this.service[sname] && !!this.service[sname][sfunc]){
                        try{
                            return await this.service[sname][sfunc](...params);
                        }
                        catch(e){
                            console.error(e);
                        }
                    }
                }
                else{
                    return await this.remoteCallReturn('remoteLogic', {
                        openid:openid,          //指定openid，用于定位目标逻辑服
                        sname:sname,            //指定调用的service名称
                        sfunc:sfunc,            //指定调用的service的方法名
                        params:params           //指定调用参数
                    });
                }
            }
        }
        catch(e){
            console.error(e);
        }
    }

    /**
     * 创建进行远程访问的客户端
     * @param stype     //远程服务器类型
     * @param sid       //远程服务器编号
     */
    initConnector(stype, sid){
        if(!!this.remoting){
            this.remoting.removeAllListeners();
            this.remoting.disconnect();
            this.remoting = null;
        }

        //注意：访问的是目标服务器的mapping（外部映射）地址
        this.remoting = socketClient(`${this.sysCur.UrlHead}://${this.serversInfo[stype][sid].webserver.mapping}:${this.serversInfo[stype][sid].webserver.port}`, {'force new connection': true})
        .on('req', (msg, fn) => {//监听JSONP请求 
            this.onSocketReq(this.remoting, msg, fn).catch(e=>{console.log(e);});
        })
        .on('notify', msg => {//监听JSONP请求
            this.onSocketReq(this.remoting, msg, null).catch(e=>{console.log(e);});
        })
        .on('disconnect', ()=>{//断线重连
            console.log(`${this.sysCur.serverType}.${this.sysCur.serverId} disconnect`);
            this.remoting.stamp = (new Date()).valueOf();
            this.remoting.user = null;
            this.remoting.needConnect = true;
            setTimeout(()=>{
                if(this.remoting.needConnect){
                    this.remoting.needConnect = false;
                    this.remoting.connect();
                }
            }, 1500);
        })
        .on('connect', ()=>{//向Index Server汇报自身的身份
            console.log(`${this.sysCur.serverType}.${this.sysCur.serverId} connected`);
            this.remoteCall('serverLogin', {}, msg => {
                if(msg.code == ReturnCode.Success){
                    console.log(`${this.sysCur.serverType}.${this.sysCur.serverId} logined`);
                    this.remoting.stamp = (new Date()).valueOf();
                    this.remoting.user = {stype: this.sysCur.serverType, sid: this.sysCur.serverId, socket: this.remoting};
                }
                else{
                    console.log(`${this.sysCur.serverType}.${this.sysCur.serverId} failed login`);
                }
            })
        });
    }
}

exports = module.exports = FacadeOfLogic;