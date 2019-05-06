// Get dependencies
var express = require('express');
var path = require('path');
var http = require('http');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var multer = require('multer');
var Readable = require('stream').Readable;
var Grid = require('gridfs-stream');
var GridFsStorage = require('multer-gridfs-storage');
fs = require('fs');
mkdirp = require('mkdirp');

var app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin", "GET", "POST", "PUT", "DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
var imageRoute = express.Router();
// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/image', imageRoute);

mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost:27017/bookmovie');
mongoose.connect('mongodb://anirudh:123456@ds131698.mlab.com:31698/bookmovie', { useMongoClient: true });
var conn = mongoose.connection;

conn.once('open', function () {
    console.log('Connected to DB');
});

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all other routes and return the index file
app.get('*', (req, res) => {
    console.log('Get Request', req);
    res.sendFile(path.join(__dirname, './dist/index.html'));
});

// Image Upload Process
// Grid.mongo = mongoose.mongo;
// var gfs = new Grid(conn.db);

// var storage = GridFsStorage({
//     url: 'mongodb://anirudh:123456@ds131698.mlab.com:31698/bookmovie',
//     gfs: gfs,
//     file: function (req, file) {
//         return { filename: req.body.name };
//     }
// });

var storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        var dest = './src/assets/';
        mkdirp.sync(dest);
        cb(null, dest)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
})
var upload1 = multer({ storage: storage1 });

// var upload = multer({
//     storage: storage
// }).single('image');


// Mongo DB congigure
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var objectid = require('mongodb').ObjectID;
//var url = "mongodb://localhost:27017/bookmovie";
var url = "mongodb://anirudh:123456@ds131698.mlab.com:31698/bookmovie";

// var url = new MongoClientURI(uri);
// var MongoClient = new MongoClient(url);

// Get Image Api
app.post('/getimage', function (req, res) {
    console.log('image', req.param.name);
    console.log('param', req.body.name);
    // var imageName = req.params.imageName;
    var imageName = req.body.name;
    res.set('content-type', 'image/*');
    res.set('accept-ranges', 'bytes');

    var id = { "_id": objectid("5a50a9d76304c60ef4cd22b4") }
    gfs.files.find(id).toArray(function (err, files) {
        console.log(files);
        if (!files || files.length === 0) {
            return res.status(404).json({
                responseCode: 1,
                responseMessage: "error"
            });
        }
        /** create read stream */
        console.log(files[0].filename);
        var readstream = gfs.createReadStream({
            filename: files[0].filename
        });
        /** set the proper content type */
        // res.set('Content-Type', files[0].contentType)
        /** return response */
        var bufs = [];
        readstream.on('data', function (chunk) {
            console.log(chunk);
            bufs.push(chunk);
        }).on('error', function () {
            res.send();
        })
            .on('end', function () { // done

                var fbuf = Buffer.concat(bufs);

                var File64 = (fbuf.toString('base64'));
                res.send(File64);
            });
    });
});

// Upload Image Api
app.post('/image', upload1.single('image'), function (req, res) {
    // upload1(req, res, function (err) {
    console.log('image', req.file);
    console.log('body', req.body);
    fs.renameSync('./src/assets/' + req.file.filename, './src/assets/' + req.file.originalname, function (err) {
        if (err) {
            console.log("error is", err);
        }
    });
    return res.status(201).json({ message: 'Image Uploaded', name: req.file.originalname })
    // });
    // upload(req, res, function (err) {
    //     console.log('File', req.file);
    //     console.log('imageName', req.body.name);
    //     req.file.filename = req.body.name;
    //     const file = JSON.parse(JSON.stringify(req.file));
    //     console.log('file ****', file);

    //     if (err) {
    //         return res.status(400).json({ message: 'Upload Failed' });
    //     }
    //     else if (!req.body.name) {
    //         return res.status(400).json({ message: 'No Name Found' });
    //     }
    //     var name = req.body.name;
    //     console.log(name);

    //     // Convert buffer to Readable Stream
    //     var readableImageStream = new Readable();
    //     readableImageStream.push(file.buffer);
    //     readableImageStream.push(null);

    //     var writestream = gfs.createWriteStream({ filename: name });
    //     var id = writestream.id;
    //     readableImageStream.pipe(writestream);

    //     writestream.on('error', function () {
    //         return res.status(500).json({ message: 'Error while uploading' })
    //     })
    //         .on('finish', function () {
    //             return res.status(201).json({ message: 'Image Uploaded', id: id, name: req.body.name })
    //         });
    // });
});

