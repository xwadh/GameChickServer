let crypto = require('crypto'); //加密模块
let req = require('../util/req');   //异步http请求
let serversInfo = require('../game.config').servers; //服务器配置管理
let sys = serversInfo["Index"][1];
let CommonFunc = require('../util/commonFunc');
let url = require('url');
let https = require('https');
let HttpsProxyAgent = require('https-proxy-agent');
let useProxy = true;    //是否使用代理服务器
let proxy = process.env.http_proxy || 'http://127.0.0.1:1080'; //设置代理服务器端口号 localhost:prot

class fbApi
{
    constructor(parent){
        this.parent = parent;
    }

    //region ********** 用户信息类API ********************
    /**
     * facebook测试接口
     * @param {*} id facebookID
     * @param {*} access_token 
     */
    async Test(id,access_token){
        let link = 'https://graph.facebook.com/v2.11/'+id+'/'+'?access_token='+ access_token+'&fields=id,name,picture';
        let endpoint = process.argv[2] || link.toString();
        let options = url.parse(endpoint);
        if(useProxy){
            let agent = new HttpsProxyAgent(proxy);
            options.agent = agent;
        }
        let ret = await (new Promise((resolve,reject)=>{
            https.get(options, function (res) {
                let datas = [];  
                let size = 0;  
                res.on('data', function (data) {  
                    datas.push(data);  
                    size += data.length;  
                });  
                res.on("end", function () {  
                    let buff = Buffer.concat(datas, size);  
                    let result = buff.toString();
                    resolve(result);
                });  
            }).on("error", function (err) {  
                reject(err);
            });  
        }));
        console.log(ret);
        return ret;
    }

    /**
     * 获取用户信息
     * @param id
     * @param access_token
     * @returns {Promise.<{}>}
     */
    async Get_Info(id,access_token) {
        let link = 'https://graph.facebook.com/v2.11/'+id+'/'+'?access_token='+ access_token+'&fields=id,name,picture';
        let endpoint = process.argv[2] || link.toString();
        let options = url.parse(endpoint);
        if(useProxy){
            let agent = new HttpsProxyAgent(proxy);
            options.agent = agent;
        }
        let ret = await (new Promise((resolve,reject)=>{
            https.get(options, function (res) {
                let datas = [];  
                let size = 0;  
                res.on('data', function (data) {  
                    datas.push(data);  
                    size += data.length;  
                });  
                res.on("end", function () {  
                    let buff = Buffer.concat(datas, size);  
                    let result = JSON.parse(buff.toString());
                    resolve(result);
                });  
            }).on("error", function (err) {  
                reject(err);
            });  
        }));
        if(!ret.error){
            ret = {
                "ret":0,
                "nickname":ret.name,
                "figureurl":ret.picture.data.url,
            }
        }
        else{
            ret = {"ret":1};
        }
        return ret; 
    }


    //endregion

    //region ********** 好友关系类API ********************

    /**
     * 获取关系链，包括用户IM及QQGame好友
     * @param openid
     * @param openkey
     * @param pf
     * @param onlygamefriends 该值为1时代表只返回玩过同一款游戏的好友
     * @returns {Promise.<{}>}
     */
    async Get_App_Friends(id,access_token) {
        let link = 'https://graph.facebook.com/v2.11/'+id+'/'+'?access_token='+ access_token+'&fields=friends.limit(50)';
        let endpoint = process.argv[2] || link.toString();
        let options = url.parse(endpoint);
        if(useProxy){
            let agent = new HttpsProxyAgent(proxy);
            options.agent = agent;
        }
        let ret = await (new Promise((resolve,reject)=>{
            https.get(options, function (res) {
                let datas = [];  
                let size = 0;  
                res.on('data', function (data) {  
                    datas.push(data);  
                    size += data.length;  
                });  
                res.on("end", function () {  
                    let buff = Buffer.concat(datas, size);  
                    let result = JSON.parse(buff.toString());
                    resolve(result);
                });  
            }).on("error", function (err) {  
                reject(err);
            });  
        }));
        
        if(!ret.error){
            let items = [];
            if(ret.friends.data){
                for(let i = 0;i < ret.friends.data.length;i++){
                    items.push({"openid":ret.friends.data[i].id});
                }
            }
            ret = {
                "ret":0,
                "items":items
            };
        }
        else{
           ret = {"ret":1};
        }
        return ret; 
    }

    //endregion

    //region ********** 支付类API ********************

    //  itemdata.payitem = '2001*90*10';//item:2001 price:90 num:10
    //  itemdata.goodsmeta = '道具*测试';
    //  itemdata.goodsurl = 'http://minigame.qq.com/plat/social_hall/app_frame/demo/img/pic_02.jpg';
    //  itemdata.zoneid = 1;//分区ID,没有分区就传1
    //  itemdata.appmode = 1;//1表示不可以修改物品数量 2.表示可以用户可以选选择物品数量 默认2
    //  itemdata.max_num = 10;//可以批量购买的最大数量,appmode=2的时候才有效
    //  userdata.amt = '900';//必需等于道具总价（可选的），还是不填吧

