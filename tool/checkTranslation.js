const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const name = process.argv[2];

const IGNORE_CHECK = ['en'];
const IGNORE_MISSING = [
    '?', 'AC', 'Gravatar', 'ID', 'MD5', 'URL',
];
const RE_TEXT = /_\(['"]([\s\S])*?['"]\)/gmi;
const TEMPLATE_ROOT = path.resolve(__dirname, '..', 'templates');
const LOCALE_ROOT = path.resolve(__dirname, '..', 'locales');

const texts = {};
let currentFile = '';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _(str) {
    if (!texts[str]) texts[str] = [currentFile];
    else texts[str].push(currentFile);
}

function scan(folder, relative = '') {
    const files = fs.readdirSync(folder);
    for (const file of files) {
        const p = path.join(folder, file);
        if (fs.statSync(p).isDirectory()) {
            scan(p, path.join(relative, file));
        } else {
            currentFile = path.join(relative, file);
            const f = fs.readFileSync(p).toString();
            f.replace(RE_TEXT, (substr) => {
                try {
                    // eslint-disable-next-line no-eval
                    eval(substr);
                } catch (e) {
                    console.error('Cannot parse: ', substr, ' in file ', p);
                }
            });
        }
    }
}
scan(TEMPLATE_ROOT);
const result = {};
const locales = fs.readdirSync(LOCALE_ROOT);
if (!name) {
    for (const locale of locales) {
        if (!IGNORE_CHECK.includes(locale.split('.')[0])) {
            const p = path.join(LOCALE_ROOT, locale);
            const f = fs.readFileSync(p).toString();
            const l = yaml.safeLoad(f);
            for (const str in texts) {
                if (!l[str]) {
                    if (result[str]) result[str].locale.push(locale);
                    else result[str] = { source: texts[str], locale: [locale] };
                }
            }
        }
    }
} else {
    const p = path.join(LOCALE_ROOT, name);
    const f = fs.readFileSync(p).toString();
    const l = yaml.safeLoad(f);
    for (const str in texts) {
        if (!l[str]) {
            result[str] = texts[str];
        }
    }
}
for (const str of IGNORE_MISSING) delete result[str];
console.log(`${Object.keys(result).length} translations missing.`);
fs.writeFileSync(path.join(__dirname, '..', '__result.json'), JSON.stringify(result, null, 2));
console.log(`Result wrote to ${path.resolve(__dirname, '..', '__result.json')}`);
