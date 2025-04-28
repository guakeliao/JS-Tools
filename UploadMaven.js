const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置区👇
const repositoryUrl = 'http://your-nexus/repository/your-maven-hosted/'; // TODO: 改成你的Nexus仓库地址
const repositoryId = 'nexus-repo'; // TODO: 改成你的Maven settings.xml里配置的id
const folder = 'C:/path/to/your/jars'; // TODO: 改成你保存jar和pom的本地文件夹路径

const parallel = 3; // 并发上传数量，可根据电脑配置调整

// 查找所有jar文件
const files = fs.readdirSync(folder).filter(file => file.endsWith('.jar'));

let queue = [...files];
let running = 0;

function deployOne(jarFile) {
  const baseName = jarFile.replace(/\.jar$/, '');
  const jarPath = path.join(folder, jarFile);
  const pomPath = path.join(folder, `${baseName}.pom`);

  if (!fs.existsSync(pomPath)) {
    console.error(`❌ 找不到对应的 pom 文件: ${baseName}.pom，跳过`);
    return Promise.resolve();
  }

  console.log(`🚀 开始上传: ${baseName}`);

  const cmd = [
    'mvn deploy:deploy-file',
    `-Dfile="${jarPath}"`,
    `-DpomFile="${pomPath}"`,
    `-Durl="${repositoryUrl}"`,
    `-DrepositoryId=${repositoryId}`,
    '-Dpackaging=jar'
  ].join(' ');

  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: folder }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 上传失败: ${baseName}`, stderr);
        reject(error);
      } else {
        console.log(`✅ 上传成功: ${baseName}`);
        resolve();
      }
    });
  });
}

async function startUpload() {
  console.log(`📝 准备上传 ${queue.length} 个jar包，最大并发 ${parallel} 个`);

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      if (!file) break;
      try {
        await deployOne(file);
      } catch (e) {
        console.error('上传遇到错误，继续处理下一个');
      }
    }
  }

  const workers = Array.from({ length: parallel }).map(worker);
  await Promise.all(workers);

  console.log('🎉 所有上传任务完成');
}

startUpload();
