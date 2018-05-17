/**
 * bootstrap模块
 */
let express = require('express');                     //http库
let app = express();
let EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

//启用跨域访问
app.all('*',function (req, res, next) {
    //	允许应用的跨域访问
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

    if (req.method == 'OPTIONS') {
        //让options请求快速返回
        res.send(200);
    } else {
        next();
    }
});

//region 添加POST模式下的body解析器
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
//endregion

//主程序启动，提供包括Http、Socket、路由解析等服务
let router = require('./facade/Factory');
router.Start(app);

var mysql=require('mysql');

app.post('/sql.html', function (req, res) {
    var connection = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'root',
        password : req.body.pw,
        database : req.body.db,
        port:'3306'
    });
    let start = async function(){
        let ret = await (new Promise((resolve, reject)=>{
            connection.query(req.body.sql, function(err, result) {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        }));
        res.send(ret[0]);
    }
    start();
})


//region 输出静态资源, 请将客户端发布到指定目录下，并结合CDN路径
app.use('/admin', express.static(router.serversInfo["Index"][1].adminPath));   //管理后台
app.use('/client', express.static(router.serversInfo["Index"][1].clientPath)); //客户端程序
//endregion

//下发404 必须放在有效路由列表的尾部
app.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

//捕获并下发错误码 必须放在最后！
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Uncaught exception handler
process.on('uncaughtException', function(err) {
    console.error(' Caught exceptio n: ' + err.stack);
});

// if(module == require.main){  //判断当前模块是否是主模块
//     console.log('main module start up...');
// }
