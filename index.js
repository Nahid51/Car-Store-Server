const express = require('express');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const fileUpload = require('express-fileupload');

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bsutc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const database = client.db("CarStore");
    const userCollection = database.collection("users");
    const productCollection = database.collection("products");
    console.log('connected successfully');

    // add service data to database
    app.post('/products', async (req, res) => {
        const name = req.body.name;
        const description = req.body.description;
        const photo = req.files.image;
        const photoData = photo.data;
        const encodedPhoto = photoData.toString('base64');
        const photoBuffer = Buffer.from(encodedPhoto, 'base64');
        const product = {
            name, description, image: photoBuffer
        }
        const result = await productCollection.insertOne(product);
        res.send(result);
    })

    // get services from database
    app.get('/products', async (req, res) => {
        const cursor = productCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
    })

    // delete a single product
    app.delete("/products/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await productCollection.deleteOne(query);
        res.send(result);
    });

    //update product data
    app.put("/products/:id", async (req, res) => {
        const id = req.params.id;
        const product = req.body;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateFile = {
            $set: {
                name: product.name,
                description: product.description
            },
        };
        const result = await productCollection.updateOne(
            filter,
            updateFile,
            options
        );
        res.send(result);
    });



    // add new users (by registration) to database
    app.post('/users', async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    })

    // add users (by google login) to database
    app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    })

    // get users from database
    app.get('/users', async (req, res) => {
        const users = userCollection.find({});
        const result = await users.toArray();
        res.send(result);
    })
});




app.get('/', (req, res) => {
    res.send('Hello Node JS!')
})

app.listen(port, () => {
    console.log('Running server at port:', port)
})