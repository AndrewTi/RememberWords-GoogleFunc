require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const pdf = require('html-pdf');

admin.initializeApp({
  credential: admin.credential.cert(require(process.env.FIREBASE_CREDENTIAL_PATH)),
  databaseURL: process.env.FIREBASE_URL
});

/** 
 @api {post} /translate Translate word or sentese 
 @apiVersion 0.0.1
 @apiName Translate
 @apiGroup Word

 @apiParam {String} [targLang] Translate to 
 @apiParam {String} [sourceLang] Translate from
 @apiParam {String} [text] text what need to translate

 @apiParamExample {json} [Reuest-example]
    { "targLang": "uk", "sourceLang": "auto", "text": "hello" }
    
*/
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

/** 
 @api {post} /addWord Add word or sentese 
 @apiVersion 0.0.1
 @apiName AddWord
 @apiGroup Word

 @apiParam {String} [word] Word/sentence what need to save
 @apiParam {String} [data] The data what request to translate api are returned to you

 @apiParamExample {json} [Reuest-example]
    { "word": "Hello World", "data": "..." }
*/
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

    console.log('test')

    admin.firestore().collection('/words').doc(word.toLowerCase()).set({value: data}).then(result => {
        console.log('gav');
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


/** 
 @api {get} /toPDF Download all words in PDF document
 @apiVersion 0.0.1
 @apiName ToPDF
 @apiGroup Word
*/
exports.toPDF = functions.https.onRequest((req, res) => {
    admin.firestore().collection('/words').get().then(docs => {
        let html = '<h1 style="text-align: center"> Remember Words! </h1>';

        docs.forEach(doc => {
            var parsed = JSON.parse(doc.data().value);

            if(parsed) {
                let sentences = parsed.sentences[0];

                html += `<div> <span>${ sentences.orig.toLowerCase() }</span> <span style='float: right'>${ sentences.trans.toLowerCase() }</span> </div> <hr/>`;
            }
        })

        return pdf.create(html).toStream((err, stream) => {
            if(!err)
                stream.pipe(res);
        })
    }).catch(err => {
        console.log(err);
    })
});

/** 
 @api {get} /getAllWords Download all words in JSON format
 @apiVersion 0.0.1
 @apiName GetAllWords
 @apiGroup Word

  @apiSuccessExample {json} [Response]
                   [{"sentences":[{"trans":"досягнення","orig":"achieving","backend":3}],"dict":[{"pos":"verb","terms":["успішно виконувати","відбувати","добиватися","достигати","досягати","досягти"],"entry":[{"word":"успішно виконувати","reverse_translation":["achieve"]},{"word":"відбувати","reverse_translation":["complete","achieve","get off","finish","accomplish"]},{"word":"добиватися","reverse_translation":["achieve","obtain","attain","seek after","aim","apply for"]},{"word":"достигати","reverse_translation":["ripen","mature","mellow","reach","achieve","attain"]},{"word":"досягати","reverse_translation":["reach","achieve","attain","obtain","accomplish","amount"]},{"word":"досягти","reverse_translation":["achieve","reach","win","acquire","buy"]}],"base_form":"achieve","pos_enum":2}],"src":"en","confidence":1,"ld_result":{"srclangs":["en"],"srclangs_confidences":[1],"extended_srclangs":["en"]}}]
*/
exports.getAllWords = functions.https.onRequest((req, res) => {
    admin.firestore().collection('/words').get().then(docs => {
        const respArr = [];

        docs.forEach(doc => {
            var parsed = JSON.parse(doc.data().value);

            if(parsed) 
                respArr.push(parsed);
        })

        return res.json(respArr);
    }).catch(err => {
        console.log(err);
    })
})