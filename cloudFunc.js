const textToSpeech = require('@google-cloud/text-to-speech');
const storage = require('@google-cloud/storage')();
const bucketName = 'hotaru';
const tempFileName = 'temp.mp3';
/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.helloWorld = (req, res) => {
  // Example input: {"message": "Hello!"}
  if (req.body.message === undefined) {
    // This is an error case, as "message" is required.
    res.status(400).send('No message defined!');
    return;
  } else {
    console.log("Access TTS");
    var text = req.body.message;
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
      const bucket = storage.bucket(bucketName);
      if (err) {
        console.error('ERROR:', err);
        res.status(500).send('Error' + err);
        return;
      }
      console.log("access complete");
      const file = bucket.file(tempFileName);
      file.save(response.audioContent, {
        metadata: {
          contentType: "audio/mp3"
        }
      }, function(err) {
        if (err) {
          res.status(500).send('Error' + err);
          return;
        } else {

          file.makePublic().then(() => {
            res.status(200).send(getPublicUrl(gcsname));
            console.log("Success");
            return;
          });
        }
      });
    });
    // [END tts_synthesize_text]
  }
};