    /**
     * 查询余额接口
     * @param openid            187901A9B7A57FAFA4CDDF6DCB6276B2
     * @param openkey           5EE305999566761DBA270E6734C5B6CF
     * @param pf                qzone
     * @param pfkey             596f233c3e1d73d5428dc2522ed0c313
     * @param zoneid            分区ID,没有分区就传1
     * @returns {Promise.<*>}
     */
    async Get_Balance_M(openid, openkey, pf, pfkey, zoneid) {
        var userdata = {};
        userdata.openid = openid;
        userdata.openkey = openkey;
        userdata.pf = pf;
        if (zoneid)
            userdata.zoneid = zoneid;
        else
            userdata.zoneid = 1;
        if (userdata.pfkey)
            userdata.pfkey = pfkey;
        else
            userdata.pfkey = 'pfkey';
        userdata.accounttype = 'common'; //默认基本货币:'common', 安全货币:'security'

        var apiname = "/mpay/get_balance_m";
        var data = this.createParams(userdata, "/v3/r/mpay/get_balance_m", true);//第三个参数，因为支付API使用的是PAYAPPID,所以当使用支付API的时候，要修改成true
        var token = data.token;
        var requesturl = this.getOpenApiUrl(true) + apiname + "?" + data.strParams + "&sig=" + token;

        try{
            //console.log(requesturl);
            return await req.pGetUrl(requesturl,{
                headers: {
                    'Cookie': 'session_id=openid;session_type=openkey;org_loc=' + encodeURIComponent("/v3/r/mpay/get_balance_m"),
                },
            });
        }
        catch(e){
            return {};
        }
    }

    /**
     * 直购下订单接口
     * @param openid
     * @param openkey
     * @param pf
     * @param pfkey             移动QQ的pfkey如果没有就传固定值'pfkey'
     * @param itemdata
     * @returns {Promise.<{}>}
     */
    Buy_Goods_M(openid, openkey, pf, pfkey, itemdata) {
        var userdata = {};
        userdata.openid = openid;
        userdata.openkey = openkey;
        userdata.pf = pf;
        if (userdata.pfkey)
            userdata.pfkey = pfkey;
        else
            userdata.pfkey = 'pfkey';

        userdata.payitem = itemdata.payitem;
        userdata.goodsmeta = itemdata.goodsmeta;
        userdata.goodsurl = itemdata.goodsurl;
        userdata.zoneid = itemdata.zoneid;
        userdata.appmode = itemdata.appmode;
        userdata.max_num = itemdata.max_num;

        var apiname = "/mpay/buy_goods_m";
        var data = this.createParams(userdata, "/v3/r/mpay/buy_goods_m", true);//第三个参数，因为支付API使用的是PAYAPPID,所以当使用支付API的时候，要修改成true
        var token = data.token;
        var requesturl = this.getOpenApiUrl(true) + apiname + "?" + data.strParams + "&sig=" + token;

        //console.log(requesturl);
        return req.pGetUrl(requesturl,{
            headers: {
                'Cookie': 'session_id=openid;session_type=openkey;org_loc=' + encodeURIComponent("/v3/r/mpay/buy_goods_m"),
            }
        });
    }
    /**
     * 拉取排行榜    await get_ranklist();
     * @param dimname     拉取纬度，类别一对应level，类别二对应key1，类别三对应key2
     * @param rank_start     拉取排行的起始位置（默认0）
     * @param pull_cnt     拉取排行的个数（最小为3，最大为50，默认3）
     * @param direction     拉取排行的方向（-1往前拉取，0向后拉取，默认0）
     */
    async get_ranklist(openid, openkey, pf,appid, dimname,rank_start, pull_cnt, direction) {
        pf = !!pf ? pf : sys.auth.pf;
        let userdata = {
            openid: openid,
            openkey: openkey,
            pf: pf,
            appid: appid,
            dimname:dimname,
            rank_start: rank_start,
            pull_cnt: pull_cnt,
            direction: direction
        };

        let apiname = "/v3/user/get_gamebar_ranklist";
        let data = this.createParams(userdata, apiname);
        let requesturl = this.getOpenApiUrl() + apiname + "?" + data.strParams + "&sig=" + data.token;

        try {
            return await req.pGetUrl(requesturl);
        }
        catch (e) {
            throw e;
        }
    }
    /**
     * invoke example for promise
     */
// function test() {
//     let rt = await get_ranklist();
//
//     // rt.then(ret=>{
//     //     console.log(ret);
//     // }).catch(e=>{
//     //     console.log(e);
//     // });
// }
    /**
     * 积分上报
     * @param level 用户等级。格式为uint。
     * @param area_name 用户所在的分区的名称，多区多服应用需要输入该参数，非多区多服应用不需要传。最多可传入30个字符，或10个汉字。格式为string。
     */
    async set_achievement(user, pf, score) {
        pf = !!pf ? pf : sys.auth.pf;
        let userdata = {
            openid: user.openid,
            openkey: user.baseMgr.txInfo.GetOpenKey(),
            pf: pf,
            userip: user.userip,
            user_attr:`{"level":${parseInt(score)}}`
        };

        let apiname = "/v3/user/set_achievement";
        let data = this.createParams(userdata, apiname);
        let requesturl = this.getOpenApiUrl() + apiname + "?" + data.strParams + "&sig=" + data.token;
        try {
            return await req.pGetUrl(requesturl);
        }
        catch (e) {
            throw e;
        }
    }

