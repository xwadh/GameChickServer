/**
 * Created by admin on 2017-05-26.
 */
function handle(data) {
    data.user.notify({type: this.const.NotifyType.taskFinished, info:{id: data.objData.id}});
}

module.exports.handle = handle;