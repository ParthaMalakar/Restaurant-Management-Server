const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

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
        .sort({order_count: -1})
        .limit(6)
        .toArray();
        res.send(topsellproduct);
      })
   app.get('/search',async(req,res)=>{
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
    app.patch('/foods', async (req, res) => {
      const food = req.body;
      const filter = { _id:new ObjectId(food._id)  }
      console.log(filter)
      const updateDoc = {
        $set: {
          order_count: food.order_count,
          quantity:food.quantity
        }
      }
      console.log(updateDoc)
      const result = await foodsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.get('/user/:email', async (req, res) => {
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

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('SERVER is Running');

})
app.listen(port,()=>{
    console.log(`restaurent web server is running port${port}`)
})