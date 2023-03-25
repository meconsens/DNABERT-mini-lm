import Parcel from '@oasislabs/parcel';
// --- Upload data as Bob.
// In a real-world scenario, these credentials would typically be used in a completely separate script
// because no single entity has access to both Acme and Bob credentials.
// This example script, however, performs actions both as Acme and Bob so that the flow is easier to
// follow.
// #region snippet-input-documents
// const parcelBob = new Parcel({
//   clientId: process.env.BOB_SERVICE_CLIENT_ID!,
//   privateKey: {
//     "alg":"ES256",
//     "crv":"P-256",
//     "d":"5WIF6fviFUdlPt1ggtKuWBoBMo7sb1U73bZrg1c_hnQ",
//     "kty":"EC",
//     "use":"sig",
//     "x":"y8oTiqAyp07IHjuz_ojvpRKsCGAd1MigPLp1m4QVJcI",
//     "y":"ORITxML7e8DDCtySJbtWvx77i9YcWoWVcY_tk3YrDdA"
//   },
// });
// const bobId = (await parcelBob.getCurrentIdentity()).id;
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
const parcelAcme = new Parcel({
    clientId: process.env.ACME_SERVICE_CLIENT_ID,
    privateKey: {
        "alg": "ES256",
        "crv": "P-256",
        "d": "5WIF6fviFUdlPt1ggtKuWBoBMo7sb1U73bZrg1c_hnQ",
        "kty": "EC",
        "use": "sig",
        "x": "y8oTiqAyp07IHjuz_ojvpRKsCGAd1MigPLp1m4QVJcI",
        "y": "ORITxML7e8DDCtySJbtWvx77i9YcWoWVcY_tk3YrDdA"
    },
});
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
// #endregion snippet-successful-download
// #region snippet-job-request
// Define the job.
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
// #endregion snippet-job-output