    /**
     * 发送玩吧消息
     * @param frd  好友openid 格式为string
     * @param msgtype 用消息类型，1-pk消息，2-送心消息，3-自定义消息 格式为int
     * @param content 自定义消息内容 格式为string
     * @param qua 手机客户端标识，例如：V1_AND_QZ_4.9.3_148_RDM_T 格式为string
     */
    async send_gamebar_msg(user, frd, msgtype, content, qua) {
        let userdata = {
            openid: user.openid,
            openkey: user.baseMgr.txInfo.GetOpenKey(),
            pf: sys.auth.pf,
            appid: sys.tx.appid,
            frd: frd,
            msgtype: msgtype,
            content: content,
            qua: qua
        };

        let apiname = "/v3/user/send_gamebar_msg";
        let data = this.createParams(userdata, apiname);
        let requesturl = this.getOpenApiUrl() + apiname + "?" + data.strParams + "&sig=" + data.token;
        try {
            return await req.pGetUrl(requesturl);
        }
        catch (e) {
            throw e;
        }
    }


    /**
     * 用户第一次进入游戏并未创建角色上报此接口
     * http:// 123.207.109.247:9000/report/regaccount/{appid}/{pf}/{openid}
     *
     */
    async Report_Regaccount(openid){
        let requesturl = "http://123.207.109.247:9000/report/regaccount/"
        + sys.tx.appid + "/"
        + sys.auth.pf + "/"
        + openid;
        try{
            return await req.pGetUrl(requesturl);
        }
        catch(e){

        }
    }

    /**
     * 用户创建角色成功上报此接口
     * http:// 123.207.109.247:9000/report/regchar/{appid}/{pf}/{openid}
     *
     */
    async Report_Regchar(openid){
        let requesturl = "http://123.207.109.247:9000/report/regchar/"
            + sys.tx.appid + "/"
            + sys.auth.pf + "/"
            + openid;
        try{
            return await req.pGetUrl(requesturl);
        }
        catch(e){

        }
    }

    /**
     * 用户第一次进入游戏并未创建角色上报此接口
     * http:// 123.207.109.247:9000/report/pay/{appid}/{pf}/{openid}/{amt}/{paytype}
     * @param amt: 支付金额: 请上报实际支付RMB金额
     *  1Q币 = 1RMB，10金卷 =1RMB,  10秀币=1RMB,  10星币= 1RMB
     * @param paytype: 0 : Q币  1:金卷  2:秀币 3:星币
     *
     */
    async Report_Pay(openid,amt,paytype){
        let requesturl = "http://123.207.109.247:9000/report/pay/"
            + sys.tx.appid + "/"
            + sys.auth.pf + "/"
            + openid + "/"
            + amt + "/"
            + paytype;
        try{
            return await req.pGetUrl(requesturl);
        }
        catch(e){

        }
    }

    /**
     *  用户创建角色成功后每次进入游戏都上报此接口
     *  http:// 123.207.109.247:9000/report/login/{appid}/{pf}/{openid}
     * @param openid uesr.openid
     */
    async Report_Login(openid){
        let requesturl = "http://123.207.109.247:9000/report/login/"
            + sys.tx.appid + "/"
            + sys.auth.pf + "/"
            + openid;
        try{
            return await req.pGetUrl(requesturl);
        }
        catch(e){

        }
    }

    /**
     * 用户退出游戏上报此接口
     * http:// 123.207.109.247:9000/report/logout/{appid}/{pf}/{openid}
     * @param openid uesr.openid
     * @param onlinetime 单位为秒
     */
    async Report_Logout(openid,onlinetime){
        let requesturl = "http://123.207.109.247:9000/report/logout/"
            + sys.tx.appid + "/"
            + sys.auth.pf + "/"
            + openid + "/"
            + onlinetime;
        try{
            return await req.pGetUrl(requesturl);
        }
        catch(e){

        }
    }
    //endregion

