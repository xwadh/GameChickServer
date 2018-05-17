let baseCtl = require('../facade/baseCtl');
let Sequelize = require('sequelize');
let conn = require('../util/sequel');
let query = require('../util/mysql');

/**
 * 配置管理器
 * Updated by liub on 2017-05-05.
 */
class admin extends baseCtl {
    async login(user, objData)  {
        //	用户登陆
        return await this.parent.control.login.UserLogin(user, objData);
    }

    async getRouteList(user, objData){
        return {
            code: this.parent.const.ReturnCode.Success,
            data: this.parent.routeList()
        }
    }

    async addRoute(user, objData){
        if(!!objData.openid){
            this.parent.testRoute.add(objData.openid);
        }
        return await this.getRouteList(user, objData);
    }

    async delRoute(user, objData){
        this.parent.testRoute.delete(objData.openid);
        return await this.getRouteList(user, objData);
    }

    /**
     * 管理员查询汇总统计信息：总注册和总在线
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: {totalUser: number, totalOnline: number}}>}
     */
    async summary(user, objData){
        try{
            if(!objData.server || objData.server == 'All'){
                return (await Promise.all(this.parent.service.users.forServers(srv=>{
                    return this.parent.remoteCallReturn({stype:srv.stype, sid:srv.sid}, "summary");
                }))).reduce((sofar, cur)=>{
                    sofar.data.totalUser += cur.data.totalUser;
                    sofar.data.totalOnline += cur.data.totalOnline;
                    sofar.data.totalAmount += cur.data.totalAmount;
                    return sofar;
                }, {code:this.parent.const.ReturnCode.Success, data:{totalUser:0, totalOnline:0, totalAmount: 0}});
            }
            else{
                let ps = objData.server.split('.');
                if(ps.length >= 2){
                    return {code:this.parent.const.ReturnCode.Success, data:(await this.parent.remoteCallReturn({stype:ps[0], sid:parseInt(ps[1])}, "summary")).data};
                }
                else{
                    return {code:this.parent.const.ReturnCode.Error};
                }
            }
        }
        catch(e){
            console.log(e);
            return {code:this.parent.const.ReturnCode.Error};
        }
    }

    /**
     * 留存率
     * @param user
     * @param objData
     * @returns {Promise.<{code: number, data: {first: number, third: number, seventh: number}}>}
     */
    async survive(user, objData){
        let ru = {code:this.parent.const.ReturnCode.Success, data:[]};
        (await Promise.all(this.parent.service.users.forServers(srv=>{
            let item = this.parent.serversInfo[srv.stype][`${srv.sid}`];
            return new Promise(resolve=>{
                query(`call survive('${objData.time}',@r1,@r3,@r7)`, (err, vals)=>{
                    if(!err){
                        resolve({stype: srv.stype, sid: srv.sid, r1:(vals[0][0].r1*100)|0, r3:(vals[0][0].r3*100)|0, r7:(vals[0][0].r7*100)|0});
                    }
                    else{
                        resolve();
                    }
                }, {
                    host: item.mysql.host,
                    user: item.mysql.sa,
                    password: item.mysql.pwd,
                    database: item.mysql.db,
                    port: item.mysql.port
                });
            });
        }))).map(it=>{
            if(!!it){
                ru.data.push(it);
            }
        });
        return ru;
    }
}

exports = module.exports = admin;
