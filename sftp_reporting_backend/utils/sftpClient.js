import SftpClient from "ssh2-sftp-client";
import dotenv from "dotenv";
dotenv.config();

export async function listSftpDirectory(path = "/") {
  const sftp = new SftpClient();
  await sftp.connect({
    host: process.env.SFTP_HOST,
    port: 22,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASS,
  });

  const files = await sftp.list(path);
  await sftp.end();
  return files.map(f => ({
    name: f.name,
    path: path + f.name,
    size: f.size,
    type: f.type,
    modifyTime: new Date(f.modifyTime * 1000),
  }));
}
