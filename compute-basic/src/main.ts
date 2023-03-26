import fs from 'fs';

import Parcel, { AppId, JobSpec, JobStatusReport, JobPhase, IdentityId } from '@oasislabs/parcel';

// --- Upload data as Bob.
// In a real-world scenario, these credentials would typically be used in a completely separate script
// because no single entity has access to both Acme and Bob credentials.
// This example script, however, performs actions both as Acme and Bob so that the flow is easier to
// follow.
// #region snippet-input-documents
// console
// const parcelBob = new Parcel({
//   clientId: process.env.BOB_SERVICE_CLIENT_ID!,
//   privateKey: {
//     kid: 'bob-service-client',
//     use: 'sig',
//     kty: 'EC',
//     crv: 'P-256',
//     alg: 'ES256',
//     x: 'kbhoJYKyOgY645Y9t-Vewwhke9ZRfLh6_TBevIA6SnQ',
//     y: 'SEu0xuCzTH95-q_-FSZc-P6hCSnq6qH00MQ52vOVVpA',
//     d: '10sS7lgM_YWxf79x21mWalCkAcZZOmX0ZRE_YwEXcmc',
//   },
// });
// const bobId = (await parcelBob.getCurrentIdentity()).id;

// console.log(bobId);
// Upload a document and give Acme access to it.
// console.log('Uploading input document as Bob.');
// const recipeDocument = await parcelBob.uploadDocument(
//   '14g butter; 15g chicken sausage; 18g feta; 20g green pepper; 1.5min baking',
//   { toApp: undefined },
// ).finished;
// await parcelBob.createGrant({
//   grantee: process.env.ACME_APP_ID! as AppId,
//   condition: { 'document.id': { $eq: recipeDocument.id } },
// });
// #endregion snippet-input-documents

// --- Run compute job as Acme.

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

const bobId = 'I48fb42eWusXLBT3mx74uYF' as IdentityId;
const appId = 'AFm8mvPu3tzM6r9jR72G4A6' as AppId;

// const data = 'Eggs and Emmentaler is the best!';
// const documentDetails = { title: 'Favorite sando', tags: ['lang:en'] };
// const acmeDocument = await parcelAcme.uploadDocument(data, {
//   details: documentDetails,
//   toApp: undefined,
// }).finished;
const acmeDocument = await parcelAcme.uploadDocument(
  await fs.promises.readFile('../dna-bert/test_workdir/data/in/basal_cell_carcinoma_example.jpg'),
  { details: { title: 'sequence sample' }, toApp: appId},
).finished;
console.log(`Created document ${acmeDocument.id} with owner ${acmeDocument.owner}`);

// console.log('Uploading input document as Bob.');
// const recipeDocument = await parcelAcme.uploadDocument(
//   '14g butter; 15g chicken sausage; 18g feta; 20g green pepper; 1.5min baking',
//   { toApp: undefined },
// ).finished;

console.log('Downloading output document as Bob.');
const outputDownload = parcelAcme.downloadDocument(acmeDocument.id);
const outputSaver = fs.createWriteStream(`/tmp/output_document`);
await outputDownload.pipeTo(outputSaver);
const output = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output}"`);


const jobSpec: JobSpec = {
    name: 'dna-pred',
    // image: 'bash',
    image: 'mattchoi531/test1123',
    inputDocuments: [{ mountPath: 'test.jpg', id: acmeDocument.id }],
    outputDocuments: [{ mountPath: 'prediction.txt', owner: appId }],
    cmd: [
      'python',
      'predict.py',
      '/parcel/data/in/test.jpg',
      '/parcel/data/out/prediction.txt',
    ],
    // cmd: [
    //   // '-c',
    //   // 'echo "$(cat /parcel/data/in/test.csv)" >/parcel/data/out/count.txt'
    //   ,
    //   // 'echo "Document has $(wc -w </parcel/data/in/test.txt) words" >/parcel/data/out/count.txt)'
    // ],
    memory: '4G',
  };

  console.log('Running the job as Acme.');
const jobId = (await parcelAcme.submitJob(jobSpec)).id;

