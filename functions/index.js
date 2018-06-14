require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const pdf = require('html-pdf');

admin.initializeApp({
  credential: admin.credential.cert(require(process.env.FIREBASE_CREDENTIAL_PATH)),
  databaseURL: process.env.FIREBASE_URL
});

exports.translate = functions.https.onRequest((req, res) => {
    res.set('Content-Type', 'application/json');
    res.set('charset', 'utf-8');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');

    const { targLang = 'uk', sourceLang = 'auto', text } = JSON.parse(req.body);

    if(!text) {
        res.status(400);

        res.json({
            error: true,
            code: 400,
            message: "Bad request"
        });
    }

    console.log(req.body);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targLang}&dt=bd&dj=1&source=input&dt=t&q=` + encodeURI(text);

    fetch(url).then( data => data.text()).then(text => {
        // console.log(text);
        return res.json(JSON.parse(text));
    }).catch(err => {
        console.log(err);
        res.status(500);

        res.json({
            error: true,
            code: 500,
            message: "something wrong"
        });
    })
})

exports.addWord = functions.https.onRequest((req, res) => {
    res.set('Content-Type', 'application/json');
    res.set('charset', 'utf-8');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');

    const { word, data } = JSON.parse(req.body);

    if(!word || !data) {
        res.status(400);

        return res.json({
            error: true,
            code: 400,
            message: "Bad request"
        });
    }

    admin.firestore().collection('/words').doc(word).set({value: JSON.stringify(data)}).then(result => {
        return res.json({ok: true});
    }).catch(err => {
        console.log(err);
        res.status(500);

        res.json({
            error: true,
            code: 500,
            message: "something wrong"
        });
    })
})

exports.toPDF = functions.https.onRequest((req, res) => {
    pdf.create('<h1>hello world</h1>').toStream((err, stream) => {
        if(!err)
            stream.pipe(res);
    })
});