    //region ********** 通用函数 ********************
    /**
     * openapi地址
     * @param bPayAPI
     * @returns {*}
     */
    getOpenApiUrl(bPayAPI) {
        if (bPayAPI){
            return sys.tx.openApiUrlWithPay;
        }
        else {
            return sys.tx.openApiUrl;
        }
    }

    /**
     * 获取domain值，数据上报使用的
     * @param pf
     * @returns {number}
     */
    getReportDomain(pf) {
        if (pf.indexOf('android') != -1)
            return 19;
        else if (pf.indexOf('ios') != -1)
            return 18;
        else
            return 10;
    }

    /**
     * 制作加密串，拼接参数
     * @param userdata
     * @param url
     * @param bPayApi
     * @returns {{strParams: string, token: string}}
     */
    createParams(userdata, url, bPayApi) {
        if (!userdata.openid || userdata.openid == "") {
            console.log("error:" + "txApiFunc.js," + "openid is incorrect!");
        }
        if (!userdata.openkey || userdata.openkey == "") {
            console.log("error:" + "txApiFunc.js," + "openkey is incorrect!");
        }
        userdata.appid = bPayApi ? sys.tx.pay_appid : sys.tx.appid;
        if (!userdata.userip || userdata.userip == "") {
            userdata.userip = this.getIPAdress();
        }
        userdata.format = "json";
        userdata.ts = CommonFunc.now();

        //按字母对参数排序
        var sdic = Object.keys(userdata).sort();
        //拼接参数
        var strParams = "";
        for (let ki in sdic) {
            strParams += sdic[ki] + "=" + userdata[sdic[ki]] + "&";
        }
        strParams = strParams.substr(0, strParams.length - 1);
        //制作加密SIG使用的字串
        let encodeStrParams = encodeURIComponent(strParams);
        while (-1 != encodeStrParams.indexOf('*')) {
            encodeStrParams = encodeStrParams.replace('*', '%2A');
        }
        //制作加密SIG使用的字串 end

        //制作url get 字串
        var GETParams = "";
        for (let ki in sdic) {
            var tmpstr = encodeURIComponent(userdata[sdic[ki]]);
            while (-1 != tmpstr.indexOf('*')) {
                tmpstr = tmpstr.replace('*', '%2A');
            }
            GETParams += sdic[ki] + "=" + tmpstr + "&";
        }
        GETParams = GETParams.substr(0, GETParams.length - 1);
        //制作url get 字串 end

        //对encode的参数和encode的apiurl拼接
        encodeStrParams = "GET&" + encodeURIComponent(url) + "&" + encodeStrParams;
        //生成验证串
        var token = encodeURIComponent(crypto.createHmac("sha1", bPayApi ? sys.tx.pay_appkey : sys.tx.appkey).update(encodeStrParams).digest().toString('base64'));

        //console.log({ "encodeStrParams": encodeStrParams, "token": token });
        return { "strParams": GETParams, "token": token };
    }

    /**
     * 验证发货回调的签名档
     * @param userdata      签名档
     * @param url           在腾讯平台注册的我方发货地址
     * @param ak            密钥 appkey
     * @returns {boolean}
     */
    checkPayCallbackSign(userdata, url, ak) {
        //拼接参数
        let strParams = "";
        //按字母对参数排序
        Object.keys(userdata).sort().map(key=>{
            if(key != "sig" && key != "cee_extend"){//排除不参与运算的字段
                strParams += key + "=" + userdata[key] + "&";
            }
        });
        strParams = strParams.substr(0, strParams.length - 1);

        //制作加密SIG使用的字串
        let encodeStrParams = encodeURIComponent(strParams);
        while (-1 != encodeStrParams.indexOf('*')) {
            encodeStrParams = encodeStrParams.replace('*', '%2A');
        }
        while (-1 != encodeStrParams.indexOf('-')) {
            encodeStrParams = encodeStrParams.replace('-', '%252D'); //?文档中明明说替换成 "%2D"，实战中要注意检验下
        }
        //对encode的参数和encode的apiurl拼接
        encodeStrParams = "GET&" + encodeURIComponent(url) + "&" + encodeStrParams;
        //检验验证串
        ak = !!ak ? ak : sys.tx.pay_appkey;
        let calc = encodeURIComponent(crypto.createHmac("sha1", ak + "&"/*这个槽点...*/).update(encodeStrParams).digest().toString('base64'));
        return userdata.sig == calc;
    }

    /**
     * 获取IP，正式环境的时候要传正式服务器的内网IP
     * @returns {*}
     */
    getIPAdress() {
        var interfaces = require('os').networkInterfaces();
        for (var devName in interfaces) {
            var iface = interfaces[devName];
            for (var i = 0; i < iface.length; i++) {
                var alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }
}

exports = module.exports = fbApi;
