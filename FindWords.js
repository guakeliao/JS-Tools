import * as path from 'path';
import fs from 'node:fs';
// 给一个路径，读取路径下的文件夹或者文件夹
const readDirectory = async (cusPath, result = {}) => {
  try {
    const files = await fs.promises.readdir(cusPath);
    for (const file of files) {
      const filePath = path.join(cusPath, file);
      const isDir = await isDirectory(filePath);
      if (isDir) {
        await readDirectory(filePath, result);
      } else {
        const data = await readFileData(filePath);
        const words = getWords(data);
        if (!result[cusPath]) {
          result[cusPath] = {};
        }
        result[cusPath][file] = { words };
      }
    }
  } catch (err) {
    console.log('Unable to scan directory: ' + err);
  }
  return result;
};
// 判断一个路径是不是文件夹
const isDirectory = path => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      if (stats.isFile()) {
        resolve(false);
      } else if (stats.isDirectory()) {
        resolve(true);
      }
    });
  });
};
// 读取文件中的数据
const readFileData = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// 获取指定的字符串，通过正则表达式
//$t('number of days in status|Number of Days in Status')
//.translateRaw('others|Others')
//.translate('others|Others')
//$t("number of days in status|Number of Days in Status")
//.translateRaw("others|Others")
//.translate("others|Others")

//const regex = /\$t\((['"])(.*?)\1\)|\.translateRaw\((['"])(.*?)\3\)|\.translate\((['"])(.*?)\5\)/g;

const getWords = (data, reg = /\$t\((['"])(.*?)\1\)|\.translateRaw\((['"])(.*?)\3\)|\.translate\((['"])(.*?)\5\)/g) => {
  return data.match(reg);
};

/*---------------------------------------------------------------------------------------------------------*/
// 读取目录下的文件夹
let directoryName = '/apps/www/components/pages/ars';
const directoryPath = path.join(__dirname, directoryName);

readDirectory(directoryPath).then(result => console.log(JSON.stringify(result, null, 2)));
