const textToSpeech = require('@google-cloud/text-to-speech');
const storage = require('@google-cloud/storage')();
const bucketName = 'hotaru0';
/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.helloWorld = (req, res) => {
  const filename = new Date().getTime() + ".mp3";
  const file = storage.bucket(bucketName).file(filename);
  if (req.body.message === undefined) {
    res.status(400).send('No message defined!');
    return;
  } else {
    console.log("Access TTS");
    var text = req.body.message;
    console.log("Text: " + text);
    // Everything is okay.
    // [START tts_synthesize_text]

    const client = new textToSpeech.TextToSpeechClient();

    const request = {
      input: {
        text: text
      },
      voice: {
        languageCode: 'ja-JP',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3'
      },
    };

    client.synthesizeSpeech(request, (err, response) => {
      if (err) {
        console.error('ERROR:', err);
        res.status(500).send('Error' + err);
        return;
      }
      console.log("access complete");
      file.save(response.audioContent, {
        metadata: {
          contentType: "audio/mp3"
        }
      }, function(err) {
        if (err) {
          console.error('ERROR:', err);
          res.status(500).send('Error' + err);
          return;
        } else {
          file.makePublic().then(() => {
            res.status(200).send(`https://storage.googleapis.com/${bucketName}/${filename}`);
            console.log("Success");
            return;
          });
        }
      });
    });
    // [END tts_synthesize_text]
  }
};
