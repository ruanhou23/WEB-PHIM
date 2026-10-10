const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function main() {
  const dir = path.resolve(__dirname, '..');

  console.log('Đang kiểm tra trạng thái Git...');
  const currentBranch = await git.currentBranch({ fs, dir });
  console.log(`Nhánh hiện tại: ${currentBranch}`);

  // Lấy danh sách file thay đổi / chưa theo dõi
  const statusMatrix = await git.statusMatrix({ fs, dir });
  
  let addedCount = 0;
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    // Nếu file bị xóa trong workdir
    if (workdir === 0) {
      await git.remove({ fs, dir, filepath });
      addedCount++;
    } else if (workdir !== head || stage !== workdir) {
      // File mới hoặc có thay đổi
      await git.add({ fs, dir, filepath });
      addedCount++;
    }
  }

  console.log(`Đã thêm/cập nhật ${addedCount} tệp vào Git.`);

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'ruanhou23',
      email: 'ruanhou23@users.noreply.github.com',
    },
    message: 'feat: Cập nhật toàn bộ mã nguồn web xem phim hoàn chỉnh',
  });

  console.log(`✅ Commit thành công! SHA: ${sha}`);
}

main().catch(err => {
  console.error('Lỗi Git:', err);
  process.exit(1);
});
