require('dotenv').config();

const express = require('express');
const router  = express.Router();
const Minio   = require("minio");
const cors = require('cors');

var minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST,
  accessKey: process.env.MINIO_USER,
  secretKey: process.env.MINIO_PASS
});

router.use(cors());

// router.use((req,res,next)=>{
//   res.header('Access-Control-Allow-Origin','http://localhost:4200');
//   next;
// })

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get("/listBuckets",(req,res,next)=>{
  minioClient.listBuckets(function(err,buckets){
    if(err) return console.log(err);
    // console.log('buckets: ',buckets);
    res.json(buckets);
  })
})

// router.get("/createBucket", (req,res,next)=> {
//   minioClient.bucketExists('prub', function(err,exists){
//     if(err){
//       console.log(err);
//       res.send("Bucket no creado")
//     }
//     if(!exists){
//       minioClient.makeBucket('prub','us-east-1',function(err){
//         if(err) console.log(err);

//         // console.log("Bucket creado")
//         res.send("Bucket creado")
//       })
//     }
//   })
// })

router.get("/putFile",(req,res,next)=>{
  var file = "./tmp/zemo.jpg";
  var metaData = {
    'Content-Type': 'image/jpeg',
    'Content-Language': 123,
    'X-Amz-Meta-Testing': 1234,
    'example': 5678
  }
  minioClient.fPutObject('prub', 'zemokekw.jpg', file, metaData, function(err, objInfo) {
    if(err) {
        return console.log(err)
    }
    console.log("Success", objInfo.etag, objInfo.versionId)
  })
})

router.get("/bucketDetail/:name/getFile/:file", (req,res,next)=>{
  var size = 0;
  minioClient.fGetObject(req.params.name,req.params.file,'./tmp/'+req.params.file,function(err){
    if(err){
      return console.log(err);
    }
    console.log('success')
    const options = {
      root: './tmp',
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    }
    
    const fileName = req.params.file
    // res.json(fileName)
    res.sendFile(fileName, options, function (err) {
      if (err) {
        next(err)
      } else {
        console.log('Sent:', fileName)
      }
    })
  })
})

router.get("/bucketDetail/:name",(req,res,next)=>{
  var stream = minioClient.extensions.listObjectsV2WithMetadata(req.params.name,'',true,'')
  let objs = [];
  stream.on('data', function(obj) {
    objs.push(obj)
  })
  stream.on('end',function(){
    res.json(objs)
    // console.log(objs)
  })
  stream.on('error', function(err) {console.log(err)})
})

router.post("/bucketDetail/:name/uploadImage",(req,res,next)=>{
  console.log(req.params);
  console.log(req.file.filename)
  console.log(req.file.path)
  console.log(req.file.type)
  var file = req.file.path;
  var metaData = {
    'Content-Type': 'image/jpeg',
    'Content-Language': 123,
    'X-Amz-Meta-Testing': 1234,
    'example': 5678
  }
  minioClient.fPutObject(req.params.name, req.file.filename, file, metaData, function(err, objInfo) {
    if(err) {
        return console.log(err)
    }
    console.log("Success", objInfo.etag, objInfo.versionId)
    res.json("Image uploaded")
  })
})

router.delete("/bucketDetail/:name/deleteFile/:file",(req,res,next)=>{
  minioClient.removeObject(req.params.name,req.params.file,function(err){
    if(err){
      return console.log(err)
    }
    res.json("Object deleted")
  })
})


module.exports = router;
