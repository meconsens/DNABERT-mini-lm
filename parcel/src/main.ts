import fs from 'fs';

import Parcel, { AppId, JobSpec, JobStatusReport, JobPhase } from '@oasislabs/parcel';

// --- Upload data as Bob.

const parcelBob = new Parcel({
  clientId: "C6g34VJA3UL88SyBmTBCwc3",
  privateKey: {
      "kty": "EC",
      "kid": "mHp2aiwbqydDrQYpPZLdRxZTMW-geqahZx0jRlzktgA",
      "use": "sig",
      "alg": "ES256",
      "crv": "P-256",
      "x": "6yu34QUNeuSSlO5B9JHEL5oYmqeadrl9eroIWXH2yZg",
      "y": "ITJ27rPyzfUS62l4EyV-i5qIZbsM9ZfEJndI4ASc-8s",
      "d": "f2XXHL5mgpZYqb21q8DDV1YaSHfddUdPTl735Wt54d4"
    },
});
const bobId = (await parcelBob.getCurrentIdentity()).id;
console.log(bobId);

// create acme parcel
const parcelAcme = new Parcel({
  clientId: 'CY7u48AFjfRrs28LXMNGgyM',
  privateKey: {
    "alg":"ES256",
    "crv":"P-256",
    "d":"5WIF6fviFUdlPt1ggtKuWBoBMo7sb1U73bZrg1c_hnQ",
    "kty":"EC",
    "use":"sig",
    "x":"y8oTiqAyp07IHjuz_ojvpRKsCGAd1MigPLp1m4QVJcI",
    "y":"ORITxML7e8DDCtySJbtWvx77i9YcWoWVcY_tk3YrDdA"
  },
});

const acmeIdentity = await parcelAcme.getCurrentIdentity();
console.log(`Uploading data with identity: ${acmeIdentity.id}`);

// const bobId = 'I48fb42eWusXLBT3mx74uYF' as IdentityId;
const appId = 'AFm8mvPu3tzM6r9jR72G4A6' as AppId;

const bobDocument = await parcelAcme.uploadDocument(
  await fs.promises.readFile('dna-bert/test_workdir/data/in/sequence_sample.csv'),
  { details: { title: 'sequence sample' }, toApp: appId, owner: bobId},
).finished;

console.log(`Created document ${bobDocument.id} with owner ${bobDocument.owner}`);

await parcelBob.createGrant({
  grantee: appId,
  condition: { 'document.id': { $eq: bobDocument.id } },
});

console.log("Bob granted access to Acme to run job");

console.log('Downloading output document as Bob.');
const outputDownload = parcelAcme.downloadDocument(bobDocument.id);
const outputSaver = fs.createWriteStream(`/tmp/output_document`);
await outputDownload.pipeTo(outputSaver);
const output = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output}"`);


const jobSpec: JobSpec = {
    name: 'dna-pred',
    image: 'mattchoi531/dna-bert',
    inputDocuments: [{ mountPath: 'test.csv', id: bobDocument.id }],
    outputDocuments: [{ mountPath: 'prediction.txt', owner: bobId }],
    cmd: [
      '/parcel/data/in/test.csv',
      '/parcel/data/out/prediction.txt',
    ],
    memory: '4G',
  };

  console.log('Running the job as Acme.');
const jobId = (await parcelAcme.submitJob(jobSpec)).id;

let jobReport: JobStatusReport;
do {
  await new Promise((resolve) => setTimeout(resolve, 5000)); // eslint-disable-line no-promise-executor-return
  jobReport = await parcelAcme.getJobStatus(jobId);
  console.log(`Job status is ${JSON.stringify(jobReport.status)}`);
} while (
  jobReport.status.phase === JobPhase.PENDING ||
  jobReport.status.phase === JobPhase.RUNNING
);

const job = await parcelAcme.getJob(jobId);

console.log(`Job ${jobId} completed with status ${job.status?.phase} and ${job.io.outputDocuments.length} output document(s).`);


console.log('Downloading output document as Bob.');
const outputDownload1 = parcelBob.downloadDocument(job.io.outputDocuments[0].id);
const outputSaver1 = fs.createWriteStream(`/tmp/output_document`);
await outputDownload1.pipeTo(outputSaver1);
const output1 = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output1}"`);

try {
  console.log('Downloading output document as Acme.');
  const outputDownload2 = parcelAcme.downloadDocument(job.io.outputDocuments[0].id);
  const outputSaver2 = fs.createWriteStream(`/tmp/output_document`);
  await outputDownload2.pipeTo(outputSaver2);
  const output2 = fs.readFileSync('/tmp/output_document', 'utf-8');
  console.log(`Here's the computed result: "${output2}"`);
} catch(e: unknown) {
  console.log("Error: bob is the owner of the document and we are trying to download this through ACME.")
}
