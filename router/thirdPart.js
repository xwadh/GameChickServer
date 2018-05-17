/**
 * Created by Administrator on 2017-04-28.
 * 第三方接口路由设置
 */
let express = require('express');
let router = express.Router();
let facade = require('../facade/Factory');    //门面对象

[
    '/auth360.html', //模拟 360 网关下发签名集
    '/pay360.html',  //360 发货回调路由
    '/txpay.html',   //腾讯发货回调接口
    '/authAdmin.html',   //管理后台登录验证页面
].map(path=>{
    router.get(path, async function(req, res) {
        try{
            let ret = await facade.callFunc('thirdPart', path.replace('/', '').split('.')[0], req.query);
            //console.log(ret);
            res.send(ret);
        }
        catch(e){
            res.end();
        }
    });
    router.post(path, async function(req, res) {
        try{
            let ret = await facade.callFunc('thirdPart', path.replace('/', '').split('.')[0], req.body);
            //console.log(ret);
            res.send(ret);
        }
        catch(e){
            res.end();
        }
    });
});

module.exports = router;