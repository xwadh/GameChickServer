/**
 * 系统维护任务 - 提取单独字段，包括score，hisGateNo等
 * Created by liub on 2017-06-01.
 */
let baseTask = require('./baseTask');

let UM = require('../model/User');
let iniInfo = require('../game.config');

class task extends baseTask {
    async Execute(){
        let pl = [];
        Object.keys(iniInfo.servers).map(idx=>{
            if(idx == "IOS" || idx == "Android"){
                Object.keys(iniInfo.servers[idx]).map(x=>{
                    //填充Promise
                    pl.push(new Promise((resolve, reject) => {
                        let sysCur = iniInfo.servers[idx][x];
                        UM.User(sysCur.mysql.db, sysCur.mysql.sa, sysCur.mysql.pwd, sysCur.mysql.host, sysCur.mysql.port).findAll().then(ret=>{
                            ret.map(it=>{
                                let vip = JSON.parse(it.vip);
                                if(!!vip){
                                    it.hisGateNo = vip.hisGateNo || 0;
                                }
                                let info = JSON.parse(it.info);
                                if(!!info){
                                    it.score = info.score;
                                    it.role = info.role;
                                    it.status = info.status;
                                }

                                process.nextTick(()=>{
                                    it.save();
                                });
                            });
                            resolve();
                        }).catch(e=>{
                            reject(e);
                        });
                    }));
                });
            }
        })
        //并发执行
        try{
            await Promise.all(pl);
            return true;
        }
        catch(e){
            return false;
        }
    }
}

exports = module.exports = task;
