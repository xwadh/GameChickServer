/**
 * Updated by liub on 2017-07-02.
 */

let FacadeOfBase = require('./FacadeOfBase');
let request = require('request');
let rp = require('request-promise');

/**
 * 逻辑服对应的门面类
 */
class FacadeOfImage extends FacadeOfBase {
    async Start(app){
        //Image Server构造比较简单，此处也没有调用父类的Start

        let hrv = this.sysCur.UrlHead == "https" ? 
            require(this.sysCur.UrlHead).createServer(this.credentials, app) : 
            require(this.sysCur.UrlHead).createServer(app);
        //启动网络服务
        hrv.listen(this.sysCur.webserver.port, this.sysCur.webserver.host, () => {
            console.log(`图片服务在端口 ${this.sysCur.webserver.port} 上准备就绪`);
        });

        //抓取跨域图片
        app.get('/socialImg', (req, res)=>{
            //req.query.m = encodeURIComponent(this.DataConst.user.icon); //test only
            if(!!req.query.m){
                try{
                    //console.time('getImage');
                    
                    //普通版本
                    //request(decodeURIComponent(req.query.m)).pipe(res);   

                    //Promise版本
                    rp({uri: decodeURIComponent(req.query.m),headers: {'User-Agent': 'Request-Promise',}}).pipe(res);

                    //console.timeEnd('getImage');
                }
                catch(e){
                    console.error(e);
                    res.end();
                }
            }
            else{
                try{
                    rp({uri: decodeURIComponent(this.DataConst.user.icon),headers: {'User-Agent': 'Request-Promise',}}).pipe(res);
                }
                catch(e){
                    console.error(e);
                    res.end();
                }
            }
        });
    }
}

exports = module.exports = FacadeOfImage;