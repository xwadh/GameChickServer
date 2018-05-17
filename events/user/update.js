/**
 * Created by admin on 2017-05-26.
 */

let autoSave = require('../../logic/autoExec/autoSave');

function handle(data){ //用户数据发生变化
    this.taskMgr.addTask(new autoSave(data.id));
}

module.exports.handle = handle;