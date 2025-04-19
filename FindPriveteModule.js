const fs = require('fs');
const path = require('path');
const axios = require('axios');
const npmConf = require('npm-conf');
const {HttpsProxyAgent} = require('https-proxy-agent');

// 获取 .npmrc 中的代理配置
const conf = npmConf();
const proxy = conf.get('https-proxy') || conf.get('proxy');
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;


const OUTPUT_FILE = 'private-packages.json';

function getDependencies(pkgPath) {
    try {
        const content = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return {
            ...content.dependencies,
            ...content.devDependencies
        };
    } catch (e) {
        console.error('❌ 无法解析 package.json:', e.message);
        return {};
    }
}
/**
 * 检查包是否存在于 npmjs.org
 * @param {string} packageName
 * @returns {Promise<[string, boolean|null]>}
 */
function checkOnNpm(packageName) {
  const url = `https://registry.npmjs.org/${packageName}`;

  return axios.get(url, {
    httpsAgent: agent,
    proxy: false, // 禁用 axios 默认代理处理逻辑
    timeout: 5000, // 可选：设置超时
    validateStatus: () => true // 不抛异常，自己判断 status
  }).then(res => {
    if (res.status === 200) return [packageName, true];
    if (res.status === 404) return [packageName, false];
    return [packageName, null];
  }).catch(() => [packageName, null]);
}

async function main(projectDir = null) {
    // 如果没有提供项目路径，则输出错误信息并退出程序
    if (!projectDir) {
        console.error('❌ 请提供项目路径，例如：/your/project');
        process.exit(1);
    }

    const pkgPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        console.error('❌ 找不到 package.json');
        process.exit(1);
    }

    console.log('📦 读取依赖中...');
    const deps = getDependencies(pkgPath);
    // 输出正在读取依赖的信息
    const packageNames = Object.keys(deps);
    // 获取package.json文件中的依赖

    // 获取依赖的名称
    console.log(`🔍 开始检查 ${packageNames.length} 个依赖是否在 npm...`);

    // 输出开始检查依赖是否在npm的信息
    const results = {};
    for (const name of packageNames) {
        const [pkg, exists] = await checkOnNpm(name);
        results[pkg] = {
            version: deps[pkg],
            existsOnNpm: exists
        };
    }
    // 将检查结果存储到results对象中

    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(results, null, 2));
    console.log(`✅ 检查完成，结果已保存到 ${path.join(projectDir, OUTPUT_FILE)}`);
}

main('/Users/your/project'); // 替换为你的项目路径
// 将检查结果保存到项目路径下的output.json文件中