let jobReport: JobStatusReport;
do {
  await new Promise((resolve) => setTimeout(resolve, 15000)); // eslint-disable-line no-promise-executor-return
  jobReport = await parcelAcme.getJobStatus(jobId);
  console.log(`Job status is ${JSON.stringify(jobReport.status)}`);
} while (
  jobReport.status.phase === JobPhase.PENDING ||
  jobReport.status.phase === JobPhase.RUNNING
);

const job = await parcelAcme.getJob(jobId);

console.log(`Job ${jobId} completed with status ${job.status?.phase} and ${job.io.outputDocuments.length} output document(s).`);


console.log('Downloading output document as Bob.');
const outputDownload1 = parcelAcme.downloadDocument(job.io.outputDocuments[0].id);
const outputSaver1 = fs.createWriteStream(`/tmp/output_document`);
await outputDownload1.pipeTo(outputSaver1);
const output1 = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output1}"`);


// console.log(`Uploading data for end user Bob (ID: ${bobId}) for your app (ID: ${appId})`);
// const bobDocument = await parcelAcme.uploadDocument(data, {
//   details: documentDetails,
//   owner: bobId,
//   toApp: appId,
// }).finished;
// console.log(`Created document ${bobDocument.id} with owner ${bobDocument.owner}`);

// const download = parcelAcme.downloadDocument(bobDocument.id);
// const saver = fs.createWriteStream(`./bob_data_by_acme`);
// try {
//   console.log(
//     `Attempting to access Bob's document using Acme's identity ${acmeIdentity.id} and without permission...`,
//   );
//   await download.pipeTo(saver);
// } catch (error: any) {
//   console.log(`Acme was not able to access Bob's data (this was expected): ${error}`);
// }




// #region snippet-successful-download
// const recipeDownload = parcelAcme.downloadDocument(recipeDocument.id);
// const recipeSaver = fs.createWriteStream(`./bob_data_by_acme`);
// try {
//   console.log(`Attempting to access Bob's document...`);
//   await recipeDownload.pipeTo(recipeSaver);
//   console.log('Successful download! (this was expected)');
// } catch (error: any) {
//   console.log(`Acme was not able to directly access Bob's data: ${error}`);
// }
// // #endregion snippet-successful-download

// // #region snippet-job-request
// // Define the job.
// const jobSpec: JobSpec = {
//   name: 'word-count',
//   image: 'bash',
//   inputDocuments: [{ mountPath: 'recipe.txt', id: recipeDocument.id }],
//   outputDocuments: [{ mountPath: 'count.txt', owner: bobId }],
//   cmd: [
//     '-c',
//     'echo "Document has $(wc -w </parcel/data/in/recipe.txt) words" >/parcel/data/out/count.txt',
//   ],
// };
// // #endregion snippet-job-request

// // #region snippet-job-submit-wait
// // Submit the job.
// console.log('Running the job as Acme.');
// const jobId = (await parcelAcme.submitJob(jobSpec)).id;

// // Wait for job to finish.
// let jobReport: JobStatusReport;
// do {
//   await new Promise((resolve) => setTimeout(resolve, 5000)); // eslint-disable-line no-promise-executor-return
//   jobReport = await parcelAcme.getJobStatus(jobId);
//   console.log(`Job status is ${JSON.stringify(jobReport.status)}`);
// } while (
//   jobReport.status.phase === JobPhase.PENDING ||
//   jobReport.status.phase === JobPhase.RUNNING
// );

// const job = await parcelAcme.getJob(jobId);

// console.log(
//   `Job ${jobId} completed with status ${job.status?.phase} and ${job.io.outputDocuments.length} output document(s).`,
// );
// // #endregion snippet-job-submit-wait

// // Obtain compute job output -- again as Bob, because the computation was confidential and Acme
// // does not have access to the output data.
// // #region snippet-job-output
// console.log('Downloading output document as Bob.');
// const outputDownload = parcelBob.downloadDocument(job.io.outputDocuments[0].id);
// const outputSaver = fs.createWriteStream(`/tmp/output_document`);
// await outputDownload.pipeTo(outputSaver);
// const output = fs.readFileSync('/tmp/output_document', 'utf-8');
// console.log(`Here's the computed result: "${output}"`);
// // #endregion snippet-job-output
