import { Platform, PermissionsAndroid, ToastAndroid, Clipboard } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNBlobUtil from 'react-native-blob-util';
import * as RNHTMLtoPDFModule from 'react-native-html-to-pdf';
import * as XLSX from 'xlsx';
import RNPrint from 'react-native-print';

const RNHTMLtoPDF: any = (RNHTMLtoPDFModule as any)?.default ?? RNHTMLtoPDFModule;

export type ExportConfig = {
  data: any[];
  title: string;
  accent: string;
  headers: string[];
  toExcelRow: (item: any) => Record<string, any>;
  toCsvCells: (item: any) => any[];
  toCopyLine: (item: any, index: number) => string;
  toPrintCells: (item: any, index: number) => string;
};

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Platform.Version >= 29) return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to storage to save the file.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const saveAndShare = async (base64Data: string, fileName: string, mimeType: string) => {
  let finalFilePath = '';
  if (Platform.OS === 'android') {
    if (Platform.Version >= 29) {
      const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      await RNBlobUtil.fs.writeFile(tempPath, base64Data, 'base64');
      await RNBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: '', mimeType },
        'Download',
        tempPath
      );
      finalFilePath = tempPath;
    } else {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) { ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT); return; }
      finalFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(finalFilePath, base64Data, 'base64');
    }
    ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
  } else {
    finalFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    await RNFS.writeFile(finalFilePath, base64Data, 'base64');
  }
  await Share.open({ url: `file://${finalFilePath}`, type: mimeType, filename: fileName, failOnCancel: false });
};

export const saveTextAndShare = async (content: string, fileName: string, mimeType: string) => {
  let finalFilePath = '';
  if (Platform.OS === 'android') {
    if (Platform.Version >= 29) {
      const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      await RNBlobUtil.fs.writeFile(tempPath, content, 'utf8');
      await RNBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: '', mimeType },
        'Download',
        tempPath
      );
      finalFilePath = tempPath;
    } else {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) { ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT); return; }
      finalFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(finalFilePath, content, 'utf8');
    }
    ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
  } else {
    finalFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    await RNFS.writeFile(finalFilePath, content, 'utf8');
  }
  await Share.open({ url: `file://${finalFilePath}`, type: mimeType, filename: fileName, failOnCancel: false });
};

export const buildReportHtml = (cfg: ExportConfig, activeCategory: string): string => {
  const accentColor = cfg.accent;
  const headerCells = cfg.headers.map(h => `<th>${h}</th>`).join('');
  const bodyRows = cfg.data
    .map((item, i) => `
    <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
      ${cfg.toPrintCells(item, i)}
    </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding: 28px; }
.report-header {
  background: ${accentColor};
  border-radius: 14px; padding: 24px 28px; margin-bottom: 22px; color: #fff;
}
.report-header .brand { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.75; margin-bottom: 6px; font-weight: 700; }
.report-header h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
.report-header p { font-size: 11.5px; opacity: 0.9; }
.stats-row { display: flex; gap: 14px; margin-bottom: 22px; }
.stat-card { flex: 1; background: #fff; border-radius: 12px; padding: 14px 18px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 800; color: ${accentColor}; }
.stat-value.small { font-size: 14px; margin-top: 2px; }
.table-container { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
table { width:100%; border-collapse: collapse; }
thead tr { background: ${accentColor}; }
th { color: #fff; padding: 11px 10px; text-align: left; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
td { padding: 10px 10px; font-size: 10.5px; color: #0f172a; vertical-align: top; word-break: break-word; border-bottom: 1px solid #f1f5f9; }
.row-even td { background: #f8fafc; }
.row-odd td  { background: #ffffff; }
tr:last-child td { border-bottom: none; }
.footer { margin-top: 18px; text-align: center; font-size: 9.5px; color: #94a3b8; letter-spacing: 0.3px; }
</style>
</head>
<body>
<div class="report-header">
  <div class="brand">WebbiTech Lead Tracker</div>
  <h1>${cfg.title} Report</h1>
  <p>Generated on ${new Date().toLocaleString()} &nbsp;•&nbsp; Total: ${cfg.data.length} records</p>
</div>
<div class="stats-row">
  <div class="stat-card"><div class="stat-label">Total Records</div><div class="stat-value">${cfg.data.length}</div></div>
  <div class="stat-card"><div class="stat-label">Export Date</div><div class="stat-value small">${new Date().toLocaleDateString()}</div></div>
  <div class="stat-card"><div class="stat-label">Category</div><div class="stat-value small">${activeCategory.toUpperCase()}</div></div>
</div>
<div class="table-container">
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</div>
<div class="footer">Generated by WebbiTech Lead Tracker &nbsp;•&nbsp; Confidential</div>
</body>
</html>`;
};

export const exportCopy = (cfg: ExportConfig) => {
  if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to copy', ToastAndroid.SHORT); return; }
  const text = cfg.data.map((item, i) => cfg.toCopyLine(item, i)).join('\n\n---\n\n');
  Clipboard.setString(text);
  ToastAndroid.show(`Copied ${cfg.data.length} record(s) to clipboard`, ToastAndroid.SHORT);
};

export const exportExcel = async (cfg: ExportConfig) => {
  if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to export', ToastAndroid.SHORT); return; }
  const exportData = cfg.data.map((item) => cfg.toExcelRow(item));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, cfg.title);
  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}.xlsx`;
  await saveAndShare(wbout, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const exportCSV = async (cfg: ExportConfig) => {
  if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to export', ToastAndroid.SHORT); return; }
  const escapeCSV = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headerRow = cfg.headers.slice(1).join(',');
  const dataRows = cfg.data.map((item) => cfg.toCsvCells(item).map(escapeCSV).join(','));
  const csvContent = [headerRow, ...dataRows].join('\n');
  const fileName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}.csv`;
  await saveTextAndShare(csvContent, fileName, 'text/csv');
};

