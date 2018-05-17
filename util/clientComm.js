/**
 * 取数组随机对象
 */
Array.prototype.randObj = function(){
    if(this.length == 0){
        return null;
    }
    else if(this.length == 1){
        return this[0];
    }
    else{
        return this[(Math.random()*this.length)|0];
    }
}

let Indicator = require('./Indicator'); //标志位管理
let {ReturnCodeName, CommMode, BonusType, ReturnCode, NotifyType, UserStatus} = require('../const/comm'); //常量
let expect = require('chai').expect; //断言库
let req = require('../util/req'); //http访问
let {clone, extendObj} = require('../util/commonFunc');
let net = require('net');
let HeadBodyBuffers = require('head_body_buffers').HeadBodyBuffers;
let StringDecoder = require('string_decoder').StringDecoder;
let decoder = new StringDecoder();

/**
 * 发送参数
 * @type {{none: number, notify: number, get: number}}
 */
const SendParams = {
    /**
     * 空参数
     */
    none: 0,
    /**
     * 以notify方式收发消息（默认jsonp模式）
     */
    notify: 1 << 1,
    /**
     * 以 http get 方式收发消息（默认jsonp模式）
     */
    get: 1 << 2,
};

/**
 * RPC控件
 * @note
 *      1、根据创建参数，可分别支持WS、Socket、Http三种常用通讯模式，支持Notify、JSONP、Watching等报文通讯模式
 *      2、支持LBS重定向功能
 *      3、内部封装了一定的断言功能
 */
class Remote {
    constructor($mode = CommMode.ws){
        //切换长短连的标志 http socket
        this.rpcMode = $mode;

        this.configOri = require('../game.config').servers["Index"][1];     //读取并保存初始配置，不会修改
        this.config = clone(this.configOri);                                //复制一份配置信息，有可能修改
        this.indicator = Indicator.inst();
        this.expect = expect;

        this.const = {
            SendParams: SendParams,
            ReturnCode: ReturnCode,
            ReturnCodeName: ReturnCodeName,
            NotifyType: NotifyType,
            UserStatus: UserStatus,
            BonusType: BonusType,
        };
        this.userInfo = {
            domain: this.config.auth.domain,
            openid: this.config.auth.openid,
            openkey: this.config.auth.openkey,
            pf: this.config.auth.pf
        };
        this.autoLogin = false;

        this.notifyHandles = {};
        /*通过使用统一的socket来保持包含多个交互过程的会话*/
        this.createSocket(this.config.webserver.mapping, this.config.webserver.port);

        this.tools = {
            extendObj: extendObj,
        };
    }

    /**
     * 创建通讯连接组件
     * @param {*} ip 
     * @param {*} port 
     */
    createSocket(ip, port){
        this.close();

        switch(this.rpcMode){
            case CommMode.ws:
                this.socket = require('socket.io-client')(`${this.config.UrlHead}://${ip}:${port}`, {'force new connection': true})
                    .on('notify', ret=>{
                        if(!!ret.type && this.notifyHandles[ret.type]){
                            this.notifyHandles[ret.type](ret.info);
                        }
                        else if(!!this.notifyHandles['0']){
                            this.notifyHandles['0'](ret.info);
                        }
                    });
                break;

            case CommMode.socket:
                this.socket = net.connect(port, ip);

                let hbd = new HeadBodyBuffers(4, data => {
                    return data.readUInt32BE(0);
                });
                hbd.on('packet', packet => {
                    let head = packet.slice(0, 4);
                    let body = packet.slice(4);

                    let js = decoder.write(body);
                    //console.log(js);
                    let ret = JSON.parse(js);

                    if(!!ret.type && this.notifyHandles[ret.type]){
                        this.notifyHandles[ret.type](ret.info);
                    }
                    else if(!!this.notifyHandles['0']){
                        this.notifyHandles['0'](ret.info);
                    }
                });

                this.socket.on('data', function(data) {
                    hbd.addBuffer(data);
                });

                break;
        }
    }

