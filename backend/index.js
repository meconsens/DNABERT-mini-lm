const express = require('express')
const { Parcel, AppId, JobPhase, JobSpec, JobStatusReport } = require("@oasislabs/parcel")
const app = express()
var cors = require('cors');
app.use(
    cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] })
  );
const port = 3001
const parcel = new Parcel({
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

app.get('/bobinfo', (req, res) => {
    parcel.getCurrentIdentity().then(parcelRes => {
        console.log(parcelRes.id)
        res.json({id: parcelRes.id.toString()})
    }).catch(error => {
        res.send(error)
    });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})