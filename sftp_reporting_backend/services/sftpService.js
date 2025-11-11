import SftpClient from "ssh2-sftp-client";
const sftp = new SftpClient();

export async function connectSFTP() {
  await sftp.connect({
    host: process.env.SFTP_HOST,
    port: 22,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASS
  });
}

export async function listRemoteFiles(remotePath = "/") {
  try {
    const list = await sftp.list(remotePath);
    return list.map(item => ({
      name: item.name,
      path: remotePath === "/" ? `/${item.name}` : `${remotePath}/${item.name}`,
      type: item.type === "d" ? "directory" : "file",
      size: item.size,
      modified: item.modifyTime,
      extension: item.type === "d" ? null : item.name.split(".").pop() || null
    }));
  } catch (err) {
    console.error("❌ Erreur SFTP list:", err);
    return [];
  }
}