    /**
     * 类360的认证流程
     * @param {*} cb 
     */
    authOf360(cb){
        let rpc = (ip, port)=>{
            //此处根据实际需要，发起了基于HTTP请求的认证访问，和本身创建时指定的通讯模式无关。
            this.locate(ip, port).$UrlRequest({id: this.userInfo.openid}, msg=>{
                //客户端从模拟网关取得了签名集
                this.log(msg);
                //this.expect(msg.sign).to.not.be.empty; //服务端回调地址

                //将签名集发送到服务端进行验证、注册、绑定
                this.fetch({
                    'func': '1000',
                    "oemInfo": {
                        "domain": this.userInfo.domain /*指定第三方平台类型*/,
                        "auth":msg /*发送签名集，类似的，TX平台此处是发送openid/openkey以便前向校验 */
                    }
                }, msg => {
                    //this.isSuccess(msg, true);    //返回值
                    //this.expect(msg.data.token).to.not.be.empty;
                    if(!!msg.data){
                        this.userInfo.id = msg.data.id;
                        this.userInfo.token = msg.data.token;
                    }
                    cb(msg);
                });
            }, `${this.config.UrlHead}://${this.configOri.webserver.host}:${this.configOri.webserver.port}/auth360.html`);
        };

        if(this.userInfo.directly){
            rpc('127.0.0.1', 9101);
        }
        else{
            this.locate(this.configOri.webserver.host, this.configOri.webserver.port).fetch({"func": "config.getServerInfo", "oemInfo":{"domain": this.userInfo.domain, "openid": this.userInfo.openid}}, msg => {
                //console.log(msg);
                rpc(msg.data.ip, msg.data.port);
            });
        }
    }

    /**
     * 后台管理员的登录验证流程
     * @param cb
     */
    authOfAdmin(cb){
        let rpc = (ip, port)=>{
            this.locate(ip, port).$UrlRequest({openid: this.userInfo.openid, openkey: this.userInfo.openkey}, msg=>{
                //将签名集发送到服务端进行验证、注册、绑定
                this.fetch({
                    'func': 'admin.login',
                    "oemInfo": {
                        "domain": this.userInfo.domain /*指定第三方平台类型*/,
                        "auth":msg /*发送签名集，类似的，TX平台此处是发送openid/openkey以便前向校验 */
                    }
                }, msg => {
                    //this.isSuccess(msg);    //返回值
                    //this.expect(msg.data.token).to.not.be.empty;
                    if(!!msg.data){
                        this.userInfo.id = msg.data.id;
                        this.userInfo.token = msg.data.token;
                    }
                    cb(msg);
                });
            }, `${this.config.UrlHead}://${this.configOri.webserver.host}:${this.configOri.webserver.port}/authAdmin.html`);
        };

        rpc(this.configOri.webserver.host, this.configOri.webserver.port);
    }

    authOfTx(cb){
        let rpc = (ip, port) => {
            //腾讯登录：上行openid、openkey，服务端验证后返回结果
            this.locate(ip, port).fetch({
                'func': '1000',
                "oemInfo": this.userInfo
            }, msg => {
                this.isSuccess(msg);    //返回值
                //this.expect(msg.data.token).to.not.be.empty;
                if(!!msg.data){
                    this.userInfo.id = msg.data.id;
                    this.userInfo.token = msg.data.token;
                }
                cb(msg);
            });
        };

        if(this.userInfo.directly){
            rpc('127.0.0.1', 9101);
        }
        else{
            this.locate(this.configOri.webserver.host, this.configOri.webserver.port).fetch({"func": "config.getServerInfo", "oemInfo":{"domain": this.userInfo.domain, "openid": this.userInfo.openid}}, msg => {
                //console.log(msg);
                rpc(msg.data.ip, msg.data.port);
            });
        }
    }

    /**
     * 设置服务端推送报文的监控句柄，支持链式调用
     * @param cb            回调
     * @param etype
     * @returns {Remote}
     */
    watch(cb, etype = '0'){
        this.notifyHandles[etype] = cb;
        return this;
    }

    auth(ui, cb){
        if(!!ui){
            if(!!ui.domain){
                this.userInfo.domain = ui.domain;
            }
            if(!!ui.openid){
                this.userInfo.openid = ui.openid;
            }
            if(!!ui.openkey){
                this.userInfo.openkey = ui.openkey;
            }
            if(!!ui.pf){
                this.userInfo.pf = ui.pf;
            }
            if(!!ui.directly){
                this.userInfo.directly = ui.directly;
            }
        }
        this.userInfo.token = null; //清空先前缓存的token
        this.autoLogin = true;

        if(!!cb){
            return this.$login(cb);
        }
        else{
            return this;
        }
    }

    /**
     * 判断返回值是否成功
     * @param msg       网络报文
     * @param out       强制打印日志
     * @returns {*}
     */
    isSuccess(msg, out=false){
        this.expect(msg).to.not.be.empty;
        msg.msg = this.const.ReturnCodeName[msg.code];

        if(msg.code != this.const.ReturnCode.Success || out){
            this.log(msg);
        }
        return this.expect(msg.code).to.be.equal(this.const.ReturnCode.Success);
    }

