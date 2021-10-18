const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const placeRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const app = express();


app.use(bodyParser.json());

//use() to make use of middleware 
app.use('/api/places',placeRoutes); //=> /api/places...

app.use('/api/users',userRoutes); //=> /api/users..

app.use((req,res,next)=>{
    const error = new HttpError('Could not find this route.',404);
    throw error;
});


//Error handling middleware function
app.use((error,req,res,next)=>{
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'Something went wrong :('});
});

mongoose.connect('mongodb+srv://kiran:ZthKuNG1aHWQqx2M@cluster0.d7jvj.mongodb.net/places?retryWrites=true&w=majority')
.then(()=>{
    app.listen(3000,()=>{
        console.log("Development Server Started!!!")
    });
})
.catch(err => {
    console.log(err);
});

