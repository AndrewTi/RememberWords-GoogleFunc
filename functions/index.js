const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const pdf = require('html-pdf');
const serviceAccount = require('./rm-words-firebase-adminsdk-393b8-bfae41bfe6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rm-words.firebaseio.com"
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