let fs = require("fs");
let path = require("path");//path模块，可以生产相对和绝对路径

class Filelist
{
    /**
     * 遍历读取指定目录下所有文件，返回文件数组
     * @param path 相对路径
     */
    mapPath(ori){
        return this.mapping(`${path.resolve()}/${ori}`)
    }

    /**
     * 遍历读取指定目录下所有文件，返回文件数组
     * @param ori 绝对路径
     */
    mapping(ori){
        this.flist = [];
        return this.read(ori);
    }

    read(sofar, cname = ""){
        let files = fs.readdirSync(sofar);
        files.forEach(filename => {
            let stats = fs.statSync(path.join(sofar, filename));
            if(stats.isFile()){
                this.flist.push({name: filename, path: path.join(sofar, filename), cname:cname});
            }
            else if(stats.isDirectory()){
                this.read(path.join(sofar, filename), !!cname ? `${cname}.${filename}` : filename);
            }
        });

        return this.flist;
    }
}

exports = module.exports = new Filelist();