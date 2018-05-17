let path = require("path");//path模块，可以生产相对和绝对路径
let ini = require('./util/configMgr');
let filelist = require('./util/filelist');

//region 维护任务检测执行
let ci = ini.get(path.resolve() +  '/config/maintain.json');
if (!!ci) {
    filelist.mapPath('maintain').map(async srv=>{//加载执行所有维护任务
        let task = new (require(srv.path))(srv.name);
        if(!((ci.GetInfo())[task.name])){
            try{
                let result = await task.Execute();
                if(result){
                    (ci.GetInfo())[task.name]= true;
                    ci.SetInfo(ci.GetInfo()).Save();
                    console.log(`维护任务${task.name}结束.`);
                }
                else{
                    console.log(`因为运行错误，任务${task.name}中断执行`);
                }
            }
            catch(e){
                console.log(e);
                console.log(`因为运行错误，任务${task.name}中断执行`);
            }
        }
    });
}
else{
    console.log("config/config.json is not exist.");
}
//endregion
