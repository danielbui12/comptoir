const path = require('path');
const { spawn } = require('child_process');
const { Solita } = require('@metaplex-foundation/solita');
const { writeFile } = require('fs/promises');

const PROGRAM_NAME = 'comptoir';
const PROGRAM_ID = 'FY4tLSXn95o5YuecY3sAfPCoPk9ZSs2cvFa9HiHYPFgy';

const programDir = path.join(__dirname, '..', 'program', 'programs', 'comptoir');
const generatedIdlDir = path.join(__dirname, 'idl');
const generatedSDKDir = path.join(__dirname, 'src', 'generated');

async function main() {
    console.error('This may takes a while for installing package requirement...')
    const anchor = spawn("anchor", ['build', '--idl', generatedIdlDir], { cwd: programDir })
        .on('error', (err) => {
            console.error(err);
            if (err.code === 'ENOENT') {
                console.error(
                    'Ensure that `anchor` is installed and in your path, see:\n  https://www.anchor-lang.com/docs/installation\n',
                );
            }
            process.exit(1);
        })
        .on('exit', () => {
            console.log('IDL written to: %s', path.join(generatedIdlDir, `${PROGRAM_NAME}.json`));
            generateTypeScriptSDK();
        });

    anchor.stdout.on('data', (buf) => console.log(buf.toString('utf8')));
    anchor.stderr.on('data', (buf) => console.error(buf.toString('utf8')));
}

async function generateTypeScriptSDK() {
    console.error('Generating TypeScript SDK to %s', generatedSDKDir);
    const generatedIdlPath = path.join(generatedIdlDir, `${PROGRAM_NAME}.json`);

    const idl = require(generatedIdlPath);
    if (idl.metadata?.address == null) {
        idl.metadata = { ...idl.metadata, address: PROGRAM_ID };
        await writeFile(generatedIdlPath, JSON.stringify(idl, null, 2));
    }
    const gen = new Solita(idl, { formatCode: true });
    await gen.renderAndWriteTo(generatedSDKDir);

    console.error('Success!');

    process.exit(0);
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