export const exportPrint = async (cfg: ExportConfig, activeCategory: string) => {
  if (!cfg || cfg.data.length === 0) {
    ToastAndroid.show('No records to print', ToastAndroid.SHORT);
    return;
  }
  const html = buildReportHtml(cfg, activeCategory);
  await RNPrint.print({ html });
};

let isExportingPdf = false;
export const exportPDF = async (cfg: ExportConfig, activeCategory: string) => {
  if (isExportingPdf) return;
  isExportingPdf = true;
  try {
    ToastAndroid.show('Generating PDF...', ToastAndroid.SHORT);
    if (!cfg || cfg.data.length === 0) {
      ToastAndroid.show('No records to export', ToastAndroid.SHORT);
      isExportingPdf = false;
      return;
    }

    let reportData = cfg.data;
    let titleMsg = '';
    if (cfg.data.length > 800) {
      reportData = cfg.data.slice(0, 800);
      titleMsg = ' (Showing latest 800 records)';
      ToastAndroid.show('Exporting latest 800 records to prevent timeout. Use Date Filters for older records.', ToastAndroid.LONG);
    }

    const modifiedCfg = { ...cfg, data: reportData, title: cfg.title + titleMsg };
    const html = buildReportHtml(modifiedCfg, activeCategory);
    const baseName = `${modifiedCfg.title.replace(/ /g, '_')}_${Date.now()}`;
    const fileName = `${baseName}.pdf`;

    const options: any = { 
      html, 
      fileName: baseName, 
      base64: false, 
      forceReset: true,
      width: 595,
      height: 842
    };
    const pdf = await RNHTMLtoPDF.generatePDF(options);

    if (!pdf || !pdf.filePath) {
      ToastAndroid.show('Failed to generate PDF', ToastAndroid.SHORT);
      return;
    }

    const sourcePath = pdf.filePath.replace('file://', '');
    let finalUrl = `file://${sourcePath}`;

    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 29) {
          await RNBlobUtil.MediaCollection.copyToMediaStore(
            { name: fileName, parentFolder: '', mimeType: 'application/pdf' },
            'Download',
            sourcePath
          );
        } else {
          const hasPermission = await requestStoragePermission();
          if (hasPermission) {
            const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
            await RNFS.copyFile(sourcePath, destPath);
            finalUrl = `file://${destPath}`;
          }
        }
        ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
      } catch (copyErr) {
        console.error('Copy to Downloads failed', copyErr);
      }
    }

    setTimeout(async () => {
      try {
        await Share.open({
          url: finalUrl,
          type: 'application/pdf',
          filename: fileName,
          failOnCancel: false,
        });
      } catch (err) {}
    }, 300);

  } catch (e) {
    console.error('PDF export error:', e);
    ToastAndroid.show('Failed to export PDF', ToastAndroid.SHORT);
  } finally {
    isExportingPdf = false;
  }
};
