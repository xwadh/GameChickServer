let {ReturnCode} = require('../const/comm'); //返回码
let ini = require('./configMgr');
let filelist = require('../util/filelist');

//加载所有配置文件 - 注意校验新增的JSON配置文件的格式（特别是BOM），有可能载入错误导致运行异常
let fileMap = {};
filelist.mapPath('config').map(fl => {
    let id = fl.name.split('.')[0];
    fileMap[id] = ini.get(fl.path).GetInfo();
});

/**
 * 客户端请求获取配置文件
 * @param file
 * @returns {*}
 */
function getConfigFile(file){
    if(!!fileMap[file]){
        return {code:ReturnCode.Success, data:fileMap[file]};
    }
    else{
        return {code:ReturnCode.Error};
    }
}

//	已点号分割数字
function formatNumber(num) {
    var decimalPart = '';
    num = num.toString();
    if (num.indexOf('.') != -1) {
        decimalPart = '.' + num.split('.')[1];
        num = parseInt(num.split('.')[0]);
    }
    var array = num.toString().split('');
    var index = -3;
    while (array.length + index > 0) {
        // 从单词的最后每隔三个数字添加逗号
        array.splice(index, 0, ',');
        //array.splice(index, 0, '.');
        index -= 4;
    }
    return array.join('') + decimalPart;
};

//	获取建筑需要的金币
function GetBuildNeedMoney(islandId, buildId, iLevel, bBroken) {
    if (fileMap.DataBuildMoney[islandId] && fileMap.DataBuildMoney[islandId][buildId] && fileMap.DataBuildMoney[islandId][buildId][iLevel]) {
        var iNeedMoney = parseInt(fileMap.DataBuildMoney[islandId][buildId][iLevel]);
        if (bBroken) {
            return parseInt(iNeedMoney / 2);
        }
        return iNeedMoney;
    }
    //	默认给一个大值
    return 10000000;
}
//	获取需要金币的格式化值
function GetBuildNeedMoneyFormat(islandId, buildId, iLevel, bBroken) {
    return formatNumber(GetBuildNeedMoney(islandId, buildId, iLevel, bBroken));
}

//	获取每日任务数据
function GetDailyTaskData() {
    return fileMap.DataDailyTask;
}

/**
 * 获取随机的一组任务
 * @returns {Array}
 * @constructor
 */
function GetRandomTask() {
    //	打乱数组顺序
    let arr = Object.keys(fileMap.DataDailyTask);
    arr.sort(function() {
        return 0.5 - Math.random();
    });
    let ret = [];
    for (let i = 0; i < arr.length; ++i) {
        ret.push(fileMap.DataDailyTask[arr[i]]);
        if (ret.length >= 5) {
            return ret;
        }
    }
    return ret;
}

//	获得第几天的奖励信息
function GetDayLoginInfoByDay(dayNum) {
    if (fileMap.DataDayLoginAward[dayNum]) {
        return fileMap.DataDayLoginAward[dayNum];
    }
    return null;
}

//	获取岛屿对应位置的金币奖励个数
function GetQiPanPositionAward(islandId, iPosition) {
    if (fileMap.DataQiPanAward[islandId] && fileMap.DataQiPanAward[islandId][iPosition]) {
        return fileMap.DataQiPanAward[islandId][iPosition];
    }
    //	默认给一个大值
    return 1000;
}

//	函数导出
exports.GetQiPanPositionAward = GetQiPanPositionAward;
exports.GetDayLoginInfoByDay		= GetDayLoginInfoByDay;
exports.GetDailyTaskData	= GetDailyTaskData;
exports.GetRandomTask		= GetRandomTask;
exports.GetBuildNeedMoney		= GetBuildNeedMoney;
exports.GetBuildNeedMoneyFormat	= GetBuildNeedMoneyFormat;
exports.getConfigFile = getConfigFile;
exports.fileMap = fileMap;