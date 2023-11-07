const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
  origin: [
      'http://localhost:5173'
      
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url);
  next();
}
const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  
  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.noswvlt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)


    const foodsCollection = client.db('FoodDB').collection('FoodItems');
    const userCollection = client.db('FoodDB').collection('user');

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }) .send({ success: true });

    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })


    app.get('/foodsItem', async (req, res) => {
     
      const result = await foodsCollection.find()
        .toArray();
      res.send(result);
    })
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await foodsCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    })
    app.get('/topsell', async (req, res) => {

      const topsellproduct = await foodsCollection
        .find()
        .sort({ order_count: -1 })
        .limit(6)
        .toArray();
      res.send(topsellproduct);
    })
    app.get('/search', async (req, res) => {
      const searchQuery = req.query.name;
      console.log(searchQuery)
      const results = await foodsCollection
        .find({ food_name: { $regex: searchQuery, $options: 'i' } })
        .toArray();
      res.send(results)
    })
    app.get('/foodsCount', async (req, res) => {
      const count = await foodsCollection.estimatedDocumentCount();
      res.send({ count });
    })
    app.get('/foodDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query);
      res.send(result);
    })
    app.post('/user', async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.put('/foods', async (req, res) => {
      
      const food = req.body;
      const filter = { _id: new ObjectId(food._id) }
      
      const updateDoc = {
        $set: {
          order_count: food.order_count,
          quantity: food.quantity,
          time : food.time
        }
      }
      
      const result = await foodsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.get('/user/:email',logger,verifyToken, async (req, res) => {
      console.log('cookies',req.cookies)
      console.log('token owner info', req.user)
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden access'})
    }
      const email = req.params.email;
      console.log(email)
      const query = { email: email }
      console.log(query)
      const result = await userCollection.findOne(query);
      res.send(result);
    })
    app.patch('/user', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email }
      const updateDoc = {
        $set: {
          Myorder: user.Myorder
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.get('/food/:add_by',verifyToken, async (req, res) => {
      if(req.user.email !== req.params.add_by){
        return res.status(403).send({message: 'forbidden access'})
    }
      const add_by = req.params.add_by;
      console.log(add_by)
      const query = { Add_by: add_by }
      console.log(query)
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/addfood', async (req, res) => {
      const newfood = req.body;
      console.log(newfood);
      const result = await foodsCollection.insertOne(newfood);
      res.send(result);
    })
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedfood = req.body;

      const food = {
        $set: {
          food_name: updatedfood.food_name,
          food_image: updatedfood.food_image,
          food_category: updatedfood.food_category,
          quantity: updatedfood.quantity,
          price: updatedfood.price,
          food_origin: updatedfood.food_origin,
          description: updatedfood.description
        }
      }

      const result = await foodsCollection.updateOne(filter, food, options);
      res.send(result);
    })
    app.post('/foodsByIds', async(req, res) =>{
      const ids = req.body;
      const idsWithObjectId = ids.map(id => new ObjectId(id))
      const query = {
        _id: {
          $in: idsWithObjectId
        }
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('SERVER is Running');

})
app.listen(port, () => {
  console.log(`restaurent web server is running port${port}`)
})