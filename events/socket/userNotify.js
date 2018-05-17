/**
 * Created by admin on 2017-05-26.
 */
let {CommMode} = require('../../const/comm');

/**
 * 逻辑服主动推送消息给客户端
 * @param data
 */
function handle(data) {
    if(!data.sid){
        return;
    }

    switch(data.sid.commMode){
        case CommMode.socket:
            let keepAlive = JSON.stringify(data.msg);
            let packet = new Buffer(4+ Buffer.byteLength(keepAlive));
            packet.writeUInt32BE(Buffer.byteLength(keepAlive),0);
            packet.write(keepAlive,4);
            data.sid.write(packet);
            break;

        case CommMode.ws:
            if(data.sid.id in this.service.server.connected){
                this.service.server.connected[data.sid.id].emit('notify', data.msg);
            }
            break;
        
        default:
            break;
    }
}

module.exports.handle = handle;