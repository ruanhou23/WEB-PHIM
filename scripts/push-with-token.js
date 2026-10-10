const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.log('📌 Vui lòng truyền GitHub Personal Access Token:');
    console.log('   node scripts/push-with-token.js <ghp_your_token>\n');
    process.exit(1);
  }

  const dir = path.resolve(__dirname, '..');
  console.log('🚀 Đang đẩy toàn bộ mã nguồn lên GitHub (https://github.com/ruanhou23/WEB-PHIM.git)...');

  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({
      username: token,
      password: '',
    }),
  });

  console.log('✅ ĐÃ ĐẨY CODE LÊN GITHUB THÀNH CÔNG!');
  console.log(pushResult);
}

main().catch(err => {
  console.error('❌ Lỗi đẩy code:', err.data || err.message);
  process.exit(1);
});