    /**
     * 直接打印各种对象
     * @param val
     */
    log(val){
        if(!!val.code){
            val.msg = this.const.ReturnCodeName[val.code];
        }

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
     * 添加某项设定
     * @param param
     * @returns {Remote}
     */
    set(param){
        this.indicator.set(param);
        return this;
    }

    /**
     * 取消某项设定
     * @param param
     * @returns {Remote}
     */
    unSet(param){
        this.indicator.unSet(param);
        return this;
    }

    get newone(){
        return new Remote();
    }

    /**
     * 获取新的远程对象
      * @returns {Remote}
     */
    get new(){
        return new Remote();
    }

    /**
     * 执行认证流程，成功后调用由参数cb指定的回调
     * @param {*} cb 回调
     */
    $login(cb){
        if(!cb){
            cb = ()=>{};
        }

        if(this.autoLogin){
            this.autoLogin = false;
            switch(this.userInfo.domain){
                case "admin":
                    this.authOfAdmin(msg=>{
                        cb(msg);
                    });
                    break;
                case "360.IOS":
                case "360.Android":
                case "360.Test":
                case "360":
                    this.authOf360(msg=>{
                        cb(msg);
                    });
                    break;
                case "tx.IOS":
                case "tx.Android":
                case "tx.Test":
                case "tx":
                    this.authOfTx(msg=>{
                        cb(msg);
                    }, this.userInfo.domain);
                    break;
            }
        }
        else{
            cb(null);
        }
        return this;
    }

    /**
     * 向服务端提交请求,默认JSONP模式
     * @param command       命令名称，格式: obj.func, 可以缩写为 func，此时obj为默认值'index'，例如 index.setNewbie 等价于 setNewbie
     * @param params        命令参数，JSON对象
     * @param callback      回调函数
     * @returns {*}
     */
    fetch(params, callback, url=null){
        if(this.autoLogin){
            return this.$login(msg=>{
                if(!!msg){
                    this.isSuccess(msg);
                }
                this.fetch(params, callback, url);
            });
        }

        if(!!url){
            this.$UrlRequest(params, callback, url);
        }
        else{
            switch(this.rpcMode){
                case CommMode.ws:
                    this.parseParams(params);
                    if(!callback){
                        this.socket.emit('notify', params);
                    }
                    else{
                        this.socket.emit('req', params, callback);
                    }
                    break;

                case CommMode.socket:
                    this.parseParams(params);
                    let keepAlive = JSON.stringify(params);

                    let packet = new Buffer(4+ Buffer.byteLength(keepAlive));
                    packet.writeUInt32BE(Buffer.byteLength(keepAlive),0);
                    packet.write(keepAlive,4);

                    this.socket.write(packet);
                    if(!!callback){
                        this.watch(callback);
                    }

                    break;

                case CommMode.http:
                    this.$UrlRequest(params, callback, url);
                    break;
            }
        }
        return this;
    }

    /**
     * 设定远程服务器地址
     * @param ip
     * @param port
     * @returns {Remote}
     */
    locate(ip, port){
        this.config.webserver.host = ip;
        this.config.webserver.port = port;

        this.createSocket(ip, port);
        return this;
    }

    /**
     * 关闭长连接
     */
    close(){
        switch(this.rpcMode){
            case CommMode.ws:
                if(this.socket){
                    this.socket.removeAllListeners();
                    this.socket.disconnect();
                    this.socket = null;
                }
                break;

            case CommMode.socket:
                if(this.socket){
                    this.socket.end();
                    this.socket = null;
                }
                break;
        }
    }

    /**
     * 参数调整
     * @param params
     */
    parseParams(params){
        params.func = !!params.func ? params.func : 'index.login';
        //填充自动登录参数
        let arr = params.func.split('.');
        if(arr.length > 1){
            params.control = arr[0];
            params.func = arr[1];
        }
        else{
            params.func = arr[0];
        }

        params.oemInfo = !!params.oemInfo ? params.oemInfo : {};
        if(!!params.oemInfo.domain){
            this.userInfo.domain = params.oemInfo.domain;
        }
        if(!!params.oemInfo.openid){
            this.userInfo.openid = params.oemInfo.openid;
        }
        if(!!params.oemInfo.openkey){
            this.userInfo.openkey = params.oemInfo.openkey;
        }
        if(!!this.userInfo.token){
            params.oemInfo.token = this.userInfo.token;
        }
        if(!!this.userInfo.pf){
            params.oemInfo.pf = this.userInfo.pf;
        }
    }

    /**
     * (内部函数)发起基于Http协议的RPC请求
     * @param params
     * @param callback
     * @param url
     * @constructor
     */
    $UrlRequest(params, callback, url){
        this.parseParams(params);

        url = !!url ? url : `${this.config.UrlHead}://${this.config.webserver.host}:${this.config.webserver.port}/index.html`;
        url += "?" + Object.keys(params).reduce((ret, next)=>{
                if(ret != ''){ ret += '&'; }
                return ret + next + "=" + ((typeof params[next]) == "object" ? JSON.stringify(params[next]) : params[next]);
            }, '');

        req.pGetUrl(url).then(callback);
    }
}

exports = module.exports = function($mode){
    return new Remote($mode);
};