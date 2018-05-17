/**
 * 参数解析
 * @param sofar
 * @returns {Promise.<void>}
 */
async function handle(sofar) {
    if (!sofar.fn) {
        sofar.fn = ret => { }; // 兼容 notify 和 jsonp 两种情形
    }
    if (!sofar.socket) {
        sofar.socket = {};  //兼容WS、Socket、Http等模式
    }

    //更新时间戳
    sofar.socket.stamp = (new Date()).valueOf(); 

    //对数据进行规整
    sofar.msg.control = sofar.msg.control || 'index';
    sofar.msg.func = sofar.msg.func || 'login';
    sofar.msg.oemInfo = sofar.msg.oemInfo || {};
    if (sofar.msg.oemInfo.constructor == String) {
        sofar.msg.oemInfo = JSON.parse(sofar.msg.oemInfo);
    }
    sofar.msg.oemInfo.domain = !!sofar.msg.oemInfo.domain ? sofar.msg.oemInfo.domain : "official";
    if (sofar.facade.sysCur.serverType == "Test") {
        sofar.msg.oemInfo.domain = sofar.msg.oemInfo.domain.replace(/IOS/g, "Test").replace(/Android/g, "Test");
    }
    sofar.msg.domainId = !!sofar.msg.oemInfo.openid ? sofar.msg.oemInfo.domain + '.' + sofar.msg.oemInfo.openid : '';
}

module.exports.handle = handle;
