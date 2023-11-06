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