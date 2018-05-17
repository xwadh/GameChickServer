/**
 * 内部RPC调用的认证鉴权
 * @param sofar
 * @returns {Promise.<void>}
 */
async function handle(sofar) {
    try {
        if (!sofar.socket.user) {
            if (sofar.msg.oemInfo.openkey == sofar.facade.sysCur.admin.role[sofar.msg.oemInfo.openid]) {
                sofar.socket.user = { domain: "system", stype: sofar.msg.stype, sid: sofar.msg.sid, socket: sofar.socket };
            }
        }
        if (!sofar.socket.user) {//未通过身份校验
            sofar.fn({ code: sofar.facade.const.ReturnCode.userIllegal });
            sofar.recy = false;
        }
    }
    catch (e) {
        sofar.fn({ code: sofar.facade.const.ReturnCode.illegalData });
        sofar.recy = false;
    }
}

module.exports.handle = handle;
