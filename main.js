const axios = require('axios');
const csv = require('csvtojson');
const mime = require('mime-types')
const FormData = require('form-data');
const fs = require('fs');

const rp = require('request-promise');
require('dotenv').config();

//Set API Token
let api_key = process.env.API_KEY;

//Set image path
let imagePath = "images/";
let workingPath = "/Users/crowley/Desktop/workspace/Programming/node_scripts/avatar";
let csvPath = "sample.csv";


const header = {
    'Authorization': `Bearer ${api_key}`
};
let domain = 'caseyrowley.instructure.com'
let validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

const uploadFile = async (fName, mimetype, fsize, userId) => {
    let informDomain = `https://${domain}/api/v1/users/self/files`;
    let options = {
        method: 'POST',
        uri: informDomain,
        headers: header,
        formData: {
            "name": fName,
            "content_type": mimetype,
            "size": fsize,
            "parent_folder_path": "profile_pictures",
            "as_user_id": `sis_user_id:${userId}`
        }


    }

    let r = await rp(options)
        .catch((err) => {
            console.log(`Error: ${err}`);
        })

    let res = await r;
    return res;


};


let uploadImage = async (nurl, params, img) => {

    let options = {
        method: 'POST',
        uri: nurl,
        headers: header,
        formData: {
            file: {
                value: fs.createReadStream(img),
                options: {
                    filename: params.filename,
                    contentType: params.content_type
                }
            }
        }
    }

    let t = await rp(options)
        .catch((er) => {
            console.log(er);
        })
    let res = await t;
    return res;

}

let confirmUpload = async (loc) => {
    let options = {
        method: 'POST',
        uri: loc,
        headers: header
    }
    let r = await rp(options)
        .catch((err) => {
            console.log(`Failed at confirmation ${err}`);
        })
    let res = await r;
    return res;
}

let getAvatarOptions = async (userId) => {

    let url = `https://${domain}/api/v1/users/sis_user_id:${userId}/avatars`;
    let param = {
        'as_user_id': `sis_user_id:${userId}`
    }
    let options = {
        method: 'GET',
        uri: url, 
        headers: header,
        formData: param

    }

    let r = await rp(options)
        .catch((err) => {
            console.log(err);
        })
    let res = await r;
    return res;
}

//Read CSV
const main = async () => {
    const csvData = await csv().fromFile(csvPath);
    csvData.forEach((item) => {

        let mimeType = mime.lookup(item.image_filename);
        let imageLocation = `${workingPath}/${imagePath}/${item.image_filename}`;
        let stats = fs.statSync(imageLocation);
        let fName = item.image_filename;
        let fSize = stats.size;
        let userId = item.user_id;
        uploadFile(fName, mimeType, fSize, userId).then((res) => {
            const jRes = JSON.parse(res);
            let uploadParams = jRes.upload_params;
            let uploadURL = jRes.upload_url;

            uploadImage(uploadURL, uploadParams, imageLocation).then((res) => {
                let jImage = JSON.parse(res);
                let confirmationUrl = jImage.location;
                
                confirmUpload(confirmationUrl).then((re) => {
                    let confirmJ = JSON.parse(re);
                    console.log(confirmJ);

                    getAvatarOptions(userId).then((are) => {
                        console.log(are);
                    })

                })
                
            });
        })


    })

};


main();