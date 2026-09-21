import * as fs from 'node:fs/promises';
import {FtpClient} from './node_tools/FtpClient.mts';
import * as readline from 'node:readline';

const LOCAL_OUT = './out';
const LOCAL_INDEX = './index.html';

const REMOTE_DIR = '/test-app';

const prompt = (text)=>{
    return new Promise((resolve,reject)=>{

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(text, result => {
            rl.close();
            resolve(result);
        });
    })
}

let password = process.env.FTP_PASSWORD;
if (!password) {
    password = await prompt('password>');
}

const ftp = new FtpClient({
    host: 'ftp-vakozlov17.alwaysdata.net',
    user: 'vakozlov17',
    password: ''
});

async function main() {
    console.log('Checking deployment files...');

    await fs.access(LOCAL_OUT);
    await fs.access(LOCAL_INDEX);

    console.log('Connecting to FTP...');

    await ftp.connect();

    console.log(`Removing old deployment: ${REMOTE_DIR}`);
    await ftp.removeDirectory(REMOTE_DIR);

    console.log(`Creating deployment directory: ${REMOTE_DIR}`);

    await ftp.ensureDirectory(REMOTE_DIR);

    console.log(`Uploading ${LOCAL_OUT}...`);
    await ftp.uploadDirectory(LOCAL_OUT,REMOTE_DIR);

    console.log(`Uploading ${LOCAL_INDEX}...`);
    await ftp.upload(LOCAL_INDEX, `${REMOTE_DIR}/index.html`);

    console.log('Deployment completed successfully.');
}

main().catch(error => {
    console.error(
        'Deployment failed:'
    );
    console.error(
        error instanceof Error
            ? error.message
            : error
    );
    process.exitCode = 1;
}).finally(async ()=>{
    await ftp.close();
});
