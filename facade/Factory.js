Function.prototype.before = function( fn ){
    return () => {                      // 返回包含了原函数和新函数的"代理"函数
        fn(arguments);                   // 执行新函数
        return this(arguments);        // 执行原函数
    }
};
Function.prototype.after = function( fn ){
    return () => {                      // 返回包含了原函数和新函数的"代理"函数
        let ret = this(arguments);      // 执行原函数
        fn(arguments);                   // 执行新函数
        return ret;
    }
};

let {extendObj} = require('../util/commonFunc');

let iniInfo = require('../game.config');
let FacadeOfIndex = require('./FacadeOfIndex');
let FacadeOfLogic = require('./FacadeOfLogic');
let FacadeOfImage = require('./FacadeOfImage');

//IDE中调测单服功能，需要在此设置
let env = !!process.env.sys ? JSON.parse(process.env.sys) : {serverType: "IOS", serverId: 1};  
if(env.constructor == String){
    env = JSON.parse(env);
}

/**
 * 类工厂: 根据配置信息，创建合适的门面对象
 * @constructor
 */
function FactoryOfFacade(){
    switch(env.serverType){
        case "Index": //索引服务器
            return new FacadeOfIndex(extendObj(
                {serverType: env.serverType, serverId: env.serverId},
                iniInfo.servers[env.serverType][1]
            ));
        case "IOS":
        case "Android":
        case "Test":
            return new FacadeOfLogic(extendObj(
                {serverType: env.serverType, serverId: env.serverId},
                iniInfo.servers["Index"][1],
                iniInfo.servers[env.serverType][env["serverId"]]
            ));
        case "Image":
            return new FacadeOfImage(extendObj(
                {serverType: env.serverType, serverId: env.serverId},
                iniInfo.servers["Index"][1],
                iniInfo.servers[env.serverType][env["serverId"]]
            ));
    }

    return {};
}

exports = module.exports = new FactoryOfFacade();
