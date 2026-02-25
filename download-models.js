const fs = require('fs');
const https = require('https');
const models = [
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

Promise.all(models.map(m => {
    return new Promise((resolve, reject) => {
        https.get(baseUrl + m, res => {
            if (res.statusCode !== 200) return reject(new Error('Failed ' + m));
            const f = fs.createWriteStream('./public/models/' + m);
            res.pipe(f);
            f.on('finish', () => resolve());
            f.on('error', reject);
        });
    });
})).then(() => console.log('Models downloaded successfully')).catch(console.error);