// Get our API routes
// const api = require('./server/routes/api');

// App Restful Api's

// ADD MovieData in MongoDB
app.post('/addMovie', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("moviedata").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("Movie inserted");
            db.close();
        });
    });
    res.send("Movie Inserted");
})

// Get Movies from MongoDB
app.post('/getMovies', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("moviedata").find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get movies");
            res.send(result);
            db.close();
        });
    });
})

// Update Movie Data
app.post('/updateMovie', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    req.body._id = objectid(req.body._id);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("moviedata").updateOne(id, req.body, function (err, result) {
            if (err) throw err;
            console.log("Update Movie");
            db.close();
        });
    });
    res.send("Update Movie");
})

// Delete Movie
app.post('/deleteMovie', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("moviedata").deleteOne(id, function (err, result) {
            if (err) throw err;
            console.log("Delete Movie");
            db.close();
        });
    });
    res.send("Delete Movie");
})

// ADD HallData in MongoDB
app.post('/addHall', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("halldata").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("Hall inserted");
            db.close();
        });
    });
    res.send("Hall Inserted");
})

// Get Hall from MongoDB
app.post('/getHall', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("halldata").find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get Hall");
            res.send(result);
            db.close();
        });
    });
})

// Update Hall Data
app.post('/updateHall', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    req.body._id = objectid(req.body._id);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("halldata").updateOne(id, req.body, function (err, result) {
            if (err) throw err;
            console.log("Update Hall");
            db.close();
        });
    });
    res.send("Update Hall");
})

// Delete Hall
app.post('/deleteHall', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("halldata").deleteOne(id, function (err, result) {
            if (err) throw err;
            console.log("Delete Hall");
            db.close();
        });
    });
    res.send("Delete Hall");
})

// Add Combined Data in MongoDB
app.post('/addCombinedData', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("combineddata").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("Combined Data inserted");
            db.close();
        });
    });
    res.send("Combined Data Inserted");
})

// Get Combined Data from MongoDB
app.post('/getCombinedData', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("combineddata").find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get Combined Data");
            res.send(result);
            db.close();
        });
    });
})

// Update Combined Data
app.post('/updateCombinedData', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    req.body._id = objectid(req.body._id);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("combineddata").updateOne(id, req.body, function (err, result) {
            if (err) throw err;
            console.log("Update Combined Data");
            db.close();
        });
    });
    res.send("Update Combined Data");
});

// Order Booking Data
var orderId;
// Book Order
app.post('/bookOrder', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("orderdata").insertOne(req.body, function (err, response) {
            if (err) throw err;
            orderId = response.insertedId;
            db.close();
            res.send({ message: "Order Inserted", orderId: orderId });
        });
    });
})

// Get Order
app.post('/getBookOrder', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("orderdata").find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get Order Data");
            res.send(result);
            db.close();
        });
    });
})

// Curent Order
app.post('/currentOrder', function (req, res) {
    console.log(req.body.orderId);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("orderdata").find({ "_id": objectid(req.body.orderId) }).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get Order");
            res.send(result);
            db.close();
        });
    });
})

// ADD User in MongoDB
app.post('/addUser', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("userdb").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("inserted user");
            db.close();
        });
    });
    res.send("User Inserted");
})

// Get Users from MongoDB
app.post('/loginUser', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("userdb").find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get users");
            res.send(result);
            db.close();
        });
    });
})

// Get User from MongoDB
app.post('/currentUser', function (req, res) {
    console.log(req.body.userId);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("userdb").find({ "_id": objectid(req.body.userId) }).toArray(function (err, result) {
            if (err) throw err;
            console.log("Get user");
            res.send(result);
            db.close();
        });
    });
})

// Update User Data
app.post('/editUser', function (req, res) {
    console.log(req.body);
    var id = { "_id": objectid(req.body._id) }
    req.body._id = objectid(req.body._id);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("userdb").updateOne(id, req.body, function (err, result) {
            if (err) throw err;
            console.log("Update user");
            db.close();
        });
    });
    res.send("Update user");
})

// ADD HallData in MongoDB
app.post('/addhalldata', function (req, res) {
    console.log(req.body);
    // Connect with Mongo Client
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection("halldata").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("HallData Added");
            db.close();
        });
    });
    res.send("HallData Added");
})

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '8080';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));