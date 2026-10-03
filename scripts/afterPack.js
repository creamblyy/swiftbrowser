const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

/**
 * electron-builder on Windows needs winCodeSign (symlink privilege) to
 * run rcedit when signAndEditExecutable is true. We keep that flag false
 * and embed the app icon here with pure-JS resedit instead.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const iconPath = path.join(context.packager.projectDir, 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.warn('[afterPack] exe not found:', exePath);
    return;
  }
  if (!fs.existsSync(iconPath)) {
    console.warn('[afterPack] icon.ico not found:', iconPath);
    return;
  }

  const exeBuf = fs.readFileSync(exePath);
  const exe = ResEdit.NtExecutable.from(exeBuf, { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));

  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  if (!groups.length) {
    console.warn('[afterPack] no icon group in exe; skipping');
    return;
  }

  const icons = iconFile.icons.map((item) => item.data);
  for (const group of groups) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      group.id,
      group.lang,
      icons
    );
  }

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log('[afterPack] embedded icon into', exeName);
};
