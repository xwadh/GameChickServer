/**
 * Redis连接服务
 * updated by liub 2017.8.13    新增标准KV操作
 * updated by liub 2017.8.27    新增Map操作、集合操作
 */

let Indicator = require('../util/Indicator');
let {RedisOperFlag} = require('../const/comm');

//获取服务器配置信息
let sys = require('../game.config').servers["Index"][1]; 
let RDS_PORT = sys.redis.port, //端口号
    RDS_HOST = sys.redis.host, //服务器IP
    RDS_OPTS = sys.redis.opts; //设置选项，例如加密连接：打开redis.conf文件，找到requirepass，取消注释，设置密码后，传递参数 {auth_pass: ''} 进行连接

//连接缓存服务器
var redis = require('redis');

//开启调测模式
//redis.debug_mode = true;

/**
 * 缓存管理类
 */
class cache {
    /**
     * 构造函数，完成类初始化工作：连接Redis，设定事件监听
     * 
     * @note
     *      当前假定客户端已经设定为自动断线重连
     * @param {*} parent 
     */
    constructor(parent){
        this.parent = parent;
        this.client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);

        this.status = false;

        //client.options.no_ready_check：默认值为false,当连接到一台redis服务器时，服务器也许正在从磁盘中加载数据库，当正在加载阶段，redis服务器不会响应任何命令，node_redis会发送一个“准备确认”的INFO命令，
        //INFO命令得到响应表示此时服务器可以提供服务，这时node_redis会触发"ready"事件，如果该设置项设置为true，则不会有这种检查
        this.client.on('connect', function(){
            //console.log('connect');
        });
        this.client.on('end', function(err){
            //console.log('redis end');
            this.status = false;
        });
        this.client.on('ready', function(err) {
            //console.log('redis server ready');
            this.status = true;
        });
    }

    /**
     * KV读操作
     * @param {*} key   键   代表键的字符串
     * @return {Object} 值   代表值的对象，由返回字符串反序列化获得，失败返回null
     */
    async get(key){
        let pro = new Promise(resolve=>{
            if(key.constructor == Array){
                this.client.mget(key, function (err, reply) {
                    if(!err){
                        resolve(reply.map(it=>{return JSON.parse(it);})); //取出的元素转化下
                    }
                    else{
                        resolve(null);
                    }
                });            
            }
            else{
                this.client.get(key, function (err, reply) {
                    if(!err){
                        resolve(JSON.parse(reply));
                    }
                    else{
                        resolve(null);
                    }
                });            
            }
        });

        try{
            return await pro;
        }
        catch(e){
        }
        return null;
    }

    /**
     * KV删除操作, 可通过传入数组进行批量删除
     * @param {*} key 
     */
    del(key, flag){
        if(key.constructor == Array){
            for(let it of key){
                this.client.del(it);
            }
        }
        else{
            this.client.del(key);
        }
    }

    /**
     * KV写操作，需在外围处理异常
     * 
     * @param {*} key       键   代表键的字符串
     * @param {*} value     值   代表值的字符串，写入前执行序列化操作
     * @param {*} flag      Promisify标志 | 删除标志
     */
    async set(key, value, flag){
        if(typeof value != "string"){
            value = JSON.stringify(value);
        }

        let _promisify = false, _del = false;
        if(!!flag){
            let ind = Indicator.inst(flag);
            _promisify = ind.check(RedisOperFlag.Promisify);
            _del = ind.check(RedisOperFlag.Del);
        }

        if(_promisify){
            return await (new Promise(resolve=>{
                if(_del){
                    this.client.del(key, (err, ret)=>{
                        resolve(ret);
                    });
                }
                else{
                    this.client.set(key, value, (err, ret)=>{
                        resolve(ret);
                    });
                }
            }));
        }
        else{
            if(_del){
                this.client.del(key);
            }
            else{
                this.client.set(key, value);
            }
        }
    }

    /**
     * KV批量写操作
     * @param {*} list 包含多个KV键值对的数组
     */
    async setAll(list){
        let pipe = this.client.multi();
        list.map(item=>{
            pipe = pipe.set(item.key, JSON.stringify(item.value));
        });

        try{
            return await (new Promise((resolve, reject)=>{
                pipe.exec(function(err, replies){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(replies);
                    }
                });
            }));
        }
        catch(e){
            console.error(e);
        }
        return null;
    }

    /**
     * map写：向指定map写入键值
     */
    async mapSet(mapName, obj){
        try{
            return await (new Promise((resolve, reject)=>{
                this.client.HMSET(mapName, obj, (err, ret)=>{
                    if(!err){
                        resolve(ret);
                    }
                    else{
                        reject(err);
                    }
                });
            }));
        }
        catch(e){
            console.error(e);
        }
    }

    /**
     * map删除：从指定map中删除某个键值
     */
    async mapDel(mapName, key){
        try{
            return await (new Promise((resolve, reject)=>{
                if(key.constructor == Array){
                    let pipe = this.client.multi();
                    for(let it of key){
                        pipe = pipe.hdel(mapName, it);
                    }
                    pipe.exec((err, ret)=>{
                        if(!err){
                            resolve(ret);
                        }
                        else{
                            reject(err);
                        }
                    });
                }
                else{
                    this.client.hdel(mapName, key, (err, ret)=>{
                        if(!err){
                            resolve(ret);
                        }
                        else{
                            reject(err);
                        }
                    });
                }
            }));
        }
        catch(e){
            console.error(e);
        }
    }

    /**
     * map读：从指定map读取键值
     * @param {*} mapName 
     * @param {*} key 
     */
    async mapGet(mapName, key){
        try{
            return await (new Promise(resolve=>{
                if(key.constructor == Array) {
                    let pipe = this.client.multi();
                    for(let it of key){
                        pipe = pipe.hget(mapName, it);
                    }
                    pipe.exec((err, ret)=>{
                        if(!err){
                            resolve(ret);
                        }
                        else{
                            resolve(null);
                        }
                    });
                }
                else{
                    this.client.hget(mapName, key, (err, ret)=>{
                        if(!err){
                            resolve(ret);
                        }
                        else{
                            resolve(null);
                        }
                    });
                }
            }));
        }
        catch(e){
            console.error(e);
        }
        return null;
    }

    /**
     * map读：从指定map获取键集合
     * @param {*} mapName 
     */
    async mapKeys(mapName){
        try{
            return await (new Promise((resolve, reject) => {
                this.client.hkeys(mapName, function (err, replies) {
                    if(!!err){
                        reject(err);
                    }
                    else{
                        resolve(replies);
                    }
                });        
            }));
        }
        catch(e){
            console.err(e);
        }
    }

    /**
     * map读：从指定map获取所有键值
     * @param {*} mapName 
     */
    async mapValues(mapName){
        try{
            return await (new Promise((resolve, reject) => {
                this.client.hgetall(mapName, function (err, replies) {
                    if(!!err){
                        reject(err);
                    }
                    else{
                        resolve(replies);
                    }
                });        
            }));
        }
        catch(e){
            console.err(e);
        }
    }

    /**
     * 集合：添加一个元素
     */
    groupAdd(sname, key){
        this.client.sadd(sname, key);
    }

    /**
     * 集合：删除一个或多个元素
     * 
     * @param {*} sname     集合的名称
     * @param {*} key       要删除的key，可以是包含多个要删除元素的数组
     */
    async groupDel(sname, key){
        if(!!key){
            if(key.constructor == String || (key.constructor == Array && key.length > 0)){
                try{
                    await (new Promise((resolve, reject)=>{
                        this.client.srem(sname, key, (err, ret)=>{
                            if(!err){
                                resolve(ret);
                            }
                            else{
                                reject(err);
                            }
                        });
                    }));
                }
                catch(e){
                    console.error(e);
                }
            }
        }
    }

    /**
     * 集合：判断是否拥有某个元素
     * @param {*} sname 
     * @param {*} key 
     */
    async groupHas(sname, key){
        try{
            return await (new Promise((resolve, reject)=>{
                this.client.sismember(sname, key, (err, ret)=>{
                    if(!err){
                        resolve(ret);
                    }
                    else{
                        reject(err);
                    }
                });            
            }));
        }
        catch(e){
            console.error(e);
        }
        return false;
    }

    /**
     * 集合：查询并返回列表
     */
    async groupKeys(sname){
        try{
            return await (new Promise((resolve, reject)=>{
                this.client.smembers(sname, (err, list)=>{
                    if(!!err){
                        reject(err);
                    }
                    else{
                        resolve(list);
                    }
                });
            }));
        }
        catch(e){
            console.error(e);
        }
        return null;
    }
}

module.exports = cache;
