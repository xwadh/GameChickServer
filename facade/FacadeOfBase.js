/**
 * Created by Liub on 2017-05-13.
 */
let net = require('net');
let HeadBodyBuffers = require('head_body_buffers').HeadBodyBuffers;
let {CommMode} = require('../const/comm');
let commonFunc = require('../util/commonFunc');

let taskManager = require('../util/taskManager');
let connectMonitor = require('../logic/autoExec/connectMonitor');

let StringDecoder = require('string_decoder').StringDecoder;
let decoder = new StringDecoder();

let io = require('socket.io');                      //websocket库

let fs = require('fs');
let privateKey  = fs.readFileSync('const/server.key', 'utf8');
let certificate = fs.readFileSync('const/server.crt', 'utf8');

/**
 * 门面管理类
 */
class FacadeOfBase
{
    /**
     * 利用反射机制，调用相应的控制器方法
     * @param ctrl
     * @param type
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async callFunc(ctrl, type, user, objData){
        if(this.control.hasOwnProperty(ctrl) && this.control[ctrl].__proto__.hasOwnProperty(type)){
            try{
                return await this.control[ctrl][type](user, objData);
            }
            catch(e){
                return {code: this.const.ReturnCode.Error};
                //throw e;
            }
        }
        return {code: this.const.ReturnCode.Error};
    }

    /**
     * 字符串映射单个整数
     * @param str
     * @returns {number}
     */
    hashCode(str){
        let crc = require('crc-32');
        return Math.abs(crc.str(str));
    }

    /**
     * 创建WS类型的Socket服务
     * @param app
     */
    StartSocketServer(app){
        let httpObj = require(this.sysCur.UrlHead); 
        httpObj.globalAgent.maxSockets = Infinity;
        let hrv = this.sysCur.UrlHead == "https" ? 
            httpObj.createServer(this.credentials, app) : 
            httpObj.createServer(app);

        //启动网络服务
        this.numOfOnline = 0;
        hrv.listen(this.sysCur.webserver.port, this.sysCur.webserver.host, () => {
            console.log(`网络服务在端口 ${this.sysCur.webserver.port} 上准备就绪`);
            //在既有http服务的基础上，创建WebSocket服务
            this.service.io = io(hrv);
            this.service.server = this.service.io.on('connection', socket => {
                if(this.numOfOnline > this.sysCur.MaxConnection){//限制最大连接数
                    socket.disconnect();
                    return;
                }

                //socket.setMaxListeners(200);
                socket.commMode = CommMode.ws;
                socket.once('disconnect', () => {//断线处理
                    socket.removeAllListeners();

                    if(!!socket.user){
                        this.notifyEvent('user.afterLogout', {user:socket.user});
                        socket.user.socket = null;
                        socket.user = null;
                    }
                });

                socket.on('req', (msg, fn) => {//JSONP请求
                    msg.userip = socket.request.connection.remoteAddress; //记录客户端IP
                    this.onSocketReq(socket, msg, fn).then(()=>{}).catch(e=>{console.log(e);});
                });

                socket.on('notify', (msg) => {//客户端通知消息
                    msg.userip = socket.request.connection.remoteAddress; //记录客户端IP
                    this.onSocketReq(socket, msg, null).then(()=>{}).catch(e=>{console.log(e);});
                });
            });
        });

        this.taskMgr.addMonitor(new connectMonitor());
    }

    /**
     * 创建原生Socket服务
     */
    createSocketServer(){
        this.socketServer = net.createServer(socket => {
            socket.commMode =  CommMode.socket;
            socket.setTimeout(2601000);
            socket.setNoDelay(true);
            let hdb = new HeadBodyBuffers(4, data => {
                return data.readUInt32BE(0);
            });
            hdb.on('packet', packet => {
                let head = packet.slice(0, 4);
                let body = packet.slice(4);
                try{
                    let js = decoder.write(body);
                    //console.log(js);
                    let msg = JSON.parse(js);
                    msg.userip = "";
                    this.onSocketReq(socket, msg, ret=>{
                        if(!!ret){
                            let keepAlive = JSON.stringify(ret);
                            let packet = new Buffer(4+ Buffer.byteLength(keepAlive));
                            packet.writeUInt32BE(Buffer.byteLength(keepAlive),0);
                            packet.write(keepAlive,4);
                            socket.write(packet);
                        }
                    }).then(()=>{}).catch(e=>{console.log(e);});
                }
                catch(e){
                    console.log(e);
                }
            });

            socket.on('end', function() {
                socket.removeAllListeners();
            });
            socket.on('data',function(data){
                hdb.addBuffer(data);
            });
            socket.on('timeout',function(){
                socket.end();
            })
            socket.on('error',function(error){
                //console.error(error);
                socket.end();
            })
        });
        this.socketServer.listen(this.sysCur.webserver.socketPort, this.sysCur.webserver.host, ()=> {
            console.log('server start');
        });
        this.socketServer.on('error', error=>{
            console.error(error);
        })
    }

    /**
     * 指定类型的服务器数量
     * @param {*} stype
     */
    serverNum(stype){
        if(!!this.serversInfo[stype]){
            return Object.keys(this.serversInfo[stype]).length;
        }
        return 0;
    }

    /**
     * 构造器，传入外部配置信息
     * @param $env
     */
    constructor($env){
        this.credentials = {key: privateKey, cert: certificate};
        this.sysCur = $env;
        this.config = require('../util/configInterface');  //配置文件管理
        this.DataConst = this.config.fileMap.DataConst;
        this.const = require('../const/comm');
        this.serversInfo = require('../game.config').servers; //服务器配置管理

        let {sign, clone, extendObj} = require('../util/commonFunc');
        //工具箱
        this.tools = {
            sign: sign,
            clone: clone,
            extendObj: extendObj,
            filelist: require('../util/filelist'),
            guid: () => { //取GUID
                function s4() {
                    return Math.floor((1 + Math.random() + ((new Date()).getMilliseconds()/1000)) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            },
            urlToCdn: url => {
                let serverId = (this.hashCode(url) % this.serverNum("Image")) + 1;
                return `${this.sysCur.UrlHead}://${this.serversInfo["Image"][serverId].webserver.mapping}:${this.serversInfo["Image"][serverId].webserver.port}/socialImg?m=${encodeURIComponent(url)}`;
            },
            /**
             * 取数组随机对象
             */
            randObj: arr => {
                if(arr.length == 0){
                    return null;
                }
                else if(arr.length == 1){
                    return this[0];
                }
                else{
                    return arr[(Math.random()*arr.length)|0];
                }
            }
        }

        //载入全部ORM模型
        this.models = {};
        this.tools.filelist.mapPath('model').map(mod=>{
            let mid = mod.name.split('.')[0];
            this.models[mid] = require(`../model/${mod.name}`)[mid];
        });

        //载入全部全局服务对象
        this.service = {};
        this.tools.filelist.mapPath('service').map(srv=>{
            let srvObj = require(`../service/${srv.name}`);
            this.service[srv.name.split('.')[0]] = new srvObj(this);
        });

        this.middleware = {};
        this.tools.filelist.mapPath('middleware').map(srv => {
            let handle = require(srv.path).handle;
            let handleName = !!srv.cname ? `${srv.cname}.${srv.name.split('.')[0]}` : `${srv.name.split('.')[0]}`;
            this.middleware[handleName] = handle;
        });

        //载入全部控制器
        this.control = {};
        this.tools.filelist.mapPath('ctrl').map(ctrl=>{
            let ctrlObj = require(`../ctrl/${ctrl.name}`);
            this.control[ctrl.name.split('.')[0]] = new ctrlObj(this);
        });

        //事件映射
        this.eventHandleList = {};

        //自动执行任务管理器
        this.taskMgr = new taskManager(this);

        //region pm2统计信息

        // let probe = require('pmx').probe();
        // this.metric = probe.metric({
        //     name    : 'Realtime user',
        //     value   : () => {
        //         return this.numOfTotal;
        //     }
        // });
        //
        // // The counter will start at 0
        // this.counter = probe.counter({
        //     name : '鉴权失败次数'
        // });

        // 流量统计
        // this.flowRate = probe.meter({
        //     name      : 'req/sec',
        //     samples   : 1,
        //     timeframe : 60
        // });
        // this.flowRate.mark();

        //endregion
    }

    /**
     * 触发内部自定义事件
     * @param {*} ev 
     * @param {*} data 
     */
    notifyEvent(ev, data){
        if(!!this.eventHandleList[ev]){
            try{
                this.eventHandleList[ev](data);
            }
            catch(e){
                console.error(e);
            }
        }
    }

    /**
     * 直接打印各种对象
     * @param val
     */
    log(val){
        switch(typeof val){
            case 'number':
            case 'string':
            case 'boolean':
                console.log(val);
                break;
            case 'function':
                console.log(val());
                break;
            case 'undefined':
                console.log('err: undefined');
                break;
            default:
                console.log(JSON.stringify(val));
                break;
        }
    }

    /**
     * 检测密码是否有效
     * @param id
     * @param token
     * @returns {boolean}
     */
    checkMobileToken(id, token){
        return this.sysCur.admin.role.default == token;
    }

    /**
     * 认证或生成新的session
     * @param id            手机号
     * @param key           验证码或密码
     * @param session       先前生成的session
     */
    registerSession(id, key, session){
        if(!this.mobileSessions){
            this.mobileSessions = {};
        }
        if(!!session && !!this.mobileSessions[session]
            && ((commonFunc.now() - this.mobileSessions[session].time) < this.sysCur.auth.sessionExp)
            && (this.mobileSessions[session].session == session)
        ){
            return this.mobileSessions[session]; //返回session
        }
        else{
            //如果session不存在，或者已经超过有效期，开始检测验证码或者密码
            if(this.sysCur.debug || (this.checkMobileToken(id, key))){
                session = this.tools.sign({id:id, key: key},this.sysCur.game_secret);
                this.mobileSessions[session] = {openid:id, openkey:key, session: session, time: commonFunc.now()}; //注册新的session
                return this.mobileSessions[session];
            }
            else{
                return null;
            }
        }
    }

    async Start(app){
        app.get('/index.html', async (req, res) => {
            //console.log(`来访URL(${Date()})：${JSON.stringify(req.query)}`);

            let _socket = {};
            try{
                let id = await this.service.users.authUserByToken(req.query.oemInfo.token);
                if(!!id){
                    _socket.user = this.service.users.GetUser(id);
                }

                //提取客户端IP信息
                req.query.userip = req.ip.match(/\d+.\d+.\d+.\d+/)[0];
                let ini = {socket:_socket, msg: req.query, fn: res.send.bind(res), recy:true, facade: this};
                let middles = !!this.middleSetOfSocket[req.query.control] ? this.middleSetOfSocket[req.query.control] : this.middleSetOfSocket["default"];
                if(!!middles){
                    for(let func of middles){
                        if(ini.recy){
                            await func(ini);
                        }
                    }
                }
                else{
                    res.end();
                }
            }catch(e){
                res.end();
            }
        });

        //启动原生Socket服务器
        //this.createSocketServer();
    }

    /**
     * Socket报文处理句柄
     * @param socket                通讯管理器
     * @param msg                   收到的消息
     * @param fn                    回调函数
     * @returns {Promise.<void>}
     */
    async onSocketReq(socket, msg, fn){
        fn = fn || (()=>{});
        msg = msg || {};

        if(!socket.user && !!msg.oemInfo && !!msg.oemInfo.token){
            //根据用户上行的token进行预登录
            let id = this.service.users.authUserByToken(msg.oemInfo.token);
            if(!!id){
                socket.user = this.service.users.GetUser(id);
            }
        }

        let ini = {socket:socket, msg:msg, fn:fn, recy:true, facade: this};
        let middles = !!this.middleSetOfSocket[msg.control] ? this.middleSetOfSocket[msg.control] : this.middleSetOfSocket["default"];
        if(!!middles){
            for(let func of middles){
                if(ini.recy) { //ini.recy控制是否继续循环，如果上一个中间件将其修改为false就可以提前退出后续处理
                    try{
                        await func(ini);
                    }catch(e){
                        console.error(e);
                    }
                }
            }
        }
        else{
            fn({ code: this.const.ReturnCode.routerFailed });
        }
    }

    /**
     * 当前总注册量
     * @returns {Number}
     */
    get numOfTotal(){
        return this.service.users.total;
    }

    /**
     * 遍历在线用户
     * @param cb
     */
    forAll(cb){
        Object.keys(this.service.server.connected).map(it=>{
            if(!!this.service.server.connected[it].user){
                cb(this.service.server.connected[it].user);
            }
        });
    }
}

/**
 * 关于exports和module.exports的释义：
 * 初始时，module.exports = exports = {}; 真正的接口是 module.exports, exports只是辅助性的，直白点，就是个备胎
 * module.exports 没有被修改，则 exports与module.exports还是引用同一个对象，
 * 如果module.exports 被改变，则module.exports 与 exports已经不是一条心了，任你exports怎么改，跟module.exports有什么关系呢
 */
exports = module.exports = FacadeOfBase;

