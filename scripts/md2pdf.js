const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const mdPath = process.argv[2] || 'docs/GM_BUS_PLATFORM_DOC.md';
const htmlPath = process.argv[3] || 'docs/_temp.html';

const md = fs.readFileSync(mdPath, 'utf8');
const body = marked.parse(md);

const style = `
body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;max-width:900px;margin:40px auto;padding:24px;line-height:1.65;color:#1f2937;background:#fff}
h1{color:#2563eb;border-bottom:3px solid #2563eb;padding-bottom:12px;font-size:32px}
h2{color:#1e40af;border-bottom:1px solid #cbd5e1;padding-bottom:6px;margin-top:36px;font-size:24px}
h3{color:#1e40af;font-size:18px;margin-top:24px}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.9em;color:#be123c}
pre{background:#1e293b;color:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto;font-size:12px}
pre code{background:none;color:inherit;padding:0}
table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14px}
th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left}
th{background:#f1f5f9;font-weight:600;color:#0f172a}
tr:nth-child(even){background:#f9fafb}
hr{border:none;border-top:1px solid #e5e7eb;margin:32px 0}
ul,ol{padding-left:24px}
li{margin:4px 0}
strong{color:#0f172a}
blockquote{border-left:4px solid #cbd5e1;padding-left:16px;margin:16px 0;color:#64748b}
@page{size:A4;margin:15mm}
`;

const doctype = '<' + '!DOCTYPE html>';
const html = doctype + '<html><head><meta charset="UTF-8"><title>GM Bus Platform Documentation</title><style>' + style + '</style></head><body>' + body + '</body></html>';

fs.writeFileSync(htmlPath, html);
console.log('✅ HTML तयार:', html.length, 'bytes');
