/**
 * Created by admin on 2017-05-26.
 */
function handle(data) {
    data.user.notify({type: this.const.NotifyType.taskChanged, info:data.objData});
}

module.exports.handle = handle